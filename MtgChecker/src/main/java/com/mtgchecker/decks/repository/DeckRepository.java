package com.mtgchecker.decks.repository;

import com.mtgchecker.decks.entity.Deck;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeckRepository extends JpaRepository<Deck, String> {

    @EntityGraph(attributePaths = {"format", "cards"})
    List<Deck> findAllByAccountIdOrderByUpdatedAtDesc(String accountId);

    @EntityGraph(attributePaths = {"format", "cards"})
    Optional<Deck> findByIdAndAccountId(String id, String accountId);
}
