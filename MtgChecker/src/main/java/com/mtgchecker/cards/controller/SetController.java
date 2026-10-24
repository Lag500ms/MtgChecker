package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.SetResponse;
import com.mtgchecker.cards.service.ISetService;
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
@RequestMapping("/api/v1/sets")
@RequiredArgsConstructor
@Tag(name = "Sets", description = "Look up Magic: The Gathering sets from Scryfall")
public class SetController {

    private final ISetService setService;

    @GetMapping
    @Operation(summary = "List all Magic: The Gathering sets")
    public ResponseEntity<List<SetResponse>> findAll() {
        return ResponseEntity.ok(setService.findAll());
    }

    @GetMapping("/{code}")
    @Operation(summary = "Find a set by its Scryfall set code (e.g. dom, m21, neo)")
    public ResponseEntity<SetResponse> findByCode(@PathVariable String code) {
        return ResponseEntity.ok(setService.findByCode(code));
    }

    @GetMapping("/id/{id}")
    @Operation(summary = "Find a set by Scryfall UUID")
    public ResponseEntity<SetResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(setService.findById(id));
    }

    @GetMapping("/tcgplayer/{id}")
    @Operation(summary = "Find a set by TCGplayer group ID")
    public ResponseEntity<SetResponse> findByTcgplayerId(@PathVariable int id) {
        return ResponseEntity.ok(setService.findByTcgplayerId(id));
    }
}
