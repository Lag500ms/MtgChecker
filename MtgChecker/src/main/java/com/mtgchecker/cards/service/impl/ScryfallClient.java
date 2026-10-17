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

    ScryfallList findCollection(List<ScryfallIdentifier> identifiers) {
        return scryfallRestClient.post()
                .uri("/cards/collection")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CollectionBody(identifiers))
                .retrieve()
                .body(ScryfallList.class);
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
