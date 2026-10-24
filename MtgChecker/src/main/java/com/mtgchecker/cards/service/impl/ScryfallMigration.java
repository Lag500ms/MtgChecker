package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallMigration(
        String id,
        @JsonProperty("created_at") String createdAt,
        String uri,
        @JsonProperty("old_scryfall_id") String oldScryfallId,
        @JsonProperty("new_scryfall_id") String newScryfallId,
        @JsonProperty("migration_strategy") String migrationStrategy,
        String note
) {
}
