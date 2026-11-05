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
@Table(name = "cr_glossary")
public class RuleGlossary {

    @Id
    @Column(name = "term", length = 128)
    private String term;

    @Column(name = "definition", nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "see_rule", length = 64)
    private String seeRule;

    @Column(name = "is_obsolete", nullable = false)
    @Builder.Default
    private Boolean isObsolete = false;
}
