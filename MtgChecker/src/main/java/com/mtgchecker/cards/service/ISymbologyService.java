package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CardSymbolResponse;
import com.mtgchecker.cards.dto.response.ManaCostResponse;

import java.util.List;

public interface ISymbologyService {
    List<CardSymbolResponse> findAllSymbols();
    ManaCostResponse parseMana(String cost);
}
