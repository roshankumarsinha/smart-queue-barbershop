package com.smartqueue.adapter.in.web.dto.whatsapp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Meta's WhatsApp webhook envelope, trimmed to the fields this app reads. Every level
 * ignores unknown properties — status/delivery-receipt events and metadata we don't
 * use share this same shape, and a Graph API version bump routinely adds fields we've
 * never heard of.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WhatsAppWebhookPayload(String object, List<Entry> entry) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Entry(List<Change> changes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Change(Value value) {
    }

    /** {@code messages} is absent on delivery-receipt ("statuses") callbacks. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Value(List<InboundMessage> messages) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InboundMessage(String from, String type, TextBody text, Interactive interactive) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TextBody(String body) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Interactive(
            String type,
            @JsonProperty("list_reply") Reply listReply,
            @JsonProperty("button_reply") Reply buttonReply) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Reply(String id, String title) {
    }
}
