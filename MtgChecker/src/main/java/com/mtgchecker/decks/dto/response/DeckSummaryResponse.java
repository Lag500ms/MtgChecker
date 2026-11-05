package com.mtgchecker.decks.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckSummaryResponse {
    private String id;
    private String name;
    private String description;
    private DeckFormatResponse format;
    private String commanderCardId;
    private String commanderCardName;
    private String coverCardUri;
    private String partnerCommanderCardId;
    private String partnerCommanderCardName;
    private String partnerCoverCardUri;
    private String commanderColorIdentity;
    private String visibility;
    private int mainboardCount;
    private int sideboardCount;
    private int totalCount;
    private LocalDateTime updatedAt;
}
