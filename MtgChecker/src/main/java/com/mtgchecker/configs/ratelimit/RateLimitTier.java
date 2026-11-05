package com.mtgchecker.configs.ratelimit;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.Duration;

@Getter
@RequiredArgsConstructor
public enum RateLimitTier {

    AI_JUDGE(10, 10, Duration.ofMinutes(1)),
    OCR_SCAN(20, 20, Duration.ofMinutes(1)),
    SEARCH_AUTOCOMPLETE(60, 60, Duration.ofMinutes(1)),
    AUTH(15, 15, Duration.ofMinutes(1)),
    DEFAULT(120, 120, Duration.ofMinutes(1));

    private final long capacity;
    private final long refillTokens;
    private final Duration refillDuration;
}
