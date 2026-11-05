package com.mtgchecker.decks.repository;

import com.mtgchecker.decks.entity.DeckFormat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckFormatRepository extends JpaRepository<DeckFormat, String> {
    List<DeckFormat> findAllByActiveTrueOrderByNameAsc();
    boolean existsByIdIgnoreCase(String id);
}
