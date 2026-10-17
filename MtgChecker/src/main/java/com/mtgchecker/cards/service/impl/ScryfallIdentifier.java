package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
record ScryfallIdentifier(
        String id,
        String name,
        String set,
        @JsonProperty("collector_number") String collectorNumber
) {

    static ScryfallIdentifier byName(String name) {
        return new ScryfallIdentifier(null, name, null, null);
    }

    static ScryfallIdentifier byId(String id) {
        return new ScryfallIdentifier(id, null, null, null);
    }
}
