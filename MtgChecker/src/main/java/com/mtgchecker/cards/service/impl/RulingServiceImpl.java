package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.RulingResponse;
import com.mtgchecker.cards.service.IRulingService;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RulingServiceImpl implements IRulingService {

    private final ScryfallClient scryfallClient;

    @Override
    @Cacheable(value = "rulings", key = "#cardId", unless = "#result == null")
    public List<RulingResponse> findByCardId(String cardId) {
        return execute(() -> scryfallClient.findRulingsByCardId(cardId));
    }

    @Override
    public List<RulingResponse> findByMultiverseId(int multiverseId) {
        return execute(() -> scryfallClient.findRulingsByMultiverseId(multiverseId));
    }

    @Override
    public List<RulingResponse> findByMtgoId(int mtgoId) {
        return execute(() -> scryfallClient.findRulingsByMtgoId(mtgoId));
    }

    @Override
    public List<RulingResponse> findByArenaId(int arenaId) {
        return execute(() -> scryfallClient.findRulingsByArenaId(arenaId));
    }

    @Override
    @Cacheable(value = "rulings", key = "#setCode + ':' + #collectorNumber", unless = "#result == null")
    public List<RulingResponse> findBySetAndCollectorNumber(String setCode, String collectorNumber) {
        return execute(() -> scryfallClient.findRulingsBySetAndNumber(setCode, collectorNumber));
    }

    private List<RulingResponse> execute(ScryfallSupplier supplier) {
        try {
            ScryfallRulingList list = supplier.get();
            if (list == null || list.data() == null) {
                return List.of();
            }
            return list.data().stream().map(RulingServiceImpl::toResponse).toList();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Rulings not found");
            }
            throw new ExternalServiceException("Scryfall rulings request failed: " + ex.getResponseBodyAsString(), ex);
        }
    }

    private static RulingResponse toResponse(ScryfallRuling ruling) {
        return RulingResponse.builder()
                .source(ruling.source())
                .publishedAt(ruling.publishedAt())
                .comment(ruling.comment())
                .oracleId(ruling.oracleId())
                .build();
    }

    @FunctionalInterface
    private interface ScryfallSupplier {
        ScryfallRulingList get();
    }
}
