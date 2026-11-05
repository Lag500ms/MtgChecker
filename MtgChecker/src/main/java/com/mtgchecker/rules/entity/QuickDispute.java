package com.mtgchecker.rules.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
@Table(name = "rules_quick_disputes")
public class QuickDispute {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "query", nullable = false, length = 256)
    private String query;

    @Column(name = "card_names_json", columnDefinition = "TEXT")
    private String cardNamesJson;

    @Column(name = "verdict", nullable = false, length = 32)
    private String verdict;

    @Column(name = "verdict_title", nullable = false, length = 256)
    private String verdictTitle;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "stack_steps_json", columnDefinition = "TEXT")
    private String stackStepsJson;

    @Column(name = "cr_rules_json", columnDefinition = "TEXT")
    private String crRulesJson;

    @Column(name = "category", length = 64)
    private String category;

    @Column(name = "display_order")
    private Integer displayOrder;
}
