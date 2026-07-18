import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Sends customer notifications. Runs in FREE "stub" mode by default (logs the
// message instead of sending) so nothing costs money and no external account is
// required to develop. When WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set,
// swap the stub for a real Meta WhatsApp Cloud API call (also has a free tier).
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get isLive(): boolean {
    return (
      !!this.config.get<string>('WHATSAPP_TOKEN') &&
      !!this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')
    );
  }

  // type: JOINED | ALMOST_YOUR_TURN | YOUR_TURN | REMOVED
  async notify(queueEntryId: string, type: string, message: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
    });
    if (!entry) return;

    if (this.isLive && entry.phone) {
      await this.sendWhatsApp(entry.phone, message);
    } else {
      this.logger.log(
        `[stub] WhatsApp -> ${entry.phone ?? 'no-phone'} (${type}): ${message}`,
      );
    }

    await this.prisma.notification.create({
      data: { queueEntryId, type, channel: 'whatsapp' },
    });
  }

  // TODO: implement the real Meta WhatsApp Cloud API call here, e.g.
  //   POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
  //   Authorization: Bearer {WHATSAPP_TOKEN}
  //   body: { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }
  // (Meta's Cloud API has a free conversation tier.)
  private async sendWhatsApp(to: string, message: string): Promise<void> {
    this.logger.warn(
      `WhatsApp live-send not implemented yet (to=${to}). Message: ${message}`,
    );
  }
}
