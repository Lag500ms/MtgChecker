package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardCollectionResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<CardResponse> cards;

    private List<String> notFound;

    private Integer totalCards;

    private Boolean hasMore;

    private String nextPage;
}
