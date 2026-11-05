package com.mtgchecker.decks.service.impl;

import com.mtgchecker.decks.entity.DeckFormat;
import com.mtgchecker.decks.repository.DeckFormatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class DeckDataSeeder implements ApplicationRunner {

    private final DeckFormatRepository deckFormatRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedInitialFormats();
    }

    private void seedInitialFormats() {
        if (deckFormatRepository.count() > 0) {
            return;
        }

        List<DeckFormat> initialFormats = List.of(
                DeckFormat.builder()
                        .id("commander")
                        .name("Commander / EDH")
                        .description("100-card singleton format led by a legendary creature as your Commander.")
                        .scryfallKey("commander")
                        .minCards(100)
                        .maxCards(100)
                        .maxCopies(1)
                        .hasCommander(true)
                        .hasSideboard(false)
                        .active(true)
                        .build(),

                DeckFormat.builder()
                        .id("standard")
                        .name("Standard")
                        .description("Rotating 60-card constructed format using sets from the past three years.")
                        .scryfallKey("standard")
                        .minCards(60)
                        .maxCards(null)
                        .maxCopies(4)
                        .hasCommander(false)
                        .hasSideboard(true)
                        .active(true)
                        .build(),

                DeckFormat.builder()
                        .id("pauper")
                        .name("Pauper")
                        .description("60-card constructed format where every card must have been printed at Common rarity.")
                        .scryfallKey("pauper")
                        .minCards(60)
                        .maxCards(null)
                        .maxCopies(4)
                        .hasCommander(false)
                        .hasSideboard(true)
                        .active(true)
                        .build()
        );

        deckFormatRepository.saveAll(initialFormats);
        log.info("Seeded 3 initial deck formats: Commander, Standard, Pauper.");
    }
}
