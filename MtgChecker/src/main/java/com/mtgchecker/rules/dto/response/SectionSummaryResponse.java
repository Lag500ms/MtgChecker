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
public class SectionSummaryResponse {

    private Integer sectionNumber;
    private String sectionTitle;
    private List<ChapterSummaryResponse> chapters;
}
