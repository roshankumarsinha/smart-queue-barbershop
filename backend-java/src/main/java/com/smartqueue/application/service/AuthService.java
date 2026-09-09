package com.smartqueue.application.service;

import com.smartqueue.application.port.in.LoginUseCase;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.LoginCommand;
import com.smartqueue.application.port.in.result.AuthenticatedSession;
import com.smartqueue.application.port.out.AccessTokenIssuer;
import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.AuthMethod;
import com.smartqueue.domain.exception.InvalidCredentialsException;
import com.smartqueue.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService implements LoginUseCase {

    private final UserRepository users;
    private final PasswordHasher hasher;
    private final AccessTokenIssuer tokens;
    private final ManageShopsUseCase shops;

    public AuthService(
            UserRepository users, PasswordHasher hasher, AccessTokenIssuer tokens, ManageShopsUseCase shops) {
        this.users = users;
        this.hasher = hasher;
        this.tokens = tokens;
        this.shops = shops;
    }

    @Override
    @Transactional
    public AuthenticatedSession login(LoginCommand command) {
        AuthMethod method = command.role().authMethod().orElseThrow(InvalidCredentialsException::new);

        User user = (method == AuthMethod.EMAIL
                        ? users.findByEmailAndRole(command.email(), command.role())
                        : users.findByPhoneAndRole(command.phone(), command.role()))
                .orElseThrow(InvalidCredentialsException::new);

        String secret = method == AuthMethod.EMAIL ? command.password() : command.pin();
        if (!hasher.matches(secret, user.credentialHash())) {
            throw new InvalidCredentialsException();
        }

        // A deactivated account looks exactly like a wrong password from outside — no
        // signal about whether the account exists. Already-issued tokens stay valid
        // until they expire; this only blocks new sign-ins.
        if (!user.active()) {
            throw new InvalidCredentialsException();
        }

        // Auto check-in: a barber (or an unstaffed shop's own owner) signing in opens
        // the shop if it's within business hours, and puts them on duty unconditionally
        // — see ShopService#checkInForLogin. No-op for other roles.
        shops.checkInForLogin(user);

        return new AuthenticatedSession(user, tokens.issue(user));
    }
}
