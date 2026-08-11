package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.CreateOwnerCommand;
import com.smartqueue.application.port.in.result.OwnerAccount;

import java.util.List;

/** Onboarding and listing of shop owners. SUPER_ADMIN-only (enforced at the web layer). */
public interface ManageOwnersUseCase {

    /** Creates a SHOP_OWNER account. Fails if the email (or phone, if given) is taken. */
    OwnerAccount createOwner(CreateOwnerCommand command);

    /** All owners, oldest first, each with its current shop count. */
    List<OwnerAccount> findAll();

    OwnerAccount findById(String ownerId);
}
