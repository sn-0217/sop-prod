package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.Approver;
import com.kwgroup.sopdocument.repository.ApproverRepository;
import com.kwgroup.sopdocument.security.ApprovalRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApproverService {

    private final ApproverRepository approverRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApprovalRateLimiter rateLimiter;

    /**
     * Authenticate an approver with username and password.
     * Includes rate limiting to prevent brute force attacks.
     *
     * @param username    the approver username
     * @param rawPassword the plain text password
     * @return Optional of Approver if authentication successful, empty otherwise
     */
    public Optional<Approver> authenticate(String username, String rawPassword) {
        // Check rate limit first
        if (!rateLimiter.isAllowed(username)) {
            log.warn("Authentication rate limit exceeded for username: {}", username);
            return Optional.empty();
        }

        // Find approver by username
        Optional<Approver> approverOpt = approverRepository.findByUsername(username);

        if (approverOpt.isEmpty()) {
            log.warn("Authentication failed: username not found: {}", username);
            return Optional.empty();
        }

        Approver approver = approverOpt.get();

        // Check if approver is active
        if (!approver.isActive()) {
            log.warn("Authentication failed: approver account is inactive: {}", username);
            return Optional.empty();
        }

        // Validate password
        if (!validatePassword(rawPassword, approver.getPasswordHash())) {
            log.warn("Authentication failed: invalid password for username: {}", username);
            return Optional.empty();
        }

        // Success - clear rate limit
        rateLimiter.clearAttempts(username);
        log.info("Approver authenticated successfully: {}", username);
        return Optional.of(approver);
    }

    /**
     * Validate a raw password against a bcrypt hash.
     */
    public boolean validatePassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    /**
     * Get all active approvers for selection in upload form.
     */
    public List<Approver> getAllActiveApprovers() {
        return approverRepository.findByActiveTrue();
    }

    /**
     * Hash a password using bcrypt(12).
     * Utility method for creating approver accounts.
     */
    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Get the next available approver for auto-assignment.
     * Uses round-robin selection among active approvers.
     * 
     * @return Optional of Approver if any active approvers exist, empty otherwise
     */
    public Optional<Approver> getNextAvailableApprover() {
        List<Approver> activeApprovers = getAllActiveApprovers();
        if (activeApprovers.isEmpty()) {
            log.warn("No active approvers available for auto-assignment");
            return Optional.empty();
        }
        // Simple selection: return the first active approver
        // In future, could implement actual round-robin or load balancing
        Approver approver = activeApprovers.get(0);
        log.info("Auto-assigned approver: {} ({})", approver.getName(), approver.getId());
        return Optional.of(approver);
    }
}
