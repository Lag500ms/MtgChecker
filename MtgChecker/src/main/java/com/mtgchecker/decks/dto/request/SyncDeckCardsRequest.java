package com.mtgchecker.decks.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncDeckCardsRequest {

    @NotNull(message = "Cards list cannot be null")
    @Valid
    @Builder.Default
    private List<DeckCardItemRequest> cards = new ArrayList<>();
}
