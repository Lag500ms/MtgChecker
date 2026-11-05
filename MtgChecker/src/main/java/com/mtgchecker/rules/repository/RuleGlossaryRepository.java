package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.RuleGlossary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RuleGlossaryRepository extends JpaRepository<RuleGlossary, String> {

    Optional<RuleGlossary> findByTermIgnoreCase(String term);

    @Query("""
        SELECT g FROM RuleGlossary g
        WHERE LOWER(g.term) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(g.definition) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY g.term ASC
    """)
    Page<RuleGlossary> searchGlossary(@Param("query") String query, Pageable pageable);

    Page<RuleGlossary> findAllByOrderByTermAsc(Pageable pageable);
}
