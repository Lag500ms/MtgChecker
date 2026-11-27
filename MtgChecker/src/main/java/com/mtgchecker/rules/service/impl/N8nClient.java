package com.mtgchecker.rules.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.rules.service.ILlmClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component("n8nClient")
@RequiredArgsConstructor
public class N8nClient implements ILlmClient {

    private final ObjectMapper objectMapper;

    @Value("${n8n.webhook-url:http://localhost:5678/webhook/mtg-judge}")
    private String webhookUrl;

    @Value("${n8n.api-secret:tuilanguoidanongthep}")
    private String apiSecret;

    @Override
    public String getProviderName() {
        return "n8n";
    }

    @Override
    public String generateContent(String systemPrompt, String userPrompt) {
        return askJudge(userPrompt, systemPrompt, userPrompt);
    }

    public String askJudge(String question, String systemPrompt, String userPrompt) {
        Map<String, Object> payload = Map.of(
                "question", question,
                "context", userPrompt,
                "systemPrompt", systemPrompt,
                "requestId", "req_" + System.currentTimeMillis()
        );

        RestClient restClient = RestClient.builder().build();

        return restClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-MTG-AI-SECRET", apiSecret)
                .body(payload)
                .retrieve()
                .body(String.class);
    }
}
