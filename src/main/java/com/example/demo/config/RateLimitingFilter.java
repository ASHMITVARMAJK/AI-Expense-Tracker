package com.example.demo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Senior Developer Custom Rate Limiting Filter.
 * Restricts request frequency on critical AI endpoints to protect API key quotas.
 */
@Component
public class RateLimitingFilter implements Filter {

    private static class RateLimitBucket {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
    }

    private final Map<String, RateLimitBucket> rateLimitBuckets = new ConcurrentHashMap<>();

    // Limits: Maximum 10 requests per minute per user/IP for AI operations
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_DURATION_MS = Duration.ofMinutes(1).toMillis();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        // Rate limit only the AI endpoints (/api/ai/parse and /api/ai/insights)
        if (path.startsWith("/api/ai/")) {
            String limitKey = getRateLimitKey(httpRequest);

            if (!isRequestAllowed(limitKey)) {
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\": \"Too many AI requests. Rate limit is 10 requests per minute. Please try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Extracts a unique key for rate limiting. 
     * Uses the authenticated Firebase UID if logged in, otherwise falls back to the proxy-aware Client IP.
     */
    private String getRateLimitKey(HttpServletRequest request) {
        // 1. Try to rate limit by authenticated User ID (Firebase UID)
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                return "uid:" + jwt.getSubject();
            }
        } catch (Exception ignored) {}

        // 2. Fallback: Rate limit by Client IP (Proxy-Aware)
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else {
            // If behind multiple proxies, the first IP is the original client
            int firstComma = ip.indexOf(',');
            if (firstComma != -1) {
                ip = ip.substring(0, firstComma).trim();
            }
        }
        return "ip:" + ip;
    }

    private boolean isRequestAllowed(String key) {
        RateLimitBucket bucket = rateLimitBuckets.computeIfAbsent(key, k -> new RateLimitBucket());
        
        long now = System.currentTimeMillis();
        long startTime = bucket.windowStart.get();

        if (now - startTime > WINDOW_DURATION_MS) {
            synchronized (bucket) {
                // Double-checked locking to safely reset the interval window
                if (bucket.windowStart.get() == startTime) {
                    bucket.requestCount.set(0);
                    bucket.windowStart.set(now);
                }
            }
        }

        int currentCount = bucket.requestCount.incrementAndGet();
        return currentCount <= MAX_REQUESTS_PER_MINUTE;
    }
}
