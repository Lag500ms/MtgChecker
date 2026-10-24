package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallSymbol(
        String symbol,
        @JsonProperty("svg_uri") String svgUri,
        @JsonProperty("loose_variant") String looseVariant,
        String english,
        Boolean transposable,
        @JsonProperty("represents_mana") Boolean representsMana,
        Double cmc,
        @JsonProperty("appears_in_mana_costs") Boolean appearsInManaCosts,
        Boolean funny,
        List<String> colors,
        @JsonProperty("gatherer_alternates") List<String> gathererAlternates
) {
}
