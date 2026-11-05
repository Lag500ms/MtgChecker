package com.mtgchecker.cards.repository;

import com.mtgchecker.cards.entity.CachedCard;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CachedCardRepository extends JpaRepository<CachedCard, String> {

    Optional<CachedCard> findByNormalizedName(String normalizedName);

    Optional<CachedCard> findBySetCodeIgnoreCaseAndCollectorNumberIgnoreCase(String setCode, String collectorNumber);

    Optional<CachedCard> findBySetCodeIgnoreCaseAndCollectorNumberIgnoreCaseAndLangIgnoreCase(String setCode, String collectorNumber, String lang);

    @Query("SELECT c FROM CachedCard c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.name ASC")
    List<CachedCard> searchByNameLike(@Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT c.name FROM CachedCard c WHERE c.normalizedName LIKE CONCAT(:prefix, '%') ORDER BY c.name ASC")
    List<String> findNameSuggestions(@Param("prefix") String prefix, Pageable pageable);
}
