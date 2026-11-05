package com.mtgchecker.rules.repository;

import com.mtgchecker.rules.entity.QuickDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuickDisputeRepository extends JpaRepository<QuickDispute, String> {
    List<QuickDispute> findAllByOrderByDisplayOrderAsc();
}
