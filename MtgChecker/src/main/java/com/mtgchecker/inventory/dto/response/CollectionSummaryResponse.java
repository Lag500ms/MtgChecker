package com.mtgchecker.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionSummaryResponse {

    private BigDecimal totalValueUsd;

    private int totalCardsCount;

    private int uniqueCardsCount;

    private BigDecimal deltaValue7d;

    private Double deltaPercent7d;

    private List<OwnedCardResponse> cards;
}
