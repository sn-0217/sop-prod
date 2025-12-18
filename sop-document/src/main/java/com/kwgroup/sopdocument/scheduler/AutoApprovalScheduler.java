package com.kwgroup.sopdocument.scheduler;

import com.kwgroup.sopdocument.model.ApprovalStatus;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import com.kwgroup.sopdocument.service.ApprovalService;
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

    private final SopEntryRepository sopEntryRepository;
    private final ApprovalService approvalService;

    @Value("${sop.approval.auto-approve-days:7}")
    private int autoApproveDays;

    /**
     * Runs every hour to check for SOPs pending approval for 7+ days.
     * Cron: 0 0 * * * * = At the top of every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkAndAutoApprove() {
        log.info("Running auto-approval scheduler check...");

        LocalDateTime cutoff = LocalDateTime.now().minusDays(autoApproveDays);
        // Use createdAt since pendingAt was removed
        List<SopEntry> pendingSOPs = sopEntryRepository.findByStatusAndCreatedAtBefore(
                ApprovalStatus.PENDING_APPROVAL,
                cutoff);

        if (pendingSOPs.isEmpty()) {
            log.info("No SOPs eligible for auto-approval");
            return;
        }

        log.info("Found {} SOP(s) eligible for auto-approval", pendingSOPs.size());

        for (SopEntry sop : pendingSOPs) {
            try {
                approvalService.autoApproveSOP(sop);
                log.info("Auto-approved SOP: {}", sop.getId());
            } catch (Exception e) {
                log.error("Failed to auto-approve SOP: {}", sop.getId(), e);
            }
        }

        log.info("Auto-approval scheduler completed. Processed {} SOP(s)", pendingSOPs.size());
    }
}
