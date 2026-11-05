package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardFaceResponse;
import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.entity.CachedCard;
import com.mtgchecker.cards.repository.CachedCardRepository;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardServiceImpl implements ICardService {

    private final ScryfallClient scryfallClient;
    private final CachedCardRepository cachedCardRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Cacheable(value = "cards", key = "#id", unless = "#result == null")
    public CardResponse findById(String id) {
        Optional<CachedCard> cached = cachedCardRepository.findById(id);
        if (cached.isPresent()) {
            CardResponse restored = restoreFromCache(cached.get());
            if (restored != null) {
                return restored;
            }
        }

        try {
            ScryfallCard card = scryfallClient.findById(id);
            if (card == null) {
                throw new NotFoundException("Card not found with Scryfall id: " + id);
            }
            CardResponse response = toResponse(card);
            saveToCache(response);
            return response;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found with Scryfall id: " + id);
            }
            throw new ExternalServiceException("Scryfall card lookup failed: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    @Cacheable(value = "card_named", key = "#name", unless = "#result == null")
    public CardResponse findByExactName(String name) {
        return findByName(name, null, null);
    }

    @Override
    public CardResponse findByName(String exact, String fuzzy, String set) {
        if (exact != null && !exact.isBlank() && (set == null || set.isBlank())) {
            String normalized = normalizeName(exact);
            Optional<CachedCard> cached = cachedCardRepository.findByNormalizedName(normalized);
            if (cached.isPresent()) {
                CardResponse restored = restoreFromCache(cached.get());
                if (restored != null) {
                    return restored;
                }
            }
        }

        try {
            ScryfallCard card = scryfallClient.findByName(exact, fuzzy, set);
            if (card == null) {
                throw new NotFoundException("Card not found with specified name parameters");
            }
            CardResponse response = toResponse(card);
            saveToCache(response);
            return response;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found: " + (exact != null ? exact : fuzzy));
            }
            throw new ExternalServiceException("Scryfall card lookup failed: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    @Cacheable(value = "card_printings", key = "#name", unless = "#result == null")
    public List<CardResponse> findPrintings(String name) {
        try {
            List<ScryfallCard> cards = scryfallClient.findPrintings(name);
            if (cards.isEmpty()) {
                throw new NotFoundException("Card not found: " + name);
            }
            List<CardResponse> responses = cards.stream().map(CardServiceImpl::toResponse).toList();
            responses.forEach(this::saveToCache);
            return responses;
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found: " + name);
            }
            throw new ExternalServiceException("Scryfall printings request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber) {
        return findBySetAndCollectorNumber(setCode, collectorNumber, null);
    }

    @Override
    @Cacheable(value = "cards", key = "#setCode + ':' + #collectorNumber + ':' + (#lang != null ? #lang : 'en')", unless = "#result == null")
    public CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber, String lang) {
        Optional<CachedCard> cached = (lang == null || lang.isBlank() || "en".equalsIgnoreCase(lang))
                ? cachedCardRepository.findBySetCodeIgnoreCaseAndCollectorNumberIgnoreCase(setCode, collectorNumber)
                : cachedCardRepository.findBySetCodeIgnoreCaseAndCollectorNumberIgnoreCaseAndLangIgnoreCase(setCode, collectorNumber, lang);

        if (cached.isPresent()) {
            CardResponse restored = restoreFromCache(cached.get());
            if (restored != null) {
                return restored;
            }
        }

        try {
            ScryfallCard card = scryfallClient.findBySetAndCollectorNumber(setCode, collectorNumber, lang);
            if (card == null) {
                throw new NotFoundException("Printing not found: " + setCode + " #" + collectorNumber);
            }
            CardResponse response = toResponse(card);
            saveToCache(response);
            return response;
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Printing not found: " + setCode + " #" + collectorNumber);
            }
            throw new ExternalServiceException("Scryfall printing request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public CardResponse findByMultiverseId(int id) {
        return fetchAndCache(() -> scryfallClient.findByMultiverseId(id), "Multiverse ID: " + id);
    }

    @Override
    public CardResponse findByMtgoId(int id) {
        return fetchAndCache(() -> scryfallClient.findByMtgoId(id), "MTGO ID: " + id);
    }

    @Override
    public CardResponse findByArenaId(int id) {
        return fetchAndCache(() -> scryfallClient.findByArenaId(id), "Arena ID: " + id);
    }

    @Override
    public CardResponse findByTcgplayerId(int id) {
        return fetchAndCache(() -> scryfallClient.findByTcgplayerId(id), "TCGplayer ID: " + id);
    }

    @Override
    public CardResponse findByCardmarketId(int id) {
        return fetchAndCache(() -> scryfallClient.findByCardmarketId(id), "Cardmarket ID: " + id);
    }

    @Override
    public List<CardResponse> findByIds(List<String> scryfallIds) {
        List<CardResponse> cards = new ArrayList<>();
        List<String> missingIds = new ArrayList<>();

        for (String id : scryfallIds) {
            Optional<CachedCard> cached = cachedCardRepository.findById(id);
            if (cached.isPresent()) {
                CardResponse res = restoreFromCache(cached.get());
                if (res != null) {
                    cards.add(res);
                    continue;
                }
            }
            missingIds.add(id);
        }

        for (int start = 0; start < missingIds.size(); start += 75) {
            if (start > 0) {
                pause();
            }
            List<String> chunk = missingIds.subList(start, Math.min(start + 75, missingIds.size()));
            List<CardResponse> fetched = findChunk(chunk);
            fetched.forEach(this::saveToCache);
            cards.addAll(fetched);
        }
        return cards;
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
            cards.forEach(this::saveToCache);
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

    @Override
    public CardResponse findRandom(String query) {
        try {
            ScryfallCard card = scryfallClient.findRandom(query);
            if (card == null) {
                throw new ExternalServiceException("Scryfall returned an empty card");
            }
            CardResponse response = toResponse(card);
            saveToCache(response);
            return response;
        } catch (RestClientResponseException exception) {
            throw new ExternalServiceException("Scryfall random request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public CardCollectionResponse search(String q, String unique, String order, String dir, Integer page) {
        try {
            ScryfallList list = scryfallClient.search(q, unique, order, dir, page);
            if (list == null) {
                throw new ExternalServiceException("Scryfall returned an empty search result");
            }
            List<CardResponse> cards = list.data() == null
                    ? List.of()
                    : list.data().stream().map(CardServiceImpl::toResponse).toList();
            cards.forEach(this::saveToCache);
            return CardCollectionResponse.builder()
                    .cards(cards)
                    .notFound(List.of())
                    .totalCards(list.totalCards())
                    .hasMore(list.hasMore())
                    .nextPage(list.nextPage())
                    .build();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("No cards found for query: " + q);
            }
            throw new ExternalServiceException("Scryfall search request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    @Cacheable(value = "card_autocomplete", key = "#q", unless = "#result == null")
    public List<String> autocomplete(String q) {
        String normalizedPrefix = normalizeName(q);
        List<String> localSuggestions = normalizedPrefix.isBlank()
                ? List.of()
                : cachedCardRepository.findNameSuggestions(normalizedPrefix, PageRequest.of(0, 20));
        if (!localSuggestions.isEmpty() && localSuggestions.size() >= 10) {
            return localSuggestions;
        }

        try {
            ScryfallCatalog catalog = scryfallClient.autocomplete(q);
            if (catalog == null || catalog.data() == null) {
                return localSuggestions;
            }
            return catalog.data();
        } catch (RestClientResponseException exception) {
            return localSuggestions;
        }
    }

    @Override
    public ScryfallManifestList findManifest(String lang, String order) {
        try {
            return scryfallClient.findManifest(lang, order);
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Failed to fetch card manifest: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public List<CardResponse> searchLocalCache(String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<CachedCard> records = cachedCardRepository.searchByNameLike(query, PageRequest.of(0, safeLimit));
        return records.stream()
                .map(this::restoreFromCache)
                .filter(res -> res != null)
                .toList();
    }

    private void saveToCache(CardResponse response) {
        if (response == null || response.getId() == null) return;
        try {
            String rawJson = objectMapper.writeValueAsString(response);
            CachedCard cached = CachedCard.builder()
                    .id(response.getId())
                    .oracleId(response.getOracleId())
                    .name(response.getName())
                    .normalizedName(normalizeName(response.getName()))
                    .setCode(response.getSet() != null ? response.getSet().toLowerCase() : "")
                    .setName(response.getSetName())
                    .collectorNumber(response.getCollectorNumber() != null ? response.getCollectorNumber().toLowerCase() : "")
                    .lang(response.getLang())
                    .manaCost(response.getManaCost())
                    .typeLine(response.getTypeLine())
                    .oracleText(response.getOracleText())
                    .rarity(response.getRarity())
                    .power(response.getPower())
                    .toughness(response.getToughness())
                    .loyalty(response.getLoyalty())
                    .artist(response.getArtist())
                    .flavorText(response.getFlavorText())
                    .releasedAt(response.getReleasedAt())
                    .scryfallUri(response.getScryfallUri())
                    .rawJson(rawJson)
                    .cachedAt(LocalDateTime.now())
                    .build();
            cachedCardRepository.save(cached);
        } catch (Exception ex) {
            log.warn("Failed to cache card {}: {}", response.getId(), ex.getMessage());
        }
    }

    private CardResponse restoreFromCache(CachedCard cached) {
        if (cached == null || cached.getRawJson() == null) return null;
        try {
            return objectMapper.readValue(cached.getRawJson(), CardResponse.class);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to deserialize cached card {}: {}", cached.getId(), ex.getMessage());
            return null;
        }
    }

    private CardResponse fetchAndCache(CardSupplier supplier, String context) {
        try {
            ScryfallCard card = supplier.get();
            if (card == null) {
                throw new NotFoundException("Card not found for " + context);
            }
            CardResponse response = toResponse(card);
            saveToCache(response);
            return response;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Card not found for " + context);
            }
            throw new ExternalServiceException("Scryfall lookup failed: " + ex.getResponseBodyAsString(), ex);
        }
    }

    private static String normalizeName(String name) {
        if (name == null) return "";
        return name.toLowerCase().replaceAll("[^a-z0-9]", "");
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
                .imageUris(card.imageUris())
                .cardFaces(toCardFaces(card.cardFaces()))
                .colors(card.colors())
                .colorIdentity(card.colorIdentity())
                .keywords(card.keywords())
                .legalities(card.legalities())
                .power(card.power())
                .toughness(card.toughness())
                .loyalty(card.loyalty())
                .artist(card.artist())
                .flavorText(card.flavorText())
                .releasedAt(card.releasedAt())
                .scryfallUri(card.scryfallUri())
                .purchaseUris(card.purchaseUris())
                .edhrecRank(card.edhrecRank())
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

    private static List<CardFaceResponse> toCardFaces(List<ScryfallCardFace> faces) {
        if (faces == null) {
            return null;
        }
        return faces.stream()
                .map(face -> CardFaceResponse.builder()
                        .name(face.name())
                        .manaCost(face.manaCost())
                        .typeLine(face.typeLine())
                        .oracleText(face.oracleText())
                        .imageUris(face.imageUris())
                        .build())
                .toList();
    }

    @FunctionalInterface
    private interface CardSupplier {
        ScryfallCard get();
    }
}
