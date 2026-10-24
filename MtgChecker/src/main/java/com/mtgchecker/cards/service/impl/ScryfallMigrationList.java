package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallMigrationList(
        @JsonProperty("has_more") Boolean hasMore,
        @JsonProperty("next_page") String nextPage,
        List<ScryfallMigration> data
) {
}
