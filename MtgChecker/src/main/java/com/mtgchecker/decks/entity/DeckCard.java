package com.mtgchecker.decks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
        name = "deck_cards",
        indexes = {
                @Index(name = "idx_deck_cards_deck_id", columnList = "deck_id"),
                @Index(name = "idx_deck_cards_scryfall_id", columnList = "scryfall_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Column(name = "scryfall_id", nullable = false, length = 36)
    private String scryfallId;

    @Column(nullable = false)
    private String name;

    @Column(name = "set_code", length = 20)
    private String setCode;

    @Column(name = "collector_number", length = 30)
    private String collectorNumber;

    @Column(name = "mana_cost", length = 100)
    private String manaCost;

    @Column(name = "type_line")
    private String typeLine;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "cmc")
    private Double cmc;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String category = "MAINBOARD";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
