package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.AdvanceQueueResponse;
import com.smartqueue.adapter.in.web.dto.EntryIdRequest;
import com.smartqueue.adapter.in.web.dto.JoinQueueRequest;
import com.smartqueue.adapter.in.web.dto.JoinQueueResponse;
import com.smartqueue.adapter.in.web.dto.NotifyRequest;
import com.smartqueue.adapter.in.web.dto.QueueEntryResponse;
import com.smartqueue.adapter.in.web.dto.QueueEntryStatusResponse;
import com.smartqueue.adapter.in.web.dto.QueueStatusResponse;
import com.smartqueue.adapter.in.web.dto.ShopIdRequest;
import com.smartqueue.application.port.in.AdvanceQueueUseCase;
import com.smartqueue.application.port.in.GetQueueStatusUseCase;
import com.smartqueue.application.port.in.JoinQueueUseCase;
import com.smartqueue.application.port.in.NotifyCustomerUseCase;
import com.smartqueue.application.port.in.UpdateQueueEntryUseCase;
import com.smartqueue.application.port.in.command.JoinQueueCommand;
import com.smartqueue.application.port.in.command.NotifyCustomerCommand;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/queue")
@Validated
@Tag(name = "Queue", description = "Live queue: customers join and leave, staff advance it")
public class QueueController {

    /** Roles allowed to operate the live dashboard. */
    private static final String STAFF = "hasAnyRole('SHOP_OWNER', 'BARBER_STAFF')";

    private final GetQueueStatusUseCase status;
    private final JoinQueueUseCase join;
    private final AdvanceQueueUseCase advance;
    private final UpdateQueueEntryUseCase update;
    private final NotifyCustomerUseCase notify;

    public QueueController(
            GetQueueStatusUseCase status,
            JoinQueueUseCase join,
            AdvanceQueueUseCase advance,
            UpdateQueueEntryUseCase update,
            NotifyCustomerUseCase notify) {
        this.status = status;
        this.join = join;
        this.advance = advance;
        this.update = update;
        this.notify = notify;
    }

    // --- Public (customer / WhatsApp side) ------------------------------------

    /**
     * Customer checks their own status. This is the polling endpoint the WhatsApp
     * flow / customer app calls after joining — the entryId returned by /queue/join
     * is the only credential needed, the same way {@link #leave} works.
     */
    @Operation(
            summary = "Check one customer's status",
            description = "Public. Returns the entry's current status, how many are still ahead, "
                    + "and the updated wait estimate.")
    @GetMapping("/status/{entryId}")
    public QueueEntryStatusResponse entryStatus(@PathVariable @NotBlank String entryId) {
        return QueueEntryStatusResponse.from(status.entryStatus(entryId));
    }

    /**
     * Customer joins the queue. In production this is triggered by the WhatsApp
     * webhook; exposed here for the app and for testing.
     */
    @Operation(
            summary = "Customer joins the queue",
            description = "Public. Returns the assigned token, how many are ahead, and the wait estimate.")
    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    public JoinQueueResponse join(@Valid @RequestBody JoinQueueRequest request) {
        return JoinQueueResponse.from(join.join(toCommand(request)));
    }

    /** Customer leaves the queue. */
    @Operation(summary = "Customer leaves the queue", description = "Public.")
    @PostMapping("/leave")
    public QueueEntryResponse leave(@Valid @RequestBody EntryIdRequest request) {
        return QueueEntryResponse.from(update.leave(request.entryId()));
    }

    // --- Staff-only (dashboard) -----------------------------------------------

    /** The full live queue for a shop — everyone waiting, not just one entry. */
    @Operation(
            summary = "Read the live queue for a shop",
            description = "Requires SHOP_OWNER or BARBER_STAFF. Same payload as the WebSocket broadcast at "
                    + "/status/queue/{shopId}, so polling this and subscribing agree by construction.")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/board")
    @PreAuthorize(STAFF)
    public QueueStatusResponse board(@RequestParam @NotBlank String shopId) {
        return QueueStatusResponse.from(status.snapshot(shopId));
    }

    @Operation(summary = "Staff adds a walk-in customer")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/walkin")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(STAFF)
    public JoinQueueResponse walkin(@Valid @RequestBody JoinQueueRequest request) {
        return JoinQueueResponse.from(join.join(toCommand(request)));
    }

    @Operation(
            summary = "Advance the queue",
            description = "Finishes the customer in the chair and promotes the next one waiting.")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/next")
    @PreAuthorize(STAFF)
    public AdvanceQueueResponse next(@Valid @RequestBody ShopIdRequest request) {
        return AdvanceQueueResponse.from(advance.advance(request.shopId()));
    }

    @Operation(summary = "Send a customer to the back of the waiting list")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/skip")
    @PreAuthorize(STAFF)
    public QueueEntryResponse skip(@Valid @RequestBody EntryIdRequest request) {
        return QueueEntryResponse.from(update.skip(request.entryId()));
    }

    @Operation(summary = "Mark a customer as a no-show")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/no-show")
    @PreAuthorize(STAFF)
    public QueueEntryResponse noShow(@Valid @RequestBody EntryIdRequest request) {
        return QueueEntryResponse.from(update.markNoShow(request.entryId()));
    }

    @Operation(summary = "Send an ad-hoc message to one customer")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/notify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(STAFF)
    public void notifyCustomer(@Valid @RequestBody NotifyRequest request) {
        notify.notifyCustomer(
                new NotifyCustomerCommand(request.entryId(), request.type(), request.message()));
    }

    private static JoinQueueCommand toCommand(JoinQueueRequest r) {
        return new JoinQueueCommand(r.shopId(), r.service(), r.phone(), r.name());
    }
}
