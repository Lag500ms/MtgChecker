package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.SetResponse;
import com.mtgchecker.cards.service.ISetService;
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
public class SetServiceImpl implements ISetService {

    private final ScryfallClient scryfallClient;

    @Override
    @Cacheable(value = "sets_all", unless = "#result == null || #result.isEmpty()")
    public List<SetResponse> findAll() {
        try {
            ScryfallSetList setList = scryfallClient.findAllSets();
            if (setList == null || setList.data() == null) {
                return List.of();
            }
            return setList.data().stream().map(SetServiceImpl::toResponse).toList();
        } catch (RestClientResponseException exception) {
            throw new ExternalServiceException("Scryfall sets request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    @Cacheable(value = "sets", key = "#code", unless = "#result == null")
    public SetResponse findByCode(String code) {
        try {
            ScryfallSet set = scryfallClient.findSetByCode(code);
            if (set == null) {
                throw new ExternalServiceException("Scryfall returned an empty set");
            }
            return toResponse(set);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Set not found: " + code);
            }
            throw new ExternalServiceException("Scryfall set request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public SetResponse findById(String id) {
        try {
            ScryfallSet set = scryfallClient.findSetById(id);
            if (set == null) {
                throw new ExternalServiceException("Scryfall returned an empty set");
            }
            return toResponse(set);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Set not found with id: " + id);
            }
            throw new ExternalServiceException("Scryfall set request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    @Override
    public SetResponse findByTcgplayerId(int id) {
        try {
            ScryfallSet set = scryfallClient.findSetByTcgplayerId(id);
            if (set == null) {
                throw new ExternalServiceException("Scryfall returned an empty set");
            }
            return toResponse(set);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Set not found with TCGplayer id: " + id);
            }
            throw new ExternalServiceException("Scryfall set request failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    private static SetResponse toResponse(ScryfallSet set) {
        return SetResponse.builder()
                .id(set.id())
                .code(set.code())
                .name(set.name())
                .setType(set.setType())
                .releasedAt(set.releasedAt())
                .cardCount(set.cardCount())
                .scryfallUri(set.scryfallUri())
                .iconSvgUri(set.iconSvgUri())
                .build();
    }
}
