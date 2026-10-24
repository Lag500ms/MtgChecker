package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.impl.ScryfallManifestList;

import java.util.List;

public interface ICardService {

    CardResponse findByExactName(String name);

    CardResponse findByName(String exact, String fuzzy, String set);

    CardResponse findById(String id);

    List<CardResponse> findPrintings(String name);

    CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber);

    CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber, String lang);

    CardResponse findByMultiverseId(int id);

    CardResponse findByMtgoId(int id);

    CardResponse findByArenaId(int id);

    CardResponse findByTcgplayerId(int id);

    CardResponse findByCardmarketId(int id);

    List<CardResponse> findByIds(List<String> scryfallIds);

    CardCollectionResponse findByNames(List<String> names);

    CardResponse findRandom(String query);

    CardCollectionResponse search(String q, String unique, String order, String dir, Integer page);

    List<String> autocomplete(String q);

    ScryfallManifestList findManifest(String lang, String order);

    List<CardResponse> searchLocalCache(String query, int limit);
}
