package com.mtgchecker.rules.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleGlossaryResponse {

    private String term;
    private String definition;
    private String seeRule;
    private Boolean isObsolete;
}
