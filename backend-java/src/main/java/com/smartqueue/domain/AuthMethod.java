package com.smartqueue.domain;

/** How a role proves who it is: owners/admins use email+password, barbers phone+PIN. */
public enum AuthMethod {
    EMAIL,
    PHONE
}
