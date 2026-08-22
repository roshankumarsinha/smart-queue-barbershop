package com.smartqueue.application.port.in.command;

/**
 * Register a barber under a shop. {@code shopId} is deliberately not a field here —
 * the caller (web layer) has already loaded and authorized the {@code Shop}, so it's
 * passed alongside this command rather than duplicated inside it, matching
 * {@code AddServiceCommand}. {@code pin} is what the barber signs in with (phone + PIN).
 */
public record CreateStaffCommand(String name, String phone, String pin) {
}
