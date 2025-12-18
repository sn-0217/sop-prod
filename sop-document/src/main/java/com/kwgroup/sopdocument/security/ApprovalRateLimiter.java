package com.kwgroup.sopdocument.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
@Slf4j
public class ApprovalRateLimiter {

    private final Map<String, Queue<LocalDateTime>> attempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final int WINDOW_MINUTES = 15;

    /**
     * Check if the given username is allowed to attempt approval authentication.
     * Rate limit: 5 attempts per 15 minutes per username.
     *
     * @param username the username attempting authentication
     * @return true if allowed, false if rate limited
     */
    public boolean isAllowed(String username) {
        Queue<LocalDateTime> userAttempts = attempts.computeIfAbsent(
                username, k -> new ConcurrentLinkedQueue<>());

        // Remove attempts older than the time window
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(WINDOW_MINUTES);
        userAttempts.removeIf(time -> time.isBefore(cutoff));

        // Check if limit exceeded
        if (userAttempts.size() >= MAX_ATTEMPTS) {
            log.warn("Rate limit exceeded for username: {}", username);
            return false; // Rate limited
        }

        // Record this attempt
        userAttempts.add(LocalDateTime.now());
        return true;
    }

    /**
     * Clear attempts for a username (e.g., after successful authentication).
     */
    public void clearAttempts(String username) {
        attempts.remove(username);
        log.debug("Cleared rate limit attempts for username: {}", username);
    }
}
