package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.JoinQueueCommand;
import com.smartqueue.application.port.in.result.JoinQueueResult;

public interface JoinQueueUseCase {

    JoinQueueResult join(JoinQueueCommand command);
}
