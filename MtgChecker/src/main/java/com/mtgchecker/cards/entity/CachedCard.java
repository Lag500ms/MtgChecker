package com.mtgchecker.cards.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
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
        name = "cached_cards",
        indexes = {
                @Index(name = "idx_cached_cards_name", columnList = "name"),
                @Index(name = "idx_cached_cards_normalized_name", columnList = "normalized_name"),
                @Index(name = "idx_cached_cards_set_collector", columnList = "set_code, collector_number"),
                @Index(name = "idx_cached_cards_oracle_id", columnList = "oracle_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CachedCard {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "oracle_id", length = 36)
    private String oracleId;

    @Column(nullable = false)
    private String name;

    @Column(name = "normalized_name", nullable = false)
    private String normalizedName;

    @Column(name = "set_code", nullable = false, length = 10)
    private String setCode;

    @Column(name = "set_name")
    private String setName;

    @Column(name = "collector_number", nullable = false, length = 20)
    private String collectorNumber;

    @Column(length = 10)
    private String lang;

    @Column(name = "mana_cost", length = 100)
    private String manaCost;

    @Column(name = "type_line")
    private String typeLine;

    @Column(columnDefinition = "TEXT")
    private String oracleText;

    @Column(length = 50)
    private String rarity;

    @Column(length = 20)
    private String power;

    @Column(length = 20)
    private String toughness;

    @Column(length = 20)
    private String loyalty;

    private String artist;

    @Column(columnDefinition = "TEXT")
    private String flavorText;

    @Column(name = "released_at", length = 20)
    private String releasedAt;

    @Column(name = "scryfall_uri", length = 500)
    private String scryfallUri;

    @Column(name = "raw_json", columnDefinition = "TEXT")
    private String rawJson;

    @CreationTimestamp
    @Column(name = "cached_at")
    private LocalDateTime cachedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
