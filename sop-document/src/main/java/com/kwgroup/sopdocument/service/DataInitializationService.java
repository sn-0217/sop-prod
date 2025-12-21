package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.Approver;
import com.kwgroup.sopdocument.repository.ApproverRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to initialize default data in the database on application startup.
 * Loads default approver accounts if they don't already exist.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializationService {

    private final ApproverRepository approverRepository;

    /**
     * Initialize default approvers on application startup.
     * This method runs after the Spring context is fully initialized.
     */
    @PostConstruct
    @Transactional
    public void initializeDefaultApprovers() {
        log.info("Initializing default approvers...");

        // Define default approvers
        createDefaultApproverIfNotExists(
                "santhu",
                "$2a$12$kAgeo5OiTLKiz7rPkR7yn.T/VDDJjmbs3vLHEfg9vvL4/xR3jMQgW",
                "Santosh Battula",
                "hack3r.1702@gmail.com");

        createDefaultApproverIfNotExists(
                "nira",
                "$2a$12$4wPPn3N1nr5t.zhlHT0Ta.14eCyI9GEWa33MDzUO2euvappZvUdJG",
                "Nirosha Desole",
                "hack3r.1702@gmail.com");

        log.info("Default approvers initialization complete");
    }

    /**
     * Create a default approver if one with the given username doesn't already
     * exist.
     */
    private void createDefaultApproverIfNotExists(
            String username,
            String passwordHash,
            String name,
            String email) {
        if (approverRepository.findByUsername(username).isEmpty()) {
            Approver approver = Approver.builder()
                    .username(username)
                    .passwordHash(passwordHash)
                    .name(name)
                    .email(email)
                    .active(true)
                    .build();

            approverRepository.save(approver);
            log.info("Created default approver: {} ({})", name, username);
        } else {
            log.info("Approver '{}' already exists, skipping creation", username);
        }
    }
}
