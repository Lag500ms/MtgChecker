package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallManifestList(
        @JsonProperty("has_more") Boolean hasMore,
        @JsonProperty("next_page") String nextPage,
        @JsonProperty("total_values") Integer totalValues,
        List<Map<String, Object>> data
) {
}
