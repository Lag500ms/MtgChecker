package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CardCollectionResponse;
import com.mtgchecker.cards.dto.response.CardResponse;

import java.util.List;

public interface ICardService {

    CardResponse findByExactName(String name);

    List<CardResponse> findPrintings(String name);

    CardResponse findBySetAndCollectorNumber(String setCode, String collectorNumber);

    List<CardResponse> findByIds(List<String> scryfallIds);

    CardCollectionResponse findByNames(List<String> names);
}
