package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.RuleQueryCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RuleQueryCacheRepository extends JpaRepository<RuleQueryCache, Long> {

    Optional<RuleQueryCache> findByQueryHash(String queryHash);

    List<RuleQueryCache> findTop3ByOrderByIdDesc();
}

