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
public class DeckFormatResponse {
    private String id;
    private String name;
    private String description;
    private String scryfallKey;
    private int minCards;
    private Integer maxCards;
    private int maxCopies;
    private boolean hasCommander;
    private boolean hasSideboard;
    private boolean active;
}
