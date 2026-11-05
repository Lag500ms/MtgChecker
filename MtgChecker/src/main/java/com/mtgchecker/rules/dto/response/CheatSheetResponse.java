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
public class CheatSheetResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String subtitle;
    private String icon;
    private String badge;
    private List<SectionDto> sections;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String heading;
        private String description;
        private List<ItemDto> items;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String term;
        private String details;
        private String crCode;
    }
}
