package com.mtgchecker.decks.service;

import com.mtgchecker.decks.dto.request.CreateDeckFormatRequest;
import com.mtgchecker.decks.dto.response.DeckFormatResponse;

import java.util.List;

public interface IDeckFormatService {
    List<DeckFormatResponse> findAllActive();
    List<DeckFormatResponse> findAll();
    DeckFormatResponse findById(String id);
    DeckFormatResponse create(CreateDeckFormatRequest request);
    DeckFormatResponse update(String id, CreateDeckFormatRequest request);
    void delete(String id);
}
