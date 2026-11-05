package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.CardSymbolResponse;
import com.mtgchecker.cards.dto.response.ManaCostResponse;
import com.mtgchecker.cards.service.ISymbologyService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.ExternalServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SymbologyServiceImpl implements ISymbologyService {

    private final ScryfallClient scryfallClient;

    @Override
    @Cacheable(value = "symbols_all", unless = "#result == null || #result.isEmpty()")
    public List<CardSymbolResponse> findAllSymbols() {
        try {
            ScryfallSymbolList list = scryfallClient.findAllSymbols();
            if (list == null || list.data() == null) {
                return List.of();
            }
            return list.data().stream().map(SymbologyServiceImpl::toSymbolResponse).toList();
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Failed to fetch symbols from Scryfall: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public ManaCostResponse parseMana(String cost) {
        try {
            ScryfallManaCost manaCost = scryfallClient.parseMana(cost);
            if (manaCost == null) {
                throw new ExternalServiceException("Scryfall returned an empty mana cost response");
            }
            return toManaCostResponse(manaCost);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST)) {
                throw new BadRequestException("Invalid mana cost: " + cost);
            }
            throw new ExternalServiceException("Failed to parse mana cost: " + ex.getResponseBodyAsString(), ex);
        }
    }

    private static CardSymbolResponse toSymbolResponse(ScryfallSymbol s) {
        return CardSymbolResponse.builder()
                .symbol(s.symbol())
                .svgUri(s.svgUri())
                .looseVariant(s.looseVariant())
                .english(s.english())
                .transposable(s.transposable())
                .representsMana(s.representsMana())
                .cmc(s.cmc())
                .appearsInManaCosts(s.appearsInManaCosts())
                .funny(s.funny())
                .colors(s.colors())
                .gathererAlternates(s.gathererAlternates())
                .build();
    }

    private static ManaCostResponse toManaCostResponse(ScryfallManaCost m) {
        return ManaCostResponse.builder()
                .cost(m.cost())
                .cmc(m.cmc())
                .colors(m.colors())
                .colorless(m.colorless())
                .monocolored(m.monocolored())
                .multicolored(m.multicolored())
                .build();
    }
}
