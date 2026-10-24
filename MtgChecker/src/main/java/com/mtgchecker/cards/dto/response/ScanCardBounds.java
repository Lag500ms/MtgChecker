package com.mtgchecker.cards.dto.response;

public record ScanCardBounds(
        int x,
        int y,
        int width,
        int height
) {}
