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
public class CardSymbolResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private String symbol;
    private String svgUri;
    private String looseVariant;
    private String english;
    private Boolean transposable;
    private Boolean representsMana;
    private Double cmc;
    private Boolean appearsInManaCosts;
    private Boolean funny;
    private List<String> colors;
    private List<String> gathererAlternates;
}
