package com.smartqueue.adapter.out.notification;

import com.smartqueue.application.port.out.NotificationSender;
import com.smartqueue.config.SmartQueueProperties;
import com.smartqueue.domain.NotificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Runs in free "stub" mode by default: it logs the message instead of sending, so
 * development costs nothing and needs no Meta account. Setting
 * {@code SMARTQUEUE_WHATSAPP_TOKEN} + {@code SMARTQUEUE_WHATSAPP_PHONE_NUMBER_ID}
 * flips it to live mode.
 */
@Component
class WhatsAppNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationSender.class);

    private final SmartQueueProperties.Whatsapp whatsapp;

    WhatsAppNotificationSender(SmartQueueProperties properties) {
        this.whatsapp = properties.whatsapp();
    }

    @Override
    public void send(String phone, NotificationType type, String message) {
        if (whatsapp.isLive() && phone != null) {
            sendViaCloudApi(phone, message);
        } else {
            log.info("[stub] WhatsApp -> {} ({}): {}", phone != null ? phone : "no-phone", type, message);
        }
    }

    /**
     * TODO: implement the real Meta WhatsApp Cloud API call here, e.g.
     *   POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
     *   Authorization: Bearer {token}
     *   body: { messaging_product: "whatsapp", to, type: "text", text: { body: message } }
     * (Meta's Cloud API has a free conversation tier.) A RestClient bean is all this needs.
     */
    private void sendViaCloudApi(String to, String message) {
        log.warn("WhatsApp live-send not implemented yet (to={}). Message: {}", to, message);
    }
}
