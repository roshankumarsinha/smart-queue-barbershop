package com.smartqueue.application.port.out;

import java.util.List;

/**
 * Outbound seam for the conversational WhatsApp bot — sending a prompt or a tappable
 * menu, as opposed to {@link NotificationSender}'s one-way queue-event messages. Both
 * ultimately hit the same Graph API, but this is what the webhook flow uses to drive
 * a back-and-forth conversation.
 */
public interface WhatsAppClient {

    void sendText(String to, String body);

    /**
     * A tappable list menu (WhatsApp "interactive list" message). At most 10 rows fit
     * in a single section on the Cloud API — callers are responsible for staying under
     * that themselves, since a raw truncation here would silently hide options.
     *
     * @param bodyText   the prompt shown above the menu button
     * @param buttonText label on the button that opens the list (max ~20 chars)
     */
    void sendList(String to, String bodyText, String buttonText, List<ListRow> rows);

    /** One selectable row. {@code id} is what comes back in the customer's reply. */
    record ListRow(String id, String title, String description) {
    }

    /**
     * Up to 3 tappable quick-reply buttons (WhatsApp "interactive button" message) —
     * lighter-weight than a list, for a small fixed set of actions like checking status
     * or leaving the queue.
     */
    void sendButtons(String to, String bodyText, List<Button> buttons);

    /** One button. {@code id} is what comes back in the customer's reply. */
    record Button(String id, String title) {
    }
}
