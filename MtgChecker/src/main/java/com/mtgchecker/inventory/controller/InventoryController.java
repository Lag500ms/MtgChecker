package com.mtgchecker.inventory.controller;

import com.mtgchecker.inventory.dto.request.AddOwnedCardRequest;
import com.mtgchecker.inventory.dto.request.UpdateOwnedCardRequest;
import com.mtgchecker.inventory.dto.response.CollectionSummaryResponse;
import com.mtgchecker.inventory.dto.response.OwnedCardResponse;
import com.mtgchecker.inventory.service.IInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Cards you own, stored as a specific printing")
@SecurityRequirement(name = "Bearer Authentication")
public class InventoryController {

    private final IInventoryService inventoryService;

    @GetMapping("/summary")
    @Operation(summary = "Get collection portfolio summary including total value, 7-day delta, and card list")
    public ResponseEntity<CollectionSummaryResponse> getSummary() {
        return ResponseEntity.ok(inventoryService.getSummary());
    }

    @GetMapping
    @Operation(summary = "List owned cards with the current price of each printing")
    public ResponseEntity<List<OwnedCardResponse>> findAll() {
        return ResponseEntity.ok(inventoryService.findAll());
    }

    @PostMapping
    @Operation(summary = "Add a printing you own, or increase its quantity")
    public ResponseEntity<OwnedCardResponse> add(@Valid @RequestBody AddOwnedCardRequest request) {
        return ResponseEntity.ok(inventoryService.add(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Set the quantity of an owned printing")
    public ResponseEntity<OwnedCardResponse> updateQuantity(
            @PathVariable String id,
            @Valid @RequestBody UpdateOwnedCardRequest request
    ) {
        return ResponseEntity.ok(inventoryService.updateQuantity(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove an owned printing")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
