package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {

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
}
