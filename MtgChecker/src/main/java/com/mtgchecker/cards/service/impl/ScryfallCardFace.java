package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
record ScryfallCardFace(
        String name,
        @JsonProperty("mana_cost") String manaCost,
        @JsonProperty("type_line") String typeLine,
        @JsonProperty("oracle_text") String oracleText,
        @JsonProperty("image_uris") Map<String, String> imageUris
) {
}
