package com.mtgchecker.configs.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class RateLimitService {

    private static final String SCRIPT_LUA = """
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refillTokens = tonumber(ARGV[2])
            local refillDurationMs = tonumber(ARGV[3])
            local requested = tonumber(ARGV[4])
            local nowMs = tonumber(ARGV[5])
            local ttl = tonumber(ARGV[6])

            local data = redis.call('HMGET', key, 'tokens', 'last_refill')
            local tokens = tonumber(data[1])
            local lastRefill = tonumber(data[2])

            if not tokens or not lastRefill then
                tokens = capacity
                lastRefill = nowMs
            else
                local elapsed = math.max(0, nowMs - lastRefill)
                if elapsed > 0 then
                    local tokensToAdd = (elapsed / refillDurationMs) * refillTokens
                    tokens = math.min(capacity, tokens + tokensToAdd)
                    lastRefill = nowMs
                end
            end

            local consumed = 0
            local remaining = math.floor(tokens)
            local waitMs = 0

            if tokens >= requested then
                tokens = tokens - requested
                remaining = math.floor(tokens)
                consumed = 1
                redis.call('HSET', key, 'tokens', tostring(tokens), 'last_refill', tostring(lastRefill))
                redis.call('EXPIRE', key, ttl)
            else
                local needed = requested - tokens
                waitMs = math.ceil((needed / refillTokens) * refillDurationMs)
                redis.call('HSET', key, 'tokens', tostring(tokens), 'last_refill', tostring(lastRefill))
                redis.call('EXPIRE', key, ttl)
            end

            return { consumed, remaining, waitMs }
            """;

    private static final String TTL_SECONDS = "300";

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisScript<List> tokenBucketScript;

    private static class LocalEntry {
        final Bucket bucket;
        volatile long lastAccess;

        LocalEntry(Bucket bucket, long lastAccess) {
            this.bucket = bucket;
            this.lastAccess = lastAccess;
        }
    }

    private final Map<String, LocalEntry> fallbackBuckets = Collections.synchronizedMap(
            new LinkedHashMap<String, LocalEntry>(128, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, LocalEntry> eldest) {
                    return size() > 20000 || (System.currentTimeMillis() - eldest.getValue().lastAccess > 300000L);
                }
            }
    );

    @Autowired
    public RateLimitService(@Autowired(required = false) StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setScriptText(SCRIPT_LUA);
        script.setResultType(List.class);
        this.tokenBucketScript = script;
    }

    public ConsumptionProbe tryConsume(RateLimitTier tier, String clientId) {
        if (stringRedisTemplate != null) {
            try {
                String key = "ratelimit:" + tier.name() + ":" + clientId;
                List<String> keys = Collections.singletonList(key);
                long nowMs = System.currentTimeMillis();
                long refillDurationMs = tier.getRefillDuration().toMillis();

                List<?> rawResult = stringRedisTemplate.execute(
                        tokenBucketScript,
                        keys,
                        String.valueOf(tier.getCapacity()),
                        String.valueOf(tier.getRefillTokens()),
                        String.valueOf(refillDurationMs),
                        "1",
                        String.valueOf(nowMs),
                        TTL_SECONDS
                );

                if (rawResult != null && rawResult.size() >= 3) {
                    long consumedFlag = ((Number) rawResult.get(0)).longValue();
                    long remaining = ((Number) rawResult.get(1)).longValue();
                    long waitMs = ((Number) rawResult.get(2)).longValue();

                    if (consumedFlag == 1L) {
                        return ConsumptionProbe.consumed(remaining, 0L);
                    } else {
                        long waitNanos = Math.max(1_000_000L, waitMs * 1_000_000L);
                        return ConsumptionProbe.rejected(remaining, waitNanos, waitNanos);
                    }
                }
            } catch (Exception e) {
                log.warn("Redis rate limit check failed for client: {}, falling back to local memory: {}", clientId, e.getMessage());
            }
        }

        return tryConsumeFallback(tier, clientId);
    }

    private ConsumptionProbe tryConsumeFallback(RateLimitTier tier, String clientId) {
        String key = tier.name() + ":" + clientId;
        long now = System.currentTimeMillis();
        LocalEntry entry;
        synchronized (fallbackBuckets) {
            entry = fallbackBuckets.computeIfAbsent(key, k -> new LocalEntry(createNewBucket(tier), now));
            entry.lastAccess = now;
        }
        return entry.bucket.tryConsumeAndReturnRemaining(1);
    }

    public void clear() {
        fallbackBuckets.clear();
        if (stringRedisTemplate != null) {
            try {
                Set<String> keys = stringRedisTemplate.keys("ratelimit:*");
                if (keys != null && !keys.isEmpty()) {
                    stringRedisTemplate.delete(keys);
                }
            } catch (Exception e) {
                log.warn("Failed to clear Redis rate limit keys: {}", e.getMessage());
            }
        }
    }

    private Bucket createNewBucket(RateLimitTier tier) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(tier.getCapacity())
                .refillGreedy(tier.getRefillTokens(), tier.getRefillDuration())
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
