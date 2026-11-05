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
@Table(name = "rules_cheat_sheets")
public class RuleCheatSheet {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "title", nullable = false, length = 128)
    private String title;

    @Column(name = "subtitle", length = 256)
    private String subtitle;

    @Column(name = "icon", length = 32)
    private String icon;

    @Column(name = "badge", length = 32)
    private String badge;

    @Column(name = "sections_json", columnDefinition = "TEXT")
    private String sectionsJson;

    @Column(name = "display_order")
    private Integer displayOrder;
}
