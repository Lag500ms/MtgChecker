package com.mtgchecker.rules.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormatRuleResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String badge;
    private String icon;
    private String summary;
    private Integer startingLife;
    private Integer minDeckSize;
    private Integer maxDeckSize;
    private List<FormatKeyRuleResponse> keyRules;
    private Integer displayOrder;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FormatKeyRuleResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String title;
        private String description;
        private String crCitation;
    }
}
