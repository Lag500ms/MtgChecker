package com.mtgchecker.inventory.service;

import com.mtgchecker.inventory.dto.request.AddOwnedCardRequest;
import com.mtgchecker.inventory.dto.request.UpdateOwnedCardRequest;
import com.mtgchecker.inventory.dto.response.CollectionSummaryResponse;
import com.mtgchecker.inventory.dto.response.OwnedCardResponse;

import java.util.List;

public interface IInventoryService {

    CollectionSummaryResponse getSummary();

    OwnedCardResponse add(AddOwnedCardRequest request);

    List<OwnedCardResponse> findAll();

    OwnedCardResponse updateQuantity(String id, UpdateOwnedCardRequest request);

    void delete(String id);
}
