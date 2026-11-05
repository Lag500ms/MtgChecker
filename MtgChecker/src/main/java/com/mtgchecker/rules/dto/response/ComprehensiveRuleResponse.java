package com.mtgchecker.rules.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComprehensiveRuleResponse {

    private String ruleNumber;
    private String chapterNumber;
    private String chapterTitle;
    private Integer sectionNumber;
    private String sectionTitle;
    private String ruleText;
    private String examplesText;
    private List<String> crossReferences;
}
