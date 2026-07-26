package com.smartqueue.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Puts every REST route under /api — the Spring equivalent of the NestJS
 * {@code app.setGlobalPrefix('api')}, and what the frontend's VITE_API_BASE_URL
 * already points at. The WebSocket endpoint stays outside the prefix.
 */
@Configuration
class WebConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix(
                "/api", HandlerTypePredicate.forBasePackage("com.smartqueue.adapter.in.web"));
    }
}
