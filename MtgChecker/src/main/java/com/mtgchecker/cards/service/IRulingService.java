package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.RulingResponse;
import java.util.List;

public interface IRulingService {
    List<RulingResponse> findByCardId(String cardId);
    List<RulingResponse> findByMultiverseId(int multiverseId);
    List<RulingResponse> findByMtgoId(int mtgoId);
    List<RulingResponse> findByArenaId(int arenaId);
    List<RulingResponse> findBySetAndCollectorNumber(String setCode, String collectorNumber);
}
