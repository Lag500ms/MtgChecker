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
@Component("geminiClient")
@RequiredArgsConstructor
public class GeminiClient implements ILlmClient {

    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:AIzaSyA0Emc3jjiuwrMSPLt3OrK7zUAQiyDfTZw}")
    private String apiKey;

    @Value("${gemini.model:gemini-3-flash-preview}")
    private String model;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public String generateContent(String systemPrompt, String userPrompt) {
        String url = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.1
                )
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
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
            throw new IllegalStateException("Gemini returned response without candidate text parts");
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", rawResponse, e);
            throw new RuntimeException("Error parsing Gemini AI response: " + e.getMessage(), e);
        }
    }
}
