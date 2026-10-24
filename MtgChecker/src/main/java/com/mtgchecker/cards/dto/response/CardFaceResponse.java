package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardFaceResponse {

    private String name;

    private String manaCost;

    private String typeLine;

    private String oracleText;

    private Map<String, String> imageUris;
}
