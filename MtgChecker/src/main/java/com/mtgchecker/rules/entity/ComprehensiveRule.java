package com.mtgchecker.rules.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "cr_rules",
        indexes = {
                @Index(name = "idx_cr_rules_chapter", columnList = "chapter_number"),
                @Index(name = "idx_cr_rules_section", columnList = "section_number")
        }
)
public class ComprehensiveRule {

    @Id
    @Column(name = "rule_number", length = 16)
    private String ruleNumber;

    @Column(name = "chapter_number", nullable = false, length = 8)
    private String chapterNumber;

    @Column(name = "chapter_title", nullable = false, length = 128)
    private String chapterTitle;

    @Column(name = "section_number", nullable = false)
    private Integer sectionNumber;

    @Column(name = "section_title", nullable = false, length = 128)
    private String sectionTitle;

    @Column(name = "rule_text", nullable = false, columnDefinition = "TEXT")
    private String ruleText;

    @Column(name = "examples_text", columnDefinition = "TEXT")
    private String examplesText;

    @Column(name = "cross_references", columnDefinition = "TEXT")
    private String crossReferences;
}
