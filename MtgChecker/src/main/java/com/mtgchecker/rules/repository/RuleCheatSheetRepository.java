package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.RuleCheatSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleCheatSheetRepository extends JpaRepository<RuleCheatSheet, String> {
    List<RuleCheatSheet> findAllByOrderByDisplayOrderAsc();
}
