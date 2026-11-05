package com.mtgchecker.decks.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class DeckCardItemRequest {

    @NotBlank(message = "Scryfall ID cannot be blank")
    private String scryfallId;

    @NotBlank(message = "Card name cannot be blank")
    private String name;

    private String setCode;

    private String collectorNumber;

    private String manaCost;

    private String typeLine;

    private String imageUrl;

    private Double cmc;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Builder.Default
    private int quantity = 1;

    @NotBlank(message = "Category cannot be blank")
    @Builder.Default
    private String category = "MAINBOARD";
}
