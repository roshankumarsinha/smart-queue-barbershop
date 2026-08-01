package com.smartqueue.application.port.out;

import com.smartqueue.domain.model.User;

public interface AccessTokenIssuer {

    /** Returns a signed bearer token carrying the user id as subject and their role. */
    String issue(User user);
}
