package com.kwgroup.sopdocument.scheduler;

import com.kwgroup.sopdocument.model.PendingOperation;
import com.kwgroup.sopdocument.model.PendingOperationStatus;
import com.kwgroup.sopdocument.repository.PendingOperationRepository;
import com.kwgroup.sopdocument.service.PendingOperationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
@ConditionalOnProperty(name = "sop.approval.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class AutoApprovalScheduler {

    private final PendingOperationRepository pendingOperationRepository;
    private final PendingOperationService pendingOperationService;

    @Value("${sop.approval.auto-approve-days:7}")
    private int autoApproveDays;

    /**
     * Runs every hour to check for pending operations awaiting approval for 7+
     * days.
     * Cron: 0 0 * * * * = At the top of every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkAndAutoApprove() {
        log.info("Running auto-approval scheduler check...");

        LocalDateTime cutoff = LocalDateTime.now().minusDays(autoApproveDays);
        List<PendingOperation> pendingOperations = pendingOperationRepository.findByStatusAndRequestedAtBefore(
                PendingOperationStatus.PENDING,
                cutoff);

        if (pendingOperations.isEmpty()) {
            log.info("No pending operations eligible for auto-approval");
            return;
        }

        log.info("Found {} pending operation(s) eligible for auto-approval", pendingOperations.size());

        for (PendingOperation operation : pendingOperations) {
            try {
                pendingOperationService.autoApproveOperation(operation);
                log.info("Auto-approved operation: {} (type: {})", operation.getId(), operation.getOperationType());
            } catch (Exception e) {
                log.error("Failed to auto-approve operation: {}", operation.getId(), e);
            }
        }

        log.info("Auto-approval scheduler completed. Processed {} operation(s)", pendingOperations.size());
    }
}
