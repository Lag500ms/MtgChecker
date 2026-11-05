package com.mtgchecker.decks.service;

import com.mtgchecker.decks.dto.request.CreateDeckRequest;
import com.mtgchecker.decks.dto.request.SyncDeckCardsRequest;
import com.mtgchecker.decks.dto.request.UpdateDeckRequest;
import com.mtgchecker.decks.dto.response.DeckResponse;
import com.mtgchecker.decks.dto.response.DeckSummaryResponse;

import java.util.List;

public interface IDeckService {
    List<DeckSummaryResponse> findAllByAccount(String accountId);
    DeckResponse findByIdAndAccount(String id, String accountId);
    DeckResponse create(String accountId, CreateDeckRequest request);
    DeckResponse update(String id, String accountId, UpdateDeckRequest request);
    DeckResponse syncCards(String id, String accountId, SyncDeckCardsRequest request);
    void delete(String id, String accountId);
}
