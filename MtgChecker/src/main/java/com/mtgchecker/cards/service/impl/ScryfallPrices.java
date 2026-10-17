package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
record ScryfallPrices(
        String usd,
        @JsonProperty("usd_foil") String usdFoil,
        @JsonProperty("usd_etched") String usdEtched,
        String eur,
        @JsonProperty("eur_foil") String eurFoil,
        String tix
) {
}
