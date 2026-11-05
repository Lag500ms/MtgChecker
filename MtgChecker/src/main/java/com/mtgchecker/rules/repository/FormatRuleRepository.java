package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.FormatRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormatRuleRepository extends JpaRepository<FormatRule, String> {

    List<FormatRule> findAllByOrderByDisplayOrderAsc();
}
