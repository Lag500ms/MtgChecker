package com.mtgchecker.decks.controller;

import com.mtgchecker.configs.security.SecurityUtil;
import com.mtgchecker.decks.dto.request.CreateDeckRequest;
import com.mtgchecker.decks.dto.request.SyncDeckCardsRequest;
import com.mtgchecker.decks.dto.request.UpdateDeckRequest;
import com.mtgchecker.decks.dto.response.DeckResponse;
import com.mtgchecker.decks.dto.response.DeckSummaryResponse;
import com.mtgchecker.decks.service.IDeckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
@Tag(name = "Decks", description = "Build, manage, and synchronize MTG decks across formats (Commander, Standard, Pauper, etc.)")
@SecurityRequirement(name = "Bearer Authentication")
public class DeckController {

    private final IDeckService deckService;

    @GetMapping
    @Operation(summary = "List all decks owned by the authenticated user")
    public ResponseEntity<List<DeckSummaryResponse>> findAll() {
        String accountId = SecurityUtil.currentAccountId();
        return ResponseEntity.ok(deckService.findAllByAccount(accountId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full details of a deck including its cards")
    public ResponseEntity<DeckResponse> findById(@PathVariable String id) {
        String accountId = SecurityUtil.currentAccountId();
        return ResponseEntity.ok(deckService.findByIdAndAccount(id, accountId));
    }

    @PostMapping
    @Operation(summary = "Create a new deck")
    public ResponseEntity<DeckResponse> create(@Valid @RequestBody CreateDeckRequest request) {
        String accountId = SecurityUtil.currentAccountId();
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.create(accountId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update deck information (name, description, format, commander, cover art)")
    public ResponseEntity<DeckResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateDeckRequest request
    ) {
        String accountId = SecurityUtil.currentAccountId();
        return ResponseEntity.ok(deckService.update(id, accountId, request));
    }

    @PutMapping("/{id}/cards")
    @Operation(summary = "Synchronize all cards in a deck (Cloud Sync)")
    public ResponseEntity<DeckResponse> syncCards(
            @PathVariable String id,
            @Valid @RequestBody SyncDeckCardsRequest request
    ) {
        String accountId = SecurityUtil.currentAccountId();
        return ResponseEntity.ok(deckService.syncCards(id, accountId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a deck")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        String accountId = SecurityUtil.currentAccountId();
        deckService.delete(id, accountId);
        return ResponseEntity.noContent().build();
    }
}
