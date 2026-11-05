package com.mtgchecker.decks.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckCardResponse {
    private String id;
    private String scryfallId;
    private String name;
    private String setCode;
    private String collectorNumber;
    private String manaCost;
    private String typeLine;
    private String imageUrl;
    private Double cmc;
    private int quantity;
    private String category;
}
