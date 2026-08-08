import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { QueueEntry, Shop } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueueGateway } from './queue.gateway';
import { QueueStatus } from '../common/constants';

const ACTIVE = [QueueStatus.WAITING, QueueStatus.IN_SERVICE];

// How many of the waiting customers get an ALMOST_YOUR_TURN nudge when the queue moves.
const HEADS_UP_CUSTOMERS = 2;

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gateway: QueueGateway,
  ) {}

  // --- Reads -----------------------------------------------------------------

  async getStatus(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const serving = await this.prisma.queueEntry.findFirst({
      where: { shopId, status: QueueStatus.IN_SERVICE },
    });
    const waiting = await this.prisma.queueEntry.findMany({
      where: { shopId, status: QueueStatus.WAITING },
      orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
    });

    return {
      shopId,
      serving,
      waiting,
      totalWaiting: waiting.length,
      avgServiceTime: shop.avgServiceTime,
      estimatedWaitMinutes: waiting.length * shop.avgServiceTime,
    };
  }

  // A single customer's live status — their place in line and time remaining. This is
  // the polling endpoint the WhatsApp flow / customer app calls after joining; the
  // entryId returned by /queue/join is the only credential needed.
  //
  // Ahead/wait are only meaningful while WAITING — an entry already IN_SERVICE has
  // nobody left ahead of it, and one that's DONE/LEFT/NO_SHOW has nothing left to wait
  // for, so both read as zero rather than a stale figure from before the status changed.
  async entryStatus(entryId: string) {
    const entry = await this.getEntry(entryId);
    if (entry.status !== QueueStatus.WAITING) {
      return { entry, ahead: 0, estimatedWaitMinutes: 0 };
    }

    const shop = await this.requireShop(entry.shopId);
    const ahead = await this.countActiveAhead(shop.id, entry.position);
    return { entry, ahead, estimatedWaitMinutes: ahead * shop.avgServiceTime };
  }

  // --- Writes ----------------------------------------------------------------

  // Customer self-join (normally via WhatsApp) or staff walk-in — same logic.
  async join(input: {
    shopId: string;
    service: string;
    phone?: string;
    name?: string;
  }) {
    const shop = await this.requireShop(input.shopId);
    // A closed shop rejects both a customer messaging in and a staff walk-in — neither
    // should be able to queue up somewhere that isn't taking customers.
    if (!shop.active) {
      throw new ConflictException('This shop is currently closed');
    }

    const [lastToken, lastActive] = await Promise.all([
      this.prisma.queueEntry.findFirst({
        where: { shopId: input.shopId },
        orderBy: { token: 'desc' },
        select: { token: true },
      }),
      this.prisma.queueEntry.findFirst({
        where: { shopId: input.shopId, status: { in: ACTIVE } },
        orderBy: { position: 'desc' },
        select: { position: true },
      }),
    ]);

    const entry = await this.prisma.queueEntry.create({
      data: {
        shopId: input.shopId,
        token: (lastToken?.token ?? 0) + 1,
        position: (lastActive?.position ?? 0) + 1,
        service: input.service,
        phone: input.phone,
        customerName: input.name,
        status: QueueStatus.WAITING,
      },
    });

    const ahead = await this.countActiveAhead(input.shopId, entry.position);

    await this.notifications.notify(
      entry.id,
      'JOINED',
      `You're token #${entry.token}. ${ahead} ahead of you, ~${ahead * shop.avgServiceTime} min wait.`,
    );
    await this.emit(input.shopId);

    return { entry, ahead, estimatedWaitMinutes: ahead * shop.avgServiceTime };
  }

  // Advance the queue: finish the current customer, promote the next one.
  async next(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    // Complete whoever is currently being served.
    const current = await this.prisma.queueEntry.findFirst({
      where: { shopId, status: QueueStatus.IN_SERVICE },
    });
    if (current) {
      await this.prisma.queueEntry.update({
        where: { id: current.id },
        data: { status: QueueStatus.DONE },
      });
    }

    // Promote the next waiting customer.
    const next = await this.prisma.queueEntry.findFirst({
      where: { shopId, status: QueueStatus.WAITING },
      orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
    });
    if (next) {
      await this.prisma.queueEntry.update({
        where: { id: next.id },
        data: { status: QueueStatus.IN_SERVICE },
      });
      await this.notifications.notify(
        next.id,
        'YOUR_TURN',
        `It's your turn! Please head to the chair (token #${next.token}).`,
      );
    }

    // Whoever is now at the front of the line has moved up — tell them.
    await this.notifyOnDeck(shop);

    await this.emit(shopId);
    return { served: current ?? null, nowServing: next ?? null };
  }

  // Move a customer to the end of the waiting list. Skipping only pulls the front of
  // the line forward when the skipped entry was itself in it — someone at position 5
  // skipping doesn't change who's #1 or #2, so nothing is re-sent in that case.
  async skip(entryId: string) {
    const entry = await this.getEntry(entryId);
    const shop = await this.requireShop(entry.shopId);
    const wasOnDeck = await this.isOnDeck(shop.id, entry);

    const lastActive = await this.prisma.queueEntry.findFirst({
      where: { shopId: shop.id, status: { in: ACTIVE } },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: QueueStatus.WAITING,
        position: (lastActive?.position ?? 0) + 1,
      },
    });

    if (wasOnDeck) await this.notifyOnDeck(shop);
    await this.emit(shop.id);
    return updated;
  }

  // Leaving drops this entry out of the active queue; see skip() for why the nudge is conditional.
  async leave(entryId: string) {
    const entry = await this.getEntry(entryId);
    const shop = await this.requireShop(entry.shopId);
    const wasOnDeck = await this.isOnDeck(shop.id, entry);

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueStatus.LEFT },
    });
    await this.notifications.notify(
      entryId,
      'REMOVED',
      'You have left the queue. Message us again to rejoin.',
    );

    if (wasOnDeck) await this.notifyOnDeck(shop);
    await this.emit(shop.id);
    return updated;
  }

  // A no-show drops this entry out of the active queue; see skip() for why the nudge is conditional.
  async markNoShow(entryId: string) {
    const entry = await this.getEntry(entryId);
    const shop = await this.requireShop(entry.shopId);
    const wasOnDeck = await this.isOnDeck(shop.id, entry);

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueStatus.NO_SHOW },
    });

    if (wasOnDeck) await this.notifyOnDeck(shop);
    await this.emit(shop.id);
    return updated;
  }

  async sendNotification(entryId: string, type: string, message?: string) {
    await this.getEntry(entryId); // 404 if missing
    await this.notifications.notify(
      entryId,
      type,
      message ?? 'Update from your barbershop.',
    );
    return { ok: true };
  }

  // --- Helpers ---------------------------------------------------------------

  private async requireShop(shopId: string): Promise<Shop> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  private async getEntry(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    return entry;
  }

  // Customers (including whoever is in the chair) still ahead of this position.
  private countActiveAhead(shopId: string, position: number) {
    return this.prisma.queueEntry.count({
      where: { shopId, status: { in: ACTIVE }, position: { lt: position } },
    });
  }

  private waitingOrdered(shopId: string) {
    return this.prisma.queueEntry.findMany({
      where: { shopId, status: QueueStatus.WAITING },
      orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  // True if this entry is one of the first HEADS_UP_CUSTOMERS in the waiting list —
  // i.e. removing or requeuing it will actually change who's on deck. Ranked the same
  // way notifyOnDeck ranks people, not via countActiveAhead (which also counts whoever
  // is IN_SERVICE and would throw the two rankings out of sync). Must be checked before
  // the entry is mutated, while it still sits in its current spot.
  private async isOnDeck(shopId: string, entry: QueueEntry): Promise<boolean> {
    const waiting = await this.waitingOrdered(shopId);
    const rank = waiting.findIndex((e) => e.id === entry.id);
    return rank >= 0 && rank < HEADS_UP_CUSTOMERS;
  }

  // Nudges the first HEADS_UP_CUSTOMERS waiting customers with their current place in
  // line and wait estimate. Called after any mutation that changes who is at the front.
  private async notifyOnDeck(shop: Shop) {
    const onDeck = await this.waitingOrdered(shop.id);
    for (let i = 0; i < Math.min(HEADS_UP_CUSTOMERS, onDeck.length); i++) {
      const next = onDeck[i];
      const ahead = await this.countActiveAhead(shop.id, next.position);
      await this.notifications.notify(
        next.id,
        'ALMOST_YOUR_TURN',
        headsUpMessage(next, i + 1, ahead * shop.avgServiceTime),
      );
    }
  }

  private async emit(shopId: string) {
    const state = await this.getStatus(shopId);
    this.gateway.emitQueueUpdate(shopId, state);
  }
}

// Only the customer at the front is told to start moving; the one behind just gets the estimate.
function headsUpMessage(
  entry: QueueEntry,
  placeInLine: number,
  waitMinutes: number,
): string {
  return placeInLine === 1
    ? `You're next (token #${entry.token}), about ${waitMinutes} min. Start heading over.`
    : `You're #${placeInLine} in line (token #${entry.token}), about ${waitMinutes} min.`;
}
