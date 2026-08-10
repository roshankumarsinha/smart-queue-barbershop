package com.smartqueue.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Everything that used to live in the NestJS .env, typed and validated at startup.
 * Values come from application.yml, overridable by environment variables
 * (e.g. {@code SMARTQUEUE_JWT_SECRET}).
 */
@ConfigurationProperties(prefix = "smartqueue")
public record SmartQueueProperties(Jwt jwt, Cors cors, Whatsapp whatsapp) {

    public record Jwt(String secret, Duration expiration) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    /**
     * When both {@code token} and {@code phoneNumberId} are present the notification
     * adapter switches from logging to a real WhatsApp Cloud API call.
     *
     * @param verifyToken a secret only we and Meta know, echoed back on the webhook's
     *                    GET verification handshake — not the same as {@code token}
     * @param appSecret   signs inbound webhook payloads (X-Hub-Signature-256); when
     *                    blank, incoming webhooks are processed without verifying they
     *                    actually came from Meta — fine for local dev, not production
     * @param apiBaseUrl  overridable so tests can point this at a local stub instead of
     *                    the real Graph API
     */
    public record Whatsapp(
            String token,
            String phoneNumberId,
            String verifyToken,
            String appSecret,
            String apiBaseUrl) {

        public boolean isLive() {
            return token != null && !token.isBlank()
                    && phoneNumberId != null && !phoneNumberId.isBlank();
        }

        public boolean verifiesSignatures() {
            return appSecret != null && !appSecret.isBlank();
        }
    }
}
