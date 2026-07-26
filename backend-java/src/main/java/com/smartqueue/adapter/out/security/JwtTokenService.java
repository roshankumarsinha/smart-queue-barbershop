package com.smartqueue.adapter.out.security;

import com.smartqueue.application.port.out.AccessTokenIssuer;
import com.smartqueue.config.SmartQueueProperties;
import com.smartqueue.domain.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Issues and verifies the bearer tokens. The payload matches the NestJS version
 * ({@code sub} = user id, {@code role}) so tokens stay interchangeable between the
 * two backends during a migration.
 */
@Component
public class JwtTokenService implements AccessTokenIssuer {

    private final SecretKey key;
    private final java.time.Duration expiration;

    public JwtTokenService(SmartQueueProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.expiration = properties.jwt().expiration();
    }

    @Override
    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.id())
                .claim("role", user.role().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    /** Empty when the token is absent, malformed, tampered with, or expired. */
    public Optional<String> subjectOf(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.ofNullable(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
