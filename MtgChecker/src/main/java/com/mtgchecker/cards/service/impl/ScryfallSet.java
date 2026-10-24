package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
record ScryfallSet(
        String id,
        String code,
        String name,
        @JsonProperty("set_type") String setType,
        @JsonProperty("released_at") String releasedAt,
        @JsonProperty("card_count") Integer cardCount,
        @JsonProperty("scryfall_uri") String scryfallUri,
        @JsonProperty("icon_svg_uri") String iconSvgUri
) {
}
