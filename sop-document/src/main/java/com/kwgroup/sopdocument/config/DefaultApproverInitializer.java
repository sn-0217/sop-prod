package com.kwgroup.sopdocument.config;

import com.kwgroup.sopdocument.model.Approver;
import com.kwgroup.sopdocument.repository.ApproverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DefaultApproverInitializer implements CommandLineRunner {

    private final ApproverRepository approverRepository;

    @Override
    public void run(String... args) throws Exception {
        String defaultUsername = "santhu";

        // Check if the default approver already exists
        Optional<Approver> existingApprover = approverRepository.findByUsername(defaultUsername);

        if (existingApprover.isPresent()) {
            log.info("Default approver '{}' already exists. Skipping initialization.", defaultUsername);
            return;
        }

        // Create default approver
        Approver defaultApprover = Approver.builder()
                .username("santhu")
                .email("hack3r.1702@gmail.com")
                .name("santosh battula")
                .passwordHash("$2a$12$JNFT2H6woPSP736nNrSpL.z9IiLF.QjAndn1lZmGKZ.utBerrsi7y")
                .active(true)
                .build();

        approverRepository.save(defaultApprover);
        log.info("✅ Default approver created successfully: {} ({})", defaultApprover.getName(),
                defaultApprover.getUsername());
    }
}
