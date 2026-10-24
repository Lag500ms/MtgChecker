package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.RulingResponse;
import com.mtgchecker.cards.service.IRulingService;
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
@RequestMapping("/api/v1/rulings")
@RequiredArgsConstructor
@Tag(name = "Rulings", description = "Official rules and notes for cards from Scryfall")
public class RulingController {

    private final IRulingService rulingService;

    @GetMapping("/card/{id}")
    @Operation(summary = "Get rulings by Scryfall card UUID")
    public ResponseEntity<List<RulingResponse>> getByCardId(@PathVariable String id) {
        return ResponseEntity.ok(rulingService.findByCardId(id));
    }

    @GetMapping("/multiverse/{id}")
    @Operation(summary = "Get rulings by Gatherer Multiverse ID")
    public ResponseEntity<List<RulingResponse>> getByMultiverseId(@PathVariable int id) {
        return ResponseEntity.ok(rulingService.findByMultiverseId(id));
    }

    @GetMapping("/mtgo/{id}")
    @Operation(summary = "Get rulings by MTGO ID")
    public ResponseEntity<List<RulingResponse>> getByMtgoId(@PathVariable int id) {
        return ResponseEntity.ok(rulingService.findByMtgoId(id));
    }

    @GetMapping("/arena/{id}")
    @Operation(summary = "Get rulings by Arena ID")
    public ResponseEntity<List<RulingResponse>> getByArenaId(@PathVariable int id) {
        return ResponseEntity.ok(rulingService.findByArenaId(id));
    }

    @GetMapping("/{code}/{number}")
    @Operation(summary = "Get rulings by set code and collector number")
    public ResponseEntity<List<RulingResponse>> getBySetAndNumber(
            @PathVariable String code,
            @PathVariable String number
    ) {
        return ResponseEntity.ok(rulingService.findBySetAndCollectorNumber(code, number));
    }
}
