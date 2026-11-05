package com.mtgchecker.decks.dto.request;

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
public class CreateDeckRequest {

    @NotBlank(message = "Deck name cannot be blank")
    private String name;

    private String description;

    @NotBlank(message = "Format ID cannot be blank")
    private String formatId;

    private String commanderCardId;

    private String commanderCardName;

    private String coverCardUri;

    private String partnerCommanderCardId;

    private String partnerCommanderCardName;

    private String partnerCoverCardUri;

    private String commanderColorIdentity;

    private String visibility;
}
