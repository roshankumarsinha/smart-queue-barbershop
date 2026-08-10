package com.smartqueue.application.port.in.command;

/**
 * One inbound WhatsApp message, already stripped of Meta's webhook envelope.
 *
 * @param from               the sender's phone number, WhatsApp's format (no leading +)
 * @param text               free-text body, e.g. "Hi" — null for a list-reply message
 * @param interactiveReplyId the row id from {@link com.smartqueue.application.port.out.WhatsAppClient.ListRow}
 *                            when this message is the customer tapping a menu option — null for free text
 */
public record InboundWhatsAppMessage(String from, String text, String interactiveReplyId) {

    public boolean isInteractiveReply() {
        return interactiveReplyId != null;
    }
}
