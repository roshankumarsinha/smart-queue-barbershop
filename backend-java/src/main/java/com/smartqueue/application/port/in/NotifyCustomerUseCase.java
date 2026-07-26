package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.NotifyCustomerCommand;

public interface NotifyCustomerUseCase {

    /** Staff-triggered, ad-hoc message to one customer in the queue. */
    void notifyCustomer(NotifyCustomerCommand command);
}
