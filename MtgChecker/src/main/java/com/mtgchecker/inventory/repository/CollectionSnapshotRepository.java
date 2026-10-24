package com.mtgchecker.inventory.repository;

import com.mtgchecker.inventory.entity.CollectionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CollectionSnapshotRepository extends JpaRepository<CollectionSnapshot, String> {

    Optional<CollectionSnapshot> findByAccountIdAndSnapshotDate(String accountId, LocalDate snapshotDate);

    Optional<CollectionSnapshot> findTopByAccountIdAndSnapshotDateLessThanEqualOrderBySnapshotDateDesc(
            String accountId, LocalDate snapshotDate);
}
