package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.CatalogResponse;
import com.mtgchecker.cards.service.ICatalogService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CatalogServiceImpl implements ICatalogService {

    private final ScryfallClient scryfallClient;

    private static final List<String> SUPPORTED_TYPES = List.of(
            "card-names",
            "artist-names",
            "word-bank",
            "supertypes",
            "card-types",
            "artifact-types",
            "battle-types",
            "creature-types",
            "enchantment-types",
            "land-types",
            "planeswalker-types",
            "spell-types",
            "powers",
            "toughnesses",
            "loyalties",
            "keyword-abilities",
            "keyword-actions",
            "ability-words",
            "flavor-words",
            "watermarks"
    );

    private static final Set<String> SUPPORTED_TYPES_SET = Set.copyOf(SUPPORTED_TYPES);

    @Override
    public List<String> getSupportedCatalogTypes() {
        return SUPPORTED_TYPES;
    }

    @Override
    public CatalogResponse findCatalog(String type) {
        String normalizedType = type.toLowerCase().trim();
        if (!SUPPORTED_TYPES_SET.contains(normalizedType)) {
            throw new BadRequestException("Unsupported catalog type: " + type + ". Supported types: " + SUPPORTED_TYPES);
        }

        try {
            ScryfallCatalog catalog = scryfallClient.findCatalog(normalizedType);
            if (catalog == null) {
                throw new ExternalServiceException("Scryfall returned empty catalog for " + normalizedType);
            }
            return CatalogResponse.builder()
                    .type(normalizedType)
                    .totalValues(catalog.totalValues() != null ? catalog.totalValues() : (catalog.data() != null ? catalog.data().size() : 0))
                    .data(catalog.data() != null ? catalog.data() : List.of())
                    .build();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Catalog not found for type: " + type);
            }
            throw new ExternalServiceException("Failed to fetch catalog: " + ex.getResponseBodyAsString(), ex);
        }
    }
}
