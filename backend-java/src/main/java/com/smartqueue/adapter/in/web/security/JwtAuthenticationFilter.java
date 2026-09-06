package com.smartqueue.adapter.in.web.security;

import com.smartqueue.adapter.out.security.JwtTokenService;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.model.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Resolves the bearer token into an {@link AuthenticatedUser} — the equivalent of
 * the NestJS JwtStrategy.validate(). The user is re-read from the database on every
 * request so a deleted account stops working immediately, even mid-token-lifetime.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtTokenService tokens;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtTokenService tokens, UserRepository users) {
        this.tokens = tokens;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain)
            throws ServletException, IOException {

        // An unauthenticated request is fine here — the authorization rules decide
        // whether the endpoint actually needed a principal.
        bearerToken(request)
                .flatMap(tokens::subjectOf)
                .flatMap(users::findById)
                .ifPresent(user -> authenticate(user, request));

        chain.doFilter(request, response);
    }

    private void authenticate(User user, HttpServletRequest request) {
        var principal = new AuthenticatedUser(user.id(), user.role(), user.shopId(), user.onDuty());
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()));

        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static java.util.Optional<String> bearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER)) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(header.substring(BEARER.length()).trim());
    }
}
