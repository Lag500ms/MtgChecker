package com.mtgchecker.decks.controller;

import com.mtgchecker.decks.dto.request.CreateDeckFormatRequest;
import com.mtgchecker.decks.dto.response.DeckFormatResponse;
import com.mtgchecker.decks.service.IDeckFormatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/deck-formats")
@RequiredArgsConstructor
@Tag(name = "Deck Formats", description = "Query and manage supported Magic deck formats (Commander, Standard, Pauper, etc.)")
public class DeckFormatController {

    private final IDeckFormatService deckFormatService;

    @GetMapping
    @Operation(summary = "List all active deck formats (Public)")
    public ResponseEntity<List<DeckFormatResponse>> findAllActive() {
        return ResponseEntity.ok(deckFormatService.findAllActive());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get deck format details by format ID (Public)")
    public ResponseEntity<DeckFormatResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(deckFormatService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MANAGE') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Create a new deck format (Admin)")
    public ResponseEntity<DeckFormatResponse> create(@Valid @RequestBody CreateDeckFormatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckFormatService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MANAGE') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update deck format rules (Admin)")
    public ResponseEntity<DeckFormatResponse> update(
            @PathVariable String id,
            @Valid @RequestBody CreateDeckFormatRequest request
    ) {
        return ResponseEntity.ok(deckFormatService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MANAGE') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Deactivate a deck format (Admin)")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        deckFormatService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
