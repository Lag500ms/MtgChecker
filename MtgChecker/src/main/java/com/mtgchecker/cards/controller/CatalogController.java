package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.CatalogResponse;
import com.mtgchecker.cards.service.ICatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs")
@RequiredArgsConstructor
@Tag(name = "Catalogs", description = "Valid catalog values from Scryfall (types, keywords, artists...)")
public class CatalogController {

    private final ICatalogService catalogService;

    @GetMapping
    @Operation(summary = "Get list of all 20 supported catalog types")
    public ResponseEntity<List<String>> listCatalogTypes() {
        return ResponseEntity.ok(catalogService.getSupportedCatalogTypes());
    }

    @GetMapping("/{type}")
    @Operation(summary = "Get values of a specific catalog (e.g. creature-types, card-names, powers, keyword-abilities)")
    public ResponseEntity<CatalogResponse> getCatalog(@PathVariable String type) {
        return ResponseEntity.ok(catalogService.findCatalog(type));
    }
}
