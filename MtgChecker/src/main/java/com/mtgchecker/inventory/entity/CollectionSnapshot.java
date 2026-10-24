package com.mtgchecker.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "collection_snapshots",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_collection_snapshots_account_date",
                columnNames = {"account_id", "snapshot_date"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "total_value_usd", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalValueUsd;

    @Column(name = "total_cards_count", nullable = false)
    private int totalCardsCount;

    @Column(name = "unique_cards_count", nullable = false)
    private int uniqueCardsCount;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
