package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.InboundWhatsAppMessage;

public interface HandleWhatsAppMessageUseCase {

    void handle(InboundWhatsAppMessage message);
}
