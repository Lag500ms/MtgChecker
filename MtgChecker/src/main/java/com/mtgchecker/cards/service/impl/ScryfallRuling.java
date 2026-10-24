package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallRuling(
        String source,
        @JsonProperty("published_at") String publishedAt,
        String comment,
        @JsonProperty("oracle_id") String oracleId
) {
}
