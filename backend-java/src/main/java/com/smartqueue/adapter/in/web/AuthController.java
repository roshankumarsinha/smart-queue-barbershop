package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.LoginRequest;
import com.smartqueue.adapter.in.web.dto.LoginResponse;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.LoginUseCase;
import com.smartqueue.application.port.in.command.LoginCommand;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Sign in and restore a session")
public class AuthController {

    private final LoginUseCase login;

    public AuthController(LoginUseCase login) {
        this.login = login;
    }

    /** POST /api/auth/login -> { user, role, token } */
    @Operation(
            summary = "Sign in",
            description = """
                    Owners and admins send roleKey + email + password;
                    barbers send roleKey + phone + pin. Demo: SHOP_OWNER /
                    owner@shop.com / secret123.""")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return LoginResponse.from(login.login(new LoginCommand(
                request.role(), request.email(), request.password(), request.phone(), request.pin())));
    }

    /** GET /api/auth/me -> the current token's user, for session restore on reload. */
    @Operation(summary = "The current token's user")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/me")
    public AuthenticatedUser me(@AuthenticationPrincipal AuthenticatedUser user) {
        return user;
    }
}
