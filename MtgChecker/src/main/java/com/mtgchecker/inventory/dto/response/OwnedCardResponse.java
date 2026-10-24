package com.mtgchecker.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnedCardResponse {

    private String id;

    private String scryfallId;

    private String oracleId;

    private String name;

    private String setCode;

    private String setName;

    private String collectorNumber;

    private String lang;

    private String finish;

    private String condition;

    private String acquiredPriceUsd;

    private String storageLocation;

    private int quantity;

    private String priceUsd;

    private String totalPriceUsd;

    private String imageUri;

    private String rarity;

    private String manaCost;
}
