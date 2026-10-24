package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardMigrationResponse {
    private String id;
    private String createdAt;
    private String uri;
    private String oldScryfallId;
    private String newScryfallId;
    private String migrationStrategy;
    private String note;
}
