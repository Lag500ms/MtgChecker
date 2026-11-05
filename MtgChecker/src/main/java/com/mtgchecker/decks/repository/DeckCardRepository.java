package com.mtgchecker.decks.repository;

import com.mtgchecker.decks.entity.DeckCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckCardRepository extends JpaRepository<DeckCard, String> {
    List<DeckCard> findAllByDeckId(String deckId);
    void deleteAllByDeckId(String deckId);
}
