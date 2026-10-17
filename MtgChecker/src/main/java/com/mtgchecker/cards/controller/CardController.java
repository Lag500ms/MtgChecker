package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.request.CollectionRequest;
import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.ICardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Tag(name = "Cards", description = "Look up Magic cards and prices from Scryfall")
public class CardController {

    private final ICardService cardService;

    @GetMapping
    @Operation(summary = "Find a card by exact name")
    public ResponseEntity<CardResponse> findByName(@RequestParam @NotBlank String name) {
        return ResponseEntity.ok(cardService.findByExactName(name));
    }

    @GetMapping("/printings")
    @Operation(summary = "List every printing of a card, with its own set and price")
    public ResponseEntity<List<CardResponse>> findPrintings(@RequestParam @NotBlank String name) {
        return ResponseEntity.ok(cardService.findPrintings(name));
    }

    @PostMapping("/collection")
    @Operation(summary = "Find several cards by name")
    public ResponseEntity<CardCollectionResponse> findCollection(@Valid @RequestBody CollectionRequest request) {
        return ResponseEntity.ok(cardService.findByNames(request.getNames()));
    }
}
