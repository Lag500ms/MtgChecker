package com.mtgchecker.cards.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ScryfallClient {

    private final RestClient scryfallRestClient;

    ScryfallCard findByExactName(String name) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/cards/named")
                        .queryParam("exact", name)
                        .build())
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByName(String exact, String fuzzy, String set) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> {
                    var b = uriBuilder.path("/cards/named");
                    if (exact != null && !exact.isBlank()) b = b.queryParam("exact", exact);
                    else if (fuzzy != null && !fuzzy.isBlank()) b = b.queryParam("fuzzy", fuzzy);
                    if (set != null && !set.isBlank()) b = b.queryParam("set", set);
                    return b.build();
                })
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findById(String id) {
        return scryfallRestClient.get()
                .uri("/cards/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    List<ScryfallCard> findPrintings(String name) {
        String queryName = name.replace("\"", "");
        ScryfallList page = scryfallRestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/cards/search")
                        .queryParam("q", "!\"" + queryName + "\"")
                        .queryParam("unique", "prints")
                        .queryParam("order", "released")
                        .queryParam("dir", "desc")
                        .build())
                .retrieve()
                .body(ScryfallList.class);
        List<ScryfallCard> cards = new ArrayList<>();
        while (page != null) {
            if (page.data() != null) {
                cards.addAll(page.data());
            }
            if (!Boolean.TRUE.equals(page.hasMore()) || page.nextPage() == null) {
                break;
            }
            pause();
            page = scryfallRestClient.get()
                    .uri(URI.create(page.nextPage()))
                    .retrieve()
                    .body(ScryfallList.class);
        }
        return cards;
    }

    ScryfallCard findBySetAndCollectorNumber(String setCode, String collectorNumber) {
        return scryfallRestClient.get()
                .uri("/cards/{set}/{collectorNumber}", setCode.toLowerCase(), collectorNumber)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findBySetAndCollectorNumber(String setCode, String collectorNumber, String lang) {
        if (lang == null || lang.isBlank() || "en".equalsIgnoreCase(lang)) {
            return findBySetAndCollectorNumber(setCode, collectorNumber);
        }
        return scryfallRestClient.get()
                .uri("/cards/{set}/{collectorNumber}/{lang}", setCode.toLowerCase(), collectorNumber, lang.toLowerCase())
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByMultiverseId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/multiverse/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByMtgoId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/mtgo/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByArenaId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/arena/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByTcgplayerId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/tcgplayer/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallCard findByCardmarketId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/cardmarket/{id}", id)
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallManifestList findManifest(String lang, String order) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> {
                    var b = uriBuilder.path("/cards/manifest");
                    if (lang != null && !lang.isBlank()) b = b.queryParam("lang", lang);
                    if (order != null && !order.isBlank()) b = b.queryParam("order", order);
                    return b.build();
                })
                .retrieve()
                .body(ScryfallManifestList.class);
    }

    ScryfallList findCollection(List<ScryfallIdentifier> identifiers) {
        return scryfallRestClient.post()
                .uri("/cards/collection")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CollectionBody(identifiers))
                .retrieve()
                .body(ScryfallList.class);
    }

    ScryfallCard findRandom(String query) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/cards/random");
                    if (query != null && !query.isBlank()) {
                        builder = builder.queryParam("q", query);
                    }
                    return builder.build();
                })
                .retrieve()
                .body(ScryfallCard.class);
    }

    ScryfallList search(String q, String unique, String order, String dir, Integer page) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/cards/search").queryParam("q", q);
                    if (unique != null) builder = builder.queryParam("unique", unique);
                    if (order != null) builder = builder.queryParam("order", order);
                    if (dir != null) builder = builder.queryParam("dir", dir);
                    if (page != null) builder = builder.queryParam("page", page);
                    return builder.build();
                })
                .retrieve()
                .body(ScryfallList.class);
    }

    ScryfallCatalog autocomplete(String q) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/cards/autocomplete")
                        .queryParam("q", q)
                        .build())
                .retrieve()
                .body(ScryfallCatalog.class);
    }

    ScryfallSetList findAllSets() {
        return scryfallRestClient.get()
                .uri("/sets")
                .retrieve()
                .body(ScryfallSetList.class);
    }

    ScryfallSet findSetByCode(String code) {
        return scryfallRestClient.get()
                .uri("/sets/{code}", code.toLowerCase())
                .retrieve()
                .body(ScryfallSet.class);
    }

    ScryfallSet findSetById(String id) {
        return scryfallRestClient.get()
                .uri("/sets/{id}", id)
                .retrieve()
                .body(ScryfallSet.class);
    }

    ScryfallSet findSetByTcgplayerId(int id) {
        return scryfallRestClient.get()
                .uri("/sets/tcgplayer/{id}", id)
                .retrieve()
                .body(ScryfallSet.class);
    }

    ScryfallRulingList findRulingsByCardId(String id) {
        return scryfallRestClient.get()
                .uri("/cards/{id}/rulings", id)
                .retrieve()
                .body(ScryfallRulingList.class);
    }

    ScryfallRulingList findRulingsByMultiverseId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/multiverse/{id}/rulings", id)
                .retrieve()
                .body(ScryfallRulingList.class);
    }

    ScryfallRulingList findRulingsByMtgoId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/mtgo/{id}/rulings", id)
                .retrieve()
                .body(ScryfallRulingList.class);
    }

    ScryfallRulingList findRulingsByArenaId(int id) {
        return scryfallRestClient.get()
                .uri("/cards/arena/{id}/rulings", id)
                .retrieve()
                .body(ScryfallRulingList.class);
    }

    ScryfallRulingList findRulingsBySetAndNumber(String setCode, String collectorNumber) {
        return scryfallRestClient.get()
                .uri("/cards/{set}/{number}/rulings", setCode.toLowerCase(), collectorNumber)
                .retrieve()
                .body(ScryfallRulingList.class);
    }

    ScryfallSymbolList findAllSymbols() {
        return scryfallRestClient.get()
                .uri("/symbology")
                .retrieve()
                .body(ScryfallSymbolList.class);
    }

    ScryfallManaCost parseMana(String cost) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/symbology/parse-mana")
                        .queryParam("cost", cost)
                        .build())
                .retrieve()
                .body(ScryfallManaCost.class);
    }

    ScryfallCatalog findCatalog(String type) {
        return scryfallRestClient.get()
                .uri("/catalog/{type}", type.toLowerCase())
                .retrieve()
                .body(ScryfallCatalog.class);
    }

    ScryfallBulkDataList findAllBulkData() {
        return scryfallRestClient.get()
                .uri("/bulk-data")
                .retrieve()
                .body(ScryfallBulkDataList.class);
    }

    ScryfallBulkData findBulkDataById(String id) {
        return scryfallRestClient.get()
                .uri("/bulk-data/{id}", id)
                .retrieve()
                .body(ScryfallBulkData.class);
    }

    ScryfallBulkData findBulkDataByType(String type) {
        return scryfallRestClient.get()
                .uri("/bulk-data/{type}", type.toLowerCase())
                .retrieve()
                .body(ScryfallBulkData.class);
    }

    ScryfallMigrationList findMigrations(Integer page) {
        return scryfallRestClient.get()
                .uri(uriBuilder -> {
                    var b = uriBuilder.path("/migrations");
                    if (page != null) b = b.queryParam("page", page);
                    return b.build();
                })
                .retrieve()
                .body(ScryfallMigrationList.class);
    }

    ScryfallMigration findMigrationById(String id) {
        return scryfallRestClient.get()
                .uri("/migrations/{id}", id)
                .retrieve()
                .body(ScryfallMigration.class);
    }

    private static void pause() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while calling Scryfall", exception);
        }
    }

    private record CollectionBody(List<ScryfallIdentifier> identifiers) {
    }
}
