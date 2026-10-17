package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record ScryfallCard(
        String id,
        @JsonProperty("oracle_id") String oracleId,
        String name,
        String lang,
        String set,
        @JsonProperty("set_name") String setName,
        @JsonProperty("collector_number") String collectorNumber,
        @JsonProperty("mana_cost") String manaCost,
        @JsonProperty("type_line") String typeLine,
        @JsonProperty("oracle_text") String oracleText,
        String rarity,
        List<String> finishes,
        ScryfallPrices prices
) {
}
