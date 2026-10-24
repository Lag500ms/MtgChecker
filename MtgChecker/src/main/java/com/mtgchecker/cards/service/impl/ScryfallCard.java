package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

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
        ScryfallPrices prices,
        @JsonProperty("image_uris") Map<String, String> imageUris,
        @JsonProperty("card_faces") List<ScryfallCardFace> cardFaces,
        List<String> colors,
        @JsonProperty("color_identity") List<String> colorIdentity,
        List<String> keywords,
        Map<String, String> legalities,
        String power,
        String toughness,
        String loyalty,
        String artist,
        @JsonProperty("flavor_text") String flavorText,
        @JsonProperty("released_at") String releasedAt,
        @JsonProperty("scryfall_uri") String scryfallUri,
        @JsonProperty("purchase_uris") Map<String, String> purchaseUris,
        @JsonProperty("edhrec_rank") Integer edhrecRank
) {
}
