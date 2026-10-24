package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.BulkDataResponse;
import com.mtgchecker.cards.dto.response.BulkSyncStatusResponse;

import java.util.List;

public interface IBulkDataService {

    List<BulkDataResponse> findAll();

    BulkDataResponse findById(String id);

    BulkDataResponse findByType(String type);

    BulkSyncStatusResponse startSync(String type, Integer limit);

    BulkSyncStatusResponse getSyncStatus();
}
