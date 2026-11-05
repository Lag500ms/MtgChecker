package com.mtgchecker.decks.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "decks",
        indexes = {
                @Index(name = "idx_decks_account_id", columnList = "account_id"),
                @Index(name = "idx_decks_format_id", columnList = "format_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "format_id", nullable = false)
    private DeckFormat format;

    @Column(name = "commander_card_id", length = 36)
    private String commanderCardId;

    @Column(name = "commander_card_name")
    private String commanderCardName;

    @Column(name = "cover_card_uri", length = 500)
    private String coverCardUri;

    @Column(name = "partner_commander_card_id", length = 36)
    private String partnerCommanderCardId;

    @Column(name = "partner_commander_card_name")
    private String partnerCommanderCardName;

    @Column(name = "partner_cover_card_uri", length = 500)
    private String partnerCoverCardUri;

    @Column(name = "commander_color_identity", length = 50)
    private String commanderColorIdentity;

    @Column(name = "visibility", length = 20)
    @Builder.Default
    private String visibility = "PUBLIC";

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DeckCard> cards = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
