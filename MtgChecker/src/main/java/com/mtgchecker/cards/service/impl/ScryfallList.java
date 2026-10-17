package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record ScryfallList(
        @JsonProperty("has_more") Boolean hasMore,
        @JsonProperty("next_page") String nextPage,
        @JsonProperty("not_found") List<ScryfallIdentifier> notFound,
        List<ScryfallCard> data
) {
}
