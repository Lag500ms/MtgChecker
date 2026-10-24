package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.CardMigrationResponse;
import com.mtgchecker.cards.service.IMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/migrations")
@RequiredArgsConstructor
@Tag(name = "Card Migrations", description = "Track card record merges and ID changes on Scryfall")
public class MigrationController {

    private final IMigrationService migrationService;

    @GetMapping
    @Operation(summary = "Get paginated list of card migrations (350 per page)")
    public ResponseEntity<List<CardMigrationResponse>> getMigrations(@RequestParam(required = false) Integer page) {
        return ResponseEntity.ok(migrationService.findMigrations(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a card migration by UUID")
    public ResponseEntity<CardMigrationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(migrationService.findById(id));
    }
}
