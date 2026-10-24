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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "owned_cards",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_owned_cards_account_printing_finish",
                columnNames = {"account_id", "scryfall_id", "finish"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnedCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Column(name = "scryfall_id", nullable = false)
    private String scryfallId;

    @Column(name = "oracle_id", nullable = false)
    private String oracleId;

    @Column(nullable = false)
    private String name;

    @Column(name = "set_code", nullable = false, length = 10)
    private String setCode;

    @Column(name = "set_name", nullable = false)
    private String setName;

    @Column(name = "collector_number", nullable = false, length = 20)
    private String collectorNumber;

    @Column(nullable = false, length = 20)
    private String finish;

    @Column(nullable = false, length = 10)
    private String lang;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String condition = "NM";

    @Column(name = "acquired_price_usd", length = 20)
    private String acquiredPriceUsd;

    @Column(name = "storage_location", length = 100)
    private String storageLocation;

    @Column(nullable = false)
    private int quantity;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
