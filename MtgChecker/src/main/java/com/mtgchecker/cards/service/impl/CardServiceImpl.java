package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements ICardService {

    private final ScryfallClient scryfallClient;

    @Override
    public CardResponse findByExactName(String name) {
        try {
            ScryfallCard card = scryfallClient.findByExactName(name);
            if (card == null) {
                throw new ExternalServiceException("Scryfall returned an empty card");
            }
            return toResponse(card);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found: " + name);
            }
            throw new ExternalServiceException("Scryfall request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public List<CardResponse> findPrintings(String name) {
        try {
            List<ScryfallCard> cards = scryfallClient.findPrintings(name);
            if (cards.isEmpty()) {
                throw new NotFoundException("Card not found: " + name);
            }
            return cards.stream().map(CardServiceImpl::toResponse).toList();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found: " + name);
            }
            throw new ExternalServiceException("Scryfall printings request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber) {
        try {
            ScryfallCard card = scryfallClient.findBySetAndCollectorNumber(setCode, collectorNumber);
            if (card == null) {
                throw new ExternalServiceException("Scryfall returned an empty printing");
            }
            return toResponse(card);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Printing not found: " + setCode + " #" + collectorNumber);
            }
            throw new ExternalServiceException("Scryfall printing request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public List<CardResponse> findByIds(List<String> scryfallIds) {
        List<CardResponse> cards = new ArrayList<>();
        for (int start = 0; start < scryfallIds.size(); start += 75) {
            if (start > 0) {
                pause();
            }
            List<String> chunk = scryfallIds.subList(start, Math.min(start + 75, scryfallIds.size()));
            cards.addAll(findChunk(chunk));
        }
        return cards;
    }

    private List<CardResponse> findChunk(List<String> scryfallIds) {
        try {
            List<ScryfallIdentifier> identifiers = scryfallIds.stream()
                    .map(ScryfallIdentifier::byId)
                    .toList();
            ScryfallList list = scryfallClient.findCollection(identifiers);
            if (list == null || list.data() == null) {
                return List.of();
            }
            return list.data().stream().map(CardServiceImpl::toResponse).toList();
        } catch (RestClientResponseException exception) {
            throw new ExternalServiceException("Scryfall collection request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    private static void pause() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ExternalServiceException("Interrupted while calling Scryfall", exception);
        }
    }

    @Override
    public CardCollectionResponse findByNames(List<String> names) {
        try {
            List<ScryfallIdentifier> identifiers = names.stream()
                    .map(ScryfallIdentifier::byName)
                    .toList();
            ScryfallList list = scryfallClient.findCollection(identifiers);
            if (list == null) {
                throw new ExternalServiceException("Scryfall returned an empty collection");
            }
            List<CardResponse> cards = list.data() == null
                    ? List.of()
                    : list.data().stream().map(CardServiceImpl::toResponse).toList();
            List<String> notFound = list.notFound() == null
                    ? List.of()
                    : list.notFound().stream().map(ScryfallIdentifier::name).toList();
            return CardCollectionResponse.builder()
                    .cards(cards)
                    .notFound(notFound)
                    .build();
        } catch (RestClientResponseException exception) {
            throw new ExternalServiceException("Scryfall collection request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    private static CardResponse toResponse(ScryfallCard card) {
        return CardResponse.builder()
                .id(card.id())
                .oracleId(card.oracleId())
                .name(card.name())
                .lang(card.lang())
                .set(card.set())
                .setName(card.setName())
                .collectorNumber(card.collectorNumber())
                .manaCost(card.manaCost())
                .typeLine(card.typeLine())
                .oracleText(card.oracleText())
                .rarity(card.rarity())
                .finishes(card.finishes())
                .prices(toPrice(card.prices()))
                .build();
    }

    private static CardPriceResponse toPrice(ScryfallPrices prices) {
        if (prices == null) {
            return null;
        }
        return CardPriceResponse.builder()
                .usd(prices.usd())
                .usdFoil(prices.usdFoil())
                .usdEtched(prices.usdEtched())
                .eur(prices.eur())
                .eurFoil(prices.eurFoil())
                .tix(prices.tix())
                .build();
    }
}
