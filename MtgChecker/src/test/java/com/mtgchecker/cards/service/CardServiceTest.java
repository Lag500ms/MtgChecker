package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.impl.CardServiceImpl;
import com.mtgchecker.cards.service.impl.ScryfallClient;
import com.mtgchecker.configs.ScryfallClientConfig;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CardServiceTest {

    private final ICardService cardService = new CardServiceImpl(new ScryfallClient(
            new ScryfallClientConfig().scryfallRestClient(
                    "https://api.scryfall.com",
                    "MtgChecker/0.0.1 (personal card inventory)")));

    @Test
    void exactNameReturnsCardDetailsAndPrices() {
        CardResponse card = cardService.findByExactName("Lightning Bolt");

        assertNotNull(card);
        assertEquals("Lightning Bolt", card.getName());
        assertNotNull(card.getId());
        assertNotNull(card.getOracleId());
        assertFalse(card.getSet().isBlank());
        assertFalse(card.getSetName().isBlank());
        assertFalse(card.getCollectorNumber().isBlank());
        assertFalse(card.getTypeLine().isBlank());
        assertTrue(card.getOracleText().contains("3 damage"));
        assertNotNull(card.getPrices());
        assertTrue(hasAnyPrice(card.getPrices()), card.getPrices().toString());

        System.out.printf(
                "named: %s | %s (%s) #%s | %s | usd=%s usd_foil=%s eur=%s tix=%s | %s%n",
                card.getName(),
                card.getSetName(),
                card.getSet(),
                card.getCollectorNumber(),
                card.getTypeLine(),
                card.getPrices().getUsd(),
                card.getPrices().getUsdFoil(),
                card.getPrices().getEur(),
                card.getPrices().getTix(),
                card.getOracleText());
    }

    @Test
    void collectionReturnsEveryRequestedCard() {
        CardCollectionResponse collection = cardService.findByNames(List.of("Lightning Bolt", "Black Lotus"));

        assertNotNull(collection);
        assertTrue(collection.getNotFound().isEmpty(), collection.getNotFound().toString());
        assertEquals(2, collection.getCards().size());
        assertEquals("Lightning Bolt", collection.getCards().get(0).getName());
        assertEquals("Black Lotus", collection.getCards().get(1).getName());

        for (CardResponse card : collection.getCards()) {
            assertNotNull(card.getOracleId());
            assertNotNull(card.getPrices());
            System.out.printf(
                    "collection: %s | %s #%s | usd=%s%n",
                    card.getName(),
                    card.getSet(),
                    card.getCollectorNumber(),
                    card.getPrices().getUsd());
        }
    }

    @Test
    void printingsHaveDifferentPricesPerSet() {
        List<CardResponse> printings = cardService.findPrintings("Birds of Paradise");

        assertTrue(printings.size() > 1);
        Set<String> sets = printings.stream().map(CardResponse::getSet).collect(Collectors.toSet());
        Set<String> prices = printings.stream()
                .map(CardResponse::getPrices)
                .filter(Objects::nonNull)
                .map(CardPriceResponse::getUsd)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        assertTrue(sets.size() > 1);
        assertTrue(prices.size() > 1);
        System.out.printf("printings: %d sets, %d distinct usd prices%n", sets.size(), prices.size());
    }

    private static boolean hasAnyPrice(CardPriceResponse prices) {
        return prices.getUsd() != null
                || prices.getUsdFoil() != null
                || prices.getUsdEtched() != null
                || prices.getEur() != null
                || prices.getEurFoil() != null
                || prices.getTix() != null;
    }
}
