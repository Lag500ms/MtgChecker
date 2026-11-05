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
@Table(name = "rules_formats")
public class FormatRule {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "badge", nullable = false, length = 64)
    private String badge;

    @Column(name = "icon", length = 64)
    private String icon;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "starting_life")
    private Integer startingLife;

    @Column(name = "min_deck_size")
    private Integer minDeckSize;

    @Column(name = "max_deck_size")
    private Integer maxDeckSize;

    @Column(name = "key_rules_json", columnDefinition = "TEXT")
    private String keyRulesJson;

    @Column(name = "display_order")
    private Integer displayOrder;
}
