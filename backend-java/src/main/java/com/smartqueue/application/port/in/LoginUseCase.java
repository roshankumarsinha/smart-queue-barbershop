package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.LoginCommand;
import com.smartqueue.application.port.in.result.AuthenticatedSession;

public interface LoginUseCase {

    AuthenticatedSession login(LoginCommand command);
}
