package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.CardMigrationResponse;
import com.mtgchecker.cards.service.IMigrationService;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MigrationServiceImpl implements IMigrationService {

    private final ScryfallClient scryfallClient;

    @Override
    public List<CardMigrationResponse> findMigrations(Integer page) {
        try {
            ScryfallMigrationList list = scryfallClient.findMigrations(page);
            if (list == null || list.data() == null) {
                return List.of();
            }
            return list.data().stream().map(MigrationServiceImpl::toResponse).toList();
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Failed to fetch migrations: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public CardMigrationResponse findById(String id) {
        try {
            ScryfallMigration item = scryfallClient.findMigrationById(id);
            if (item == null) {
                throw new NotFoundException("Migration not found with id: " + id);
            }
            return toResponse(item);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Migration not found with id: " + id);
            }
            throw new ExternalServiceException("Failed to fetch migration: " + ex.getResponseBodyAsString(), ex);
        }
    }

    private static CardMigrationResponse toResponse(ScryfallMigration m) {
        return CardMigrationResponse.builder()
                .id(m.id())
                .createdAt(m.createdAt())
                .uri(m.uri())
                .oldScryfallId(m.oldScryfallId())
                .newScryfallId(m.newScryfallId())
                .migrationStrategy(m.migrationStrategy())
                .note(m.note())
                .build();
    }
}
