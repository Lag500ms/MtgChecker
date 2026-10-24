package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetResponse {

    private String id;

    private String code;

    private String name;

    private String setType;

    private String releasedAt;

    private Integer cardCount;

    private String scryfallUri;

    private String iconSvgUri;
}
