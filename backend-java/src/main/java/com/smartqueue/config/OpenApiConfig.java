package com.smartqueue.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The spec is generated from the controllers and DTOs; this only supplies what
 * annotations can't infer.
 *
 * Note there is deliberately no server URL override: springdoc already resolves the
 * /api prefix that {@link WebConfig} adds via PathMatchConfigurer, so the generated
 * paths are absolute. Adding a "/api" server on top of that made "Try it out" call
 * /api/api/... and 401.
 */
@Configuration
class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    OpenAPI smartQueueOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Queue API")
                        .version("0.1.0")
                        .description("""
                                Queue management for barbershops: customers join from WhatsApp,
                                staff advance the queue from a dashboard, and every change is
                                broadcast over STOMP at /topic/queue/{shopId}.

                                Most routes need a bearer token — call POST /auth/login first
                                (demo: owner@shop.com / secret123), then Authorize above.
                                """))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("The `token` returned by POST /auth/login.")));
    }
}
