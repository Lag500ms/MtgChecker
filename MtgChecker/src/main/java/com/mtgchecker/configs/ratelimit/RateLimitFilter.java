package com.mtgchecker.configs.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (isExcluded(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitTier tier = resolveTier(path);
        String clientIp = resolveClientIp(request);

        ConsumptionProbe probe = rateLimitService.tryConsume(tier, clientIp);

        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long waitNanos = probe.getNanosToWaitForRefill();
            long waitSeconds = Math.max(1, (waitNanos / 1_000_000_000L) + 1);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitSeconds));

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", Instant.now().toString());
            errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorDetails.put("error", "Too Many Requests");
            errorDetails.put("message", "Rate limit exceeded for " + tier.name() + ". Please retry in " + waitSeconds + " seconds.");
            errorDetails.put("retryAfterSeconds", waitSeconds);

            response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
        }
    }

    private boolean isExcluded(String path) {
        return path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.equals("/health")
                || path.equals("/")
                || path.equals("/error")
                || path.startsWith("/favicon.ico");
    }

    private RateLimitTier resolveTier(String path) {
        if (path.startsWith("/api/v1/rules/ask") || path.startsWith("/rules/ask")
                || path.startsWith("/api/v1/rules/interact") || path.startsWith("/rules/interact")) {
            return RateLimitTier.AI_JUDGE;
        }
        if (path.contains("/scan") || path.contains("/detect")) {
            return RateLimitTier.OCR_SCAN;
        }
        if (path.contains("/autocomplete") || path.contains("/search") || path.contains("/printings")) {
            return RateLimitTier.SEARCH_AUTOCOMPLETE;
        }
        if (path.startsWith("/api/v1/auth") || path.startsWith("/auth")) {
            return RateLimitTier.AUTH;
        }
        return RateLimitTier.DEFAULT;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] parts = xForwardedFor.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
