package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.ComprehensiveRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComprehensiveRuleRepository extends JpaRepository<ComprehensiveRule, String> {

    Optional<ComprehensiveRule> findByRuleNumberIgnoreCase(String ruleNumber);

    List<ComprehensiveRule> findByChapterNumberOrderByRuleNumberAsc(String chapterNumber);

    List<ComprehensiveRule> findBySectionNumberOrderByRuleNumberAsc(Integer sectionNumber);

    @Query("""
        SELECT r FROM ComprehensiveRule r
        WHERE LOWER(r.ruleNumber) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.chapterTitle) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.ruleText) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY r.ruleNumber ASC
    """)
    Page<ComprehensiveRule> searchRules(@Param("query") String query, Pageable pageable);

    @Query("""
        SELECT DISTINCT r.sectionNumber, r.sectionTitle
        FROM ComprehensiveRule r
        ORDER BY r.sectionNumber ASC
    """)
    List<Object[]> findDistinctSections();

    @Query("""
        SELECT DISTINCT r.chapterNumber, r.chapterTitle
        FROM ComprehensiveRule r
        WHERE r.sectionNumber = :sectionNumber
        ORDER BY r.chapterNumber ASC
    """)
    List<Object[]> findDistinctChaptersBySection(@Param("sectionNumber") Integer sectionNumber);

    @Query("""
        SELECT r FROM ComprehensiveRule r
        WHERE LOWER(r.ruleNumber) IN :ruleNumbers
        ORDER BY r.ruleNumber ASC
    """)
    List<ComprehensiveRule> findByRuleNumbers(@Param("ruleNumbers") List<String> ruleNumbers);
}
