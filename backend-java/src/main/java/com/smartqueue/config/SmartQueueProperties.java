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
     * When both values are present the notification adapter switches from logging
     * to a real WhatsApp Cloud API call.
     */
    public record Whatsapp(String token, String phoneNumberId) {

        public boolean isLive() {
            return token != null && !token.isBlank()
                    && phoneNumberId != null && !phoneNumberId.isBlank();
        }
    }
}
