package com.mtgchecker.rules.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.rules.service.ILlmClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component("ollamaClient")
@RequiredArgsConstructor
public class OllamaClient implements ILlmClient {

    private final ObjectMapper objectMapper;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${ollama.model:qwen2.5:3b}")
    private String model;

    @Override
    public String getProviderName() {
        return "ollama";
    }

    @Override
    public String generateContent(String systemPrompt, String userPrompt) {
        String url = String.format("%s/api/chat", baseUrl);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "format", "json",
                "stream", false,
                "options", Map.of("temperature", 0.1)
        );

        RestClient restClient = RestClient.builder().build();

        String rawResponse = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode messageContent = root.path("message").path("content");
            if (!messageContent.isMissingNode() && !messageContent.asText().isBlank()) {
                return messageContent.asText();
            }
            throw new IllegalStateException("Ollama returned empty message content");
        } catch (Exception e) {
            log.error("Failed to parse Ollama response: {}", rawResponse, e);
            throw new RuntimeException("Error parsing Ollama response: " + e.getMessage(), e);
        }
    }
}
