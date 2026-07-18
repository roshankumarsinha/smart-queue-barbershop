import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueueGateway } from './queue.gateway';
import { QueueStatus } from '../common/constants';

const ACTIVE = [QueueStatus.WAITING, QueueStatus.IN_SERVICE];

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

  // --- Writes ----------------------------------------------------------------

  // Customer self-join (normally via WhatsApp) or staff walk-in — same logic.
  async join(input: {
    shopId: string;
    service: string;
    phone?: string;
    name?: string;
  }) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: input.shopId },
    });
    if (!shop) throw new NotFoundException('Shop not found');

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

    const ahead = await this.prisma.queueEntry.count({
      where: {
        shopId: input.shopId,
        status: { in: ACTIVE },
        position: { lt: entry.position },
      },
    });

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

      // Give the following customer a heads-up.
      const onDeck = await this.prisma.queueEntry.findFirst({
        where: { shopId, status: QueueStatus.WAITING },
        orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
      });
      if (onDeck) {
        await this.notifications.notify(
          onDeck.id,
          'ALMOST_YOUR_TURN',
          `You're next (token #${onDeck.token}). Start heading over.`,
        );
      }
    }

    await this.emit(shopId);
    return { served: current ?? null, nowServing: next ?? null };
  }

  // Move a customer to the end of the waiting list.
  async skip(entryId: string) {
    const entry = await this.getEntry(entryId);

    const lastActive = await this.prisma.queueEntry.findFirst({
      where: { shopId: entry.shopId, status: { in: ACTIVE } },
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

    await this.emit(entry.shopId);
    return updated;
  }

  async leave(entryId: string) {
    const entry = await this.getEntry(entryId);
    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueStatus.LEFT },
    });
    await this.notifications.notify(
      entryId,
      'REMOVED',
      'You have left the queue. Message us again to rejoin.',
    );
    await this.emit(entry.shopId);
    return updated;
  }

  async markNoShow(entryId: string) {
    const entry = await this.getEntry(entryId);
    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueStatus.NO_SHOW },
    });
    await this.emit(entry.shopId);
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

  private async getEntry(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    return entry;
  }

  private async emit(shopId: string) {
    const state = await this.getStatus(shopId);
    this.gateway.emitQueueUpdate(shopId, state);
  }
}
