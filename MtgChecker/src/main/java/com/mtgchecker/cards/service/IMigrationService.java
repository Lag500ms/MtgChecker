package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CardMigrationResponse;
import java.util.List;

public interface IMigrationService {
    List<CardMigrationResponse> findMigrations(Integer page);
    CardMigrationResponse findById(String id);
}
