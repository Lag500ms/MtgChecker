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
public class ManaCostResponse {
    private String cost;
    private Double cmc;
    private List<String> colors;
    private Boolean colorless;
    private Boolean monocolored;
    private Boolean multicolored;
}
