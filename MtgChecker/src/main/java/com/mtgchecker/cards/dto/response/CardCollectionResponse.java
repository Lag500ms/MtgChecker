package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardCollectionResponse {

    private List<CardResponse> cards;

    private List<String> notFound;
}
