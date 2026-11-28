package com.mtgchecker.rules.service.impl;

import com.mtgchecker.rules.service.ILlmClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

@Component("n8nClient")
public class N8nClient implements ILlmClient {

    private final RestClient restClient;

    public N8nClient(@Value("${n8n.timeout-ms:60000}") int timeoutMs) {
        // Use HTTP/1.1 directly for the internal n8n webhook.
        HttpClient http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));
        restClient = RestClient.builder().requestFactory(factory).build();
    }

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

        return restClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-MTG-AI-SECRET", apiSecret)
                .body(payload)
                .retrieve()
                .body(String.class);
    }
}
