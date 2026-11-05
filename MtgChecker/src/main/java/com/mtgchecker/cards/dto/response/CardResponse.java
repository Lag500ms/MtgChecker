package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;

    private String oracleId;

    private String name;

    private String lang;

    private String set;

    private String setName;

    private String collectorNumber;

    private String manaCost;

    private String typeLine;

    private String oracleText;

    private String rarity;

    private List<String> finishes;

    private CardPriceResponse prices;

    private Map<String, String> imageUris;

    private List<CardFaceResponse> cardFaces;

    private List<String> colors;

    private List<String> colorIdentity;

    private List<String> keywords;

    private Map<String, String> legalities;

    private String power;

    private String toughness;

    private String loyalty;

    private String artist;

    private String flavorText;

    private String releasedAt;

    private String scryfallUri;

    private Map<String, String> purchaseUris;

    private Integer edhrecRank;
}
