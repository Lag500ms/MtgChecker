package com.mtgchecker.decks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
@Table(name = "deck_formats")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckFormat {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "scryfall_key", nullable = false, length = 50)
    private String scryfallKey;

    @Column(name = "min_cards", nullable = false)
    private int minCards;

    @Column(name = "max_cards")
    private Integer maxCards;

    @Column(name = "max_copies", nullable = false)
    private int maxCopies;

    @Column(name = "has_commander", nullable = false)
    private boolean hasCommander;

    @Column(name = "has_sideboard", nullable = false)
    private boolean hasSideboard;

    @Column(nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
