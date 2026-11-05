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
public class JudgeVerdictResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String query;
    private List<String> cardNames;
    private String verdict;
    private String verdictTitle;
    private String summary;
    private List<String> stackSteps;
    private List<String> crRules;
    private String category;
    private Boolean isCached;
}
