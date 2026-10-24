package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.request.CollectionRequest;
import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.dto.response.ScanCardResultResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.cards.service.impl.ScryfallManifestList;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.mtgchecker.cards.service.IOcrService;

import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Tag(name = "Cards", description = "Look up Magic cards and prices from Scryfall and local DB cache")
public class CardController {

    private final ICardService cardService;
    private final IOcrService ocrService;

    @GetMapping
    @Operation(summary = "Find a card by exact or fuzzy name, optionally scoped to a set")
    public ResponseEntity<CardResponse> findByName(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String exact,
            @RequestParam(required = false) String fuzzy,
            @RequestParam(required = false) String set
    ) {
        String exactParam = exact != null ? exact : name;
        return ResponseEntity.ok(cardService.findByName(exactParam, fuzzy, set));
    }

    @GetMapping("/id/{id}")
    @Operation(summary = "Find a card by Scryfall UUID (with fast DB cache hit)")
    public ResponseEntity<CardResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(cardService.findById(id));
    }

    @GetMapping("/printings")
    @Operation(summary = "List every printing of a card, with its own set and price")
    public ResponseEntity<List<CardResponse>> findPrintings(@RequestParam @NotBlank String name) {
        return ResponseEntity.ok(cardService.findPrintings(name));
    }

    @PostMapping("/collection")
    @Operation(summary = "Find several cards by name in one request")
    public ResponseEntity<CardCollectionResponse> findCollection(@Valid @RequestBody CollectionRequest request) {
        return ResponseEntity.ok(cardService.findByNames(request.getNames()));
    }

    @GetMapping("/by-set")
    @Operation(summary = "Find a specific printing by set code, collector number, and optional language")
    public ResponseEntity<CardResponse> findBySet(
            @RequestParam @NotBlank String set,
            @RequestParam @NotBlank String number,
            @RequestParam(required = false) String lang
    ) {
        return ResponseEntity.ok(cardService.findBySetAndCollectorNumber(set, number, lang));
    }

    @GetMapping("/multiverse/{id}")
    @Operation(summary = "Find a card by Gatherer Multiverse ID")
    public ResponseEntity<CardResponse> findByMultiverseId(@PathVariable int id) {
        return ResponseEntity.ok(cardService.findByMultiverseId(id));
    }

    @GetMapping("/mtgo/{id}")
    @Operation(summary = "Find a card by MTGO Catalog ID")
    public ResponseEntity<CardResponse> findByMtgoId(@PathVariable int id) {
        return ResponseEntity.ok(cardService.findByMtgoId(id));
    }

    @GetMapping("/arena/{id}")
    @Operation(summary = "Find a card by Magic: The Gathering Arena ID")
    public ResponseEntity<CardResponse> findByArenaId(@PathVariable int id) {
        return ResponseEntity.ok(cardService.findByArenaId(id));
    }

    @GetMapping("/tcgplayer/{id}")
    @Operation(summary = "Find a card by TCGplayer Product ID")
    public ResponseEntity<CardResponse> findByTcgplayerId(@PathVariable int id) {
        return ResponseEntity.ok(cardService.findByTcgplayerId(id));
    }

    @GetMapping("/cardmarket/{id}")
    @Operation(summary = "Find a card by Cardmarket Product ID")
    public ResponseEntity<CardResponse> findByCardmarketId(@PathVariable int id) {
        return ResponseEntity.ok(cardService.findByCardmarketId(id));
    }

    @GetMapping("/random")
    @Operation(summary = "Find a random card, optionally filtered by a Scryfall query")
    public ResponseEntity<CardResponse> findRandom(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(cardService.findRandom(q));
    }

    @GetMapping("/search")
    @Operation(summary = "Full-text search for cards using Scryfall query syntax, with pagination")
    public ResponseEntity<CardCollectionResponse> search(
            @RequestParam @NotBlank String q,
            @RequestParam(required = false) String unique,
            @RequestParam(required = false) String order,
            @RequestParam(required = false) String dir,
            @RequestParam(required = false) Integer page
    ) {
        return ResponseEntity.ok(cardService.search(q, unique, order, dir, page));
    }

    @GetMapping("/autocomplete")
    @Operation(summary = "Autocomplete card name suggestions (DB index + Scryfall)")
    public ResponseEntity<List<String>> autocomplete(@RequestParam @NotBlank String q) {
        return ResponseEntity.ok(cardService.autocomplete(q));
    }

    @GetMapping("/manifest")
    @Operation(summary = "Get a lightweight manifest of cards for cache syncing")
    public ResponseEntity<ScryfallManifestList> getManifest(
            @RequestParam(required = false) String lang,
            @RequestParam(required = false) String order
    ) {
        return ResponseEntity.ok(cardService.findManifest(lang, order));
    }

    @GetMapping("/local-cache")
    @Operation(summary = "Search cards directly in local DB cache (< 5ms response time)")
    public ResponseEntity<List<CardResponse>> searchLocalCache(
            @RequestParam @NotBlank String query,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(cardService.searchLocalCache(query, limit));
    }

    @PostMapping(value = "/scan-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a card photo to run OCR and retrieve exact card details")
    public ResponseEntity<ScanCardResultResponse> scanCardImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ocrService.scanCardImage(file));
    }

    @PostMapping("/scan-base64")
    @Operation(summary = "Send base64 encoded photo to run OCR and retrieve exact card details")
    public ResponseEntity<ScanCardResultResponse> scanCardBase64(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ocrService.scanCardBase64(body.get("image")));
    }
}
