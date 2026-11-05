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
public class CreateDeckFormatRequest {

    @NotBlank(message = "Format ID cannot be blank")
    private String id;

    @NotBlank(message = "Format name cannot be blank")
    private String name;

    private String description;

    @NotBlank(message = "Scryfall key cannot be blank")
    private String scryfallKey;

    @Min(value = 1, message = "minCards must be at least 1")
    private int minCards;

    private Integer maxCards;

    @Min(value = 1, message = "maxCopies must be at least 1")
    private int maxCopies;

    private boolean hasCommander;

    private boolean hasSideboard;
}
