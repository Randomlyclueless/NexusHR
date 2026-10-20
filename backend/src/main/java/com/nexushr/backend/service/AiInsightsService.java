package com.nexushr.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class AiInsightsService {

    private final RestClient restClient;

    public AiInsightsService(
            @Value("${ai.service.base-url:http://127.0.0.1:8001}")
            String baseUrl) {

        this.restClient = RestClient.create(baseUrl);
    }

    public Map<String, Object> getHealth() {
        try {
            Map<String, Object> response = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response == null) {
                return Map.of(
                        "status", "unavailable",
                        "model_available", false,
                        "message", "The AI service returned an empty response."
                );
            }

            return Map.of(
                    "status", response.getOrDefault("status", "unknown"),
                    "model_available", Boolean.TRUE.equals(
                            response.get("model_available")),
                    "message", response.getOrDefault(
                            "message", "No status message provided.")
            );

        } catch (RestClientException exception) {
            return Map.of(
                    "status", "unavailable",
                    "model_available", false,
                    "message", "Unable to connect to the AI service."
            );
        }
    }
}