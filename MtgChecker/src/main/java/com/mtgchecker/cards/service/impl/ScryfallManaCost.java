package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallManaCost(
        String cost,
        Double cmc,
        List<String> colors,
        Boolean colorless,
        Boolean monocolored,
        Boolean multicolored
) {
}
