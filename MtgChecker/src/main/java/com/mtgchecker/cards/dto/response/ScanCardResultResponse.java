package com.mtgchecker.cards.dto.response;

import java.util.List;

public record ScanCardResultResponse(
        CardResponse card,
        String confidence,
        String recognizedText,
        ScanCardBounds bounds,
        List<String> triedCandidates
) {}
