package com.smartqueue.adapter.in.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * One line in when a request arrives, one line out with its status and duration —
 * enough to see that a call reached the app and what it answered, without a proxy or
 * debugger in the way.
 *
 * <p>Bodies are deliberately never logged: they carry passwords, PINs and WhatsApp
 * tokens. The failure detail that would justify logging a body is logged instead by
 * {@link ApiExceptionHandler}, which sees the exception rather than the raw payload.
 */
@Component
class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        String method = request.getMethod();
        String path = pathWithQuery(request);

        log.info("--> {} {}", method, path);
        try {
            chain.doFilter(request, response);
        } finally {
            long tookMs = System.currentTimeMillis() - startedAt;
            int status = response.getStatus();
            // 5xx here is the last-resort net: anything ApiExceptionHandler already
            // logged arrives as a 4xx, so a warning at this level would double-report.
            if (status >= 500) {
                log.error("<-- {} {} {} ({}ms)", method, path, status, tookMs);
            } else {
                log.info("<-- {} {} {} ({}ms)", method, path, status, tookMs);
            }
        }
    }

    private static String pathWithQuery(HttpServletRequest request) {
        String query = request.getQueryString();
        return query == null ? request.getRequestURI() : request.getRequestURI() + "?" + query;
    }

    /** Swagger UI and the OpenAPI document are noise; the webhook logs itself in detail. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
    }
}
