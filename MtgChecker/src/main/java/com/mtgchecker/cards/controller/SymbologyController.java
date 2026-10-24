package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.CardSymbolResponse;
import com.mtgchecker.cards.dto.response.ManaCostResponse;
import com.mtgchecker.cards.service.ISymbologyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/symbology")
@RequiredArgsConstructor
@Tag(name = "Symbology", description = "Magic mana symbols and cost parser from Scryfall")
public class SymbologyController {

    private final ISymbologyService symbologyService;

    @GetMapping
    @Operation(summary = "Get all card symbols (mana, tap, loyalty, etc.)")
    public ResponseEntity<List<CardSymbolResponse>> getAllSymbols() {
        return ResponseEntity.ok(symbologyService.findAllSymbols());
    }

    @GetMapping("/parse-mana")
    @Operation(summary = "Parse a shorthand mana cost string (e.g. 2WW) into Scryfall format")
    public ResponseEntity<ManaCostResponse> parseMana(@RequestParam @NotBlank String cost) {
        return ResponseEntity.ok(symbologyService.parseMana(cost));
    }
}
