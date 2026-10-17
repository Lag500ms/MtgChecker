package com.mtgchecker.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
public class ScryfallClientConfig {

    @Bean
    public RestClient scryfallRestClient(
            @Value("${scryfall.base-url:https://api.scryfall.com}") String baseUrl,
            @Value("${scryfall.user-agent:MtgChecker/0.0.1 (personal card inventory)}") String userAgent
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
