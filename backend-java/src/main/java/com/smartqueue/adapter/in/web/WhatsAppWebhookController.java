package com.smartqueue.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartqueue.adapter.in.web.dto.whatsapp.WhatsAppWebhookPayload;
import com.smartqueue.application.port.in.HandleWhatsAppMessageUseCase;
import com.smartqueue.application.port.in.command.InboundWhatsAppMessage;
import com.smartqueue.config.SmartQueueProperties;
import io.swagger.v3.oas.annotations.Hidden;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Meta calls this, not our own frontend — {@code GET} is the one-time webhook
 * verification handshake, {@code POST} is every inbound message. Not part of the
 * documented app API, so it's hidden from the OpenAPI spec.
 */
@Hidden
@RestController
@RequestMapping("/webhook/whatsapp")
class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);
    private static final String SIGNATURE_HEADER = "X-Hub-Signature-256";
    private static final String SIGNATURE_PREFIX = "sha256=";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final HandleWhatsAppMessageUseCase handler;
    private final SmartQueueProperties.Whatsapp whatsapp;
    private final ObjectMapper objectMapper = new ObjectMapper();

    WhatsAppWebhookController(HandleWhatsAppMessageUseCase handler, SmartQueueProperties properties) {
        this.handler = handler;
        this.whatsapp = properties.whatsapp();
    }

    /** Meta's one-time handshake when you save the webhook URL in the App Dashboard. */
    @GetMapping
    ResponseEntity<String> verify(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {
        if (!"subscribe".equals(mode) || !constantTimeEquals(whatsapp.verifyToken(), token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(challenge);
    }

    /**
     * Every inbound message, and every delivery/read receipt, lands here. Always
     * answers 200 for a structurally valid, correctly signed call — Meta interprets
     * anything else as "retry, and eventually disable this webhook", so a processing
     * failure below is logged and swallowed rather than surfaced as an HTTP error.
     */
    @PostMapping
    ResponseEntity<Void> receive(
            @RequestBody String rawBody, @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature) {
        if (whatsapp.verifiesSignatures() && !signatureValid(rawBody, signature)) {
            log.warn("Rejected a WhatsApp webhook call with a missing or invalid signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            WhatsAppWebhookPayload payload = objectMapper.readValue(rawBody, WhatsAppWebhookPayload.class);
            inboundMessages(payload).forEach(handler::handle);
        } catch (Exception e) {
            log.warn("Failed to process a WhatsApp webhook payload", e);
        }
        return ResponseEntity.ok().build();
    }

    private static Stream<InboundWhatsAppMessage> inboundMessages(WhatsAppWebhookPayload payload) {
        if (payload.entry() == null) {
            return Stream.empty();
        }
        return payload.entry().stream()
                .filter(Objects::nonNull)
                .flatMap(e -> e.changes() == null ? Stream.empty() : e.changes().stream())
                .filter(Objects::nonNull)
                .map(WhatsAppWebhookPayload.Change::value)
                .filter(Objects::nonNull)
                .flatMap(v -> v.messages() == null ? Stream.empty() : v.messages().stream())
                .filter(Objects::nonNull)
                .map(WhatsAppWebhookController::toCommand);
    }

    private static InboundWhatsAppMessage toCommand(WhatsAppWebhookPayload.InboundMessage m) {
        String text = m.text() != null ? m.text().body() : null;
        String replyId = null;
        if (m.interactive() != null) {
            if (m.interactive().listReply() != null) {
                replyId = m.interactive().listReply().id();
            } else if (m.interactive().buttonReply() != null) {
                replyId = m.interactive().buttonReply().id();
            }
        }
        return new InboundWhatsAppMessage(m.from(), text, replyId);
    }

    /** HMAC-SHA256 of the raw body, keyed by the Meta app secret — see Meta's webhook security docs. */
    private boolean signatureValid(String rawBody, String signatureHeader) {
        if (signatureHeader == null || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(whatsapp.appSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            String computedHex = HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));
            return constantTimeEquals(computedHex, signatureHeader.substring(SIGNATURE_PREFIX.length()));
        } catch (GeneralSecurityException e) {
            log.error("WhatsApp webhook signature check failed unexpectedly", e);
            return false;
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
