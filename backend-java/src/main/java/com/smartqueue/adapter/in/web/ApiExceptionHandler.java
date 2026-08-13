package com.smartqueue.adapter.in.web;

import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.InvalidCredentialsException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.exception.ValidationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.List;

/**
 * Error bodies deliberately mirror NestJS ({@code { statusCode, message, error }},
 * with {@code message} as a string array for validation failures) because the
 * frontend's fetch wrapper already parses exactly that shape.
 */
@RestControllerAdvice
class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    record ErrorResponse(int statusCode, Object message, String error) {
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), request);
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ErrorResponse> handleConflict(ConflictException e, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, e.getMessage(), request);
    }

    @ExceptionHandler(ValidationException.class)
    ResponseEntity<ErrorResponse> handleValidation(ValidationException e, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException e, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, e.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        // The caller is told only "insufficient role"; the log keeps the specific reason
        // ("Not this shop's owner") so a support question is answerable after the fact.
        log.warn("Access denied on {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return build(HttpStatus.FORBIDDEN, "Insufficient role for this action", null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleBodyValidation(
            MethodArgumentNotValidException e, HttpServletRequest request) {
        List<String> messages = e.getBindingResult().getAllErrors().stream()
                .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value")
                .toList();
        return build(HttpStatus.BAD_REQUEST, messages, request);
    }

    /** Thrown when a validated @RequestParam / @PathVariable fails its constraints. */
    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> handleParamValidation(
            HandlerMethodValidationException e, HttpServletRequest request) {
        List<String> messages = e.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream())
                .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value")
                .toList();
        return build(HttpStatus.BAD_REQUEST, messages, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException e, HttpServletRequest request) {
        List<String> messages = e.getConstraintViolations().stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, messages, request);
    }

    /** Unparseable JSON, or an unknown value for an enum field such as `service`. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> handleUnreadableBody(
            HttpMessageNotReadableException e, HttpServletRequest request) {
        // The generic client message hides which field was wrong, so log the parser's
        // own reason — it names the offending field and value.
        log.warn("Unreadable body on {} {}: {}",
                request.getMethod(), request.getRequestURI(), e.getMostSpecificCause().getMessage());
        return build(HttpStatus.BAD_REQUEST, "Malformed or unrecognised request body", null);
    }

    /**
     * Anything not handled above is a bug, not a client mistake: log the stack trace and
     * answer with the same body shape rather than leaking Spring's default error page.
     */
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception e, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong", null);
    }

    /** A null {@code request} means the caller already logged this failure itself. */
    private static ResponseEntity<ErrorResponse> build(
            HttpStatus status, Object message, HttpServletRequest request) {
        if (request != null) {
            log.warn("{} on {} {}: {}",
                    status.value(), request.getMethod(), request.getRequestURI(), message);
        }
        return ResponseEntity.status(status)
                .body(new ErrorResponse(status.value(), message, status.getReasonPhrase()));
    }
}
