package com.smartqueue.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Realtime queue updates over STOMP. Clients subscribe per shop and receive the full
 * snapshot whenever that shop's queue changes.
 *
 * Frontend usage:
 *   const client = new Client({ brokerURL: 'ws://localhost:3000/ws' });
 *   client.subscribe(`/status/queue/${shopId}`, (msg) => setState(JSON.parse(msg.body)));
 *
 * Note this replaces the NestJS Socket.io gateway; the transports are not wire
 * compatible, so the frontend swaps socket.io-client for @stomp/stompjs.
 */
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final SmartQueueProperties properties;

    WebSocketConfig(SmartQueueProperties properties) {
        this.properties = properties;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = properties.cors().allowedOrigins().toArray(String[]::new);
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins);
        // SockJS fallback for browsers/networks that block raw WebSocket upgrades.
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins).withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/status");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
