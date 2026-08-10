package com.smartqueue.adapter.out.notification;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartqueue.application.port.out.NotificationSender;
import com.smartqueue.application.port.out.WhatsAppClient;
import com.smartqueue.config.SmartQueueProperties;
import com.smartqueue.domain.NotificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * The one place that talks to the WhatsApp Cloud API — both the one-way queue-event
 * notifications ({@link NotificationSender}) and the conversational bot's prompts and
 * menus ({@link WhatsAppClient}) end up here, since both are just POSTs to the same
 * {@code /messages} endpoint with a different payload shape.
 *
 * <p>Runs in free "stub" mode by default: it logs instead of sending, so development
 * costs nothing and needs no Meta account. Setting {@code SMARTQUEUE_WHATSAPP_TOKEN} +
 * {@code SMARTQUEUE_WHATSAPP_PHONE_NUMBER_ID} flips it to live mode.
 */
@Component
class WhatsAppCloudApiClient implements NotificationSender, WhatsAppClient {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudApiClient.class);

    // WhatsApp Cloud API hard limits on interactive list messages.
    private static final int MAX_ROW_TITLE = 24;
    private static final int MAX_ROW_DESCRIPTION = 72;
    private static final int MAX_BUTTON_TEXT = 20;
    private static final String DEFAULT_SECTION_TITLE = "Options";

    private final SmartQueueProperties.Whatsapp whatsapp;
    private final RestClient restClient;

    WhatsAppCloudApiClient(SmartQueueProperties properties) {
        this.whatsapp = properties.whatsapp();
        this.restClient = RestClient.builder().baseUrl(whatsapp.apiBaseUrl()).build();
    }

    @Override
    public void send(String phone, NotificationType type, String message) {
        if (whatsapp.isLive() && phone != null) {
            post(new OutboundMessage(phone, "text", new TextBody(message), null));
        } else {
            log.info("[stub] WhatsApp -> {} ({}): {}", phone != null ? phone : "no-phone", type, message);
        }
    }

    @Override
    public void sendText(String to, String body) {
        if (!whatsapp.isLive()) {
            log.info("[stub] WhatsApp -> {}: {}", to, body);
            return;
        }
        post(new OutboundMessage(to, "text", new TextBody(body), null));
    }

    @Override
    public void sendList(String to, String bodyText, String buttonText, List<ListRow> rows) {
        if (!whatsapp.isLive()) {
            log.info("[stub] WhatsApp list -> {}: {} ({} option(s))", to, bodyText, rows.size());
            return;
        }
        List<Row> metaRows = rows.stream()
                .map(r -> new Row(r.id(), truncate(r.title(), MAX_ROW_TITLE), truncate(r.description(), MAX_ROW_DESCRIPTION)))
                .toList();
        Interactive interactive = new Interactive(
                "list",
                new Body(bodyText),
                new ListAction(truncate(buttonText, MAX_BUTTON_TEXT), List.of(new Section(DEFAULT_SECTION_TITLE, metaRows))));
        post(new OutboundMessage(to, "interactive", null, interactive));
    }

    @Override
    public void sendButtons(String to, String bodyText, List<Button> buttons) {
        if (!whatsapp.isLive()) {
            log.info("[stub] WhatsApp buttons -> {}: {} ({} option(s))", to, bodyText, buttons.size());
            return;
        }
        List<ButtonEntry> metaButtons = buttons.stream()
                .map(b -> new ButtonEntry(new Reply(b.id(), truncate(b.title(), MAX_BUTTON_TEXT))))
                .toList();
        Interactive interactive = new Interactive("button", new Body(bodyText), new ButtonsAction(metaButtons));
        post(new OutboundMessage(to, "interactive", null, interactive));
    }

    /**
     * A failed send must not take down whatever triggered it — a queue mutation, or the
     * webhook handler reacting to a customer's message — so this only logs, matching how
     * {@link NotificationSender} already treats delivery as best-effort.
     */
    private void post(OutboundMessage message) {
        try {
            restClient.post()
                    .uri("/{phoneNumberId}/messages", whatsapp.phoneNumberId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + whatsapp.token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(message)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("WhatsApp send failed (to={}): {}", message.to(), e.getMessage());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null || s.length() <= max) {
            return s;
        }
        return s.substring(0, max - 1) + "…";
    }

    // --- Graph API request shape -------------------------------------------------

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record OutboundMessage(
            @JsonProperty("messaging_product") String messagingProduct,
            String to,
            String type,
            TextBody text,
            Interactive interactive) {

        OutboundMessage(String to, String type, TextBody text, Interactive interactive) {
            this("whatsapp", to, type, text, interactive);
        }
    }

    private record TextBody(String body) {
    }

    /**
     * {@code action} is deliberately {@link Object}: a "list" message and a "button"
     * message shape it completely differently ({@link ListAction} vs {@link ButtonsAction}),
     * and Jackson serialises by runtime type for an outbound-only field like this one.
     */
    private record Interactive(String type, Body body, Object action) {
    }

    private record Body(String text) {
    }

    private record ListAction(String button, List<Section> sections) {
    }

    private record Section(String title, List<Row> rows) {
    }

    private record Row(String id, String title, String description) {
    }

    private record ButtonsAction(List<ButtonEntry> buttons) {
    }

    private record ButtonEntry(String type, Reply reply) {
        ButtonEntry(Reply reply) {
            this("reply", reply);
        }
    }

    private record Reply(String id, String title) {
    }
}
