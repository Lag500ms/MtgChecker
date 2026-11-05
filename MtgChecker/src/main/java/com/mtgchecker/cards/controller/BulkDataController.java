package com.mtgchecker.cards.controller;

import com.mtgchecker.cards.dto.response.BulkDataResponse;
import com.mtgchecker.cards.dto.response.BulkSyncStatusResponse;
import com.mtgchecker.cards.service.IBulkDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bulk-data")
@RequiredArgsConstructor
@Tag(name = "Bulk Data", description = "Daily Scryfall compressed JSONL dumps and Database synchronization")
public class BulkDataController {

    private final IBulkDataService bulkDataService;

    @GetMapping
    @Operation(summary = "Get list of all bulk data files")
    public ResponseEntity<List<BulkDataResponse>> findAll() {
        return ResponseEntity.ok(bulkDataService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a bulk data file metadata by UUID")
    public ResponseEntity<BulkDataResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(bulkDataService.findById(id));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get a bulk data file metadata by type (e.g. oracle-cards, default-cards, all-cards, rulings)")
    public ResponseEntity<BulkDataResponse> findByType(@PathVariable String type) {
        return ResponseEntity.ok(bulkDataService.findByType(type));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGE')")
    @Operation(summary = "Download and stream import gzipped JSONL card data into local database")
    public ResponseEntity<BulkSyncStatusResponse> startSync(
            @RequestParam(defaultValue = "default-cards") String type,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(bulkDataService.startSync(type, limit));
    }

    @GetMapping("/sync/status")
    @Operation(summary = "Get current progress status of background bulk data synchronization")
    public ResponseEntity<BulkSyncStatusResponse> getSyncStatus() {
        return ResponseEntity.ok(bulkDataService.getSyncStatus());
    }
}
