package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.*;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final SopEntryRepository sopEntryRepository;
    private final ApproverService approverService;
    private final EmailService emailService;
    private final SopEntryService sopEntryService;
    private final ActionHistoryService actionHistoryService;

    @Value("${sop.notification.admin-email}")
    private String adminEmail;

    /**
     * Approve a SOP after authenticating the approver.
     */
    public void approveSOP(String sopId, String username, String password, String comments) {
        // Authenticate approver
        Approver approver = authenticateApprover(username, password);

        // Get and validate SOP
        SopEntry sop = getSopEntry(sopId);
        validateSopStatus(sop, ApprovalStatus.PENDING_APPROVAL, "approve");

        // Update SOP status
        sop.setStatus(ApprovalStatus.APPROVED);
        sopEntryRepository.save(sop);

        // Log to history
        actionHistoryService.logAction(ActionType.APPROVED, sop, approver.getName(), comments);

        // Send notification email
        sendApprovalNotification(sop, approver, comments);

        log.info("SOP approved: {} by approver: {}", sopId, username);
    }

    /**
     * Reject a SOP after authenticating the approver.
     * Comments are mandatory for rejection.
     * The SOP will be deleted from the database and disk.
     */
    public void rejectSOP(String sopId, String username, String password, String comments) {
        // Validate comments are provided
        if (comments == null || comments.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comments are required for rejection");
        }

        // Authenticate approver
        Approver approver = authenticateApprover(username, password);

        // Get and validate SOP
        SopEntry sop = getSopEntry(sopId);
        validateSopStatus(sop, ApprovalStatus.PENDING_APPROVAL, "reject");

        // Log to history BEFORE deletion
        actionHistoryService.logAction(ActionType.REJECTED, sop, approver.getName(), comments);

        // Send notification email BEFORE deletion
        sendRejectionNotification(sop, approver, comments);

        // Delete the SOP from database and disk (prevents pile-up)
        // Skip notification to avoid duplicate emails (rejection email already sent)
        sopEntryService.delete(sopId, true);

        log.info("SOP rejected and deleted: {} by approver: {} with comments: {}", sopId, username, comments);
    }

    /**
     * Auto-approve a SOP that has been pending for 7+ days.
     * Called by the scheduled task.
     */
    public void autoApproveSOP(SopEntry sop) {
        if (sop.getStatus() != ApprovalStatus.PENDING_APPROVAL) {
            log.warn("Attempted to auto-approve SOP {} that is not in PENDING_APPROVAL status", sop.getId());
            return;
        }

        // Update SOP status
        sop.setStatus(ApprovalStatus.APPROVED);
        sopEntryRepository.save(sop);

        // Log to history
        actionHistoryService.logAction(ActionType.AUTO_APPROVED, sop, "System", "Auto-approved after 7 days");

        // Send notification email
        sendAutoApprovalNotification(sop);

        log.info("SOP auto-approved: {}", sop.getId());
    }

    /**
     * Get all SOPs pending approval.
     */
    public List<SopEntry> getPendingSOPs() {
        return sopEntryRepository.findByStatus(ApprovalStatus.PENDING_APPROVAL);
    }

    // ===== Helper Methods =====

    private Approver authenticateApprover(String username, String password) {
        Optional<Approver> approverOpt = approverService.authenticate(username, password);
        if (approverOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid approver credentials or rate limit exceeded");
        }
        return approverOpt.get();
    }

    private SopEntry getSopEntry(String sopId) {
        return sopEntryRepository.findById(sopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "SOP not found: " + sopId));
    }

    private void validateSopStatus(SopEntry sop, ApprovalStatus expectedStatus, String action) {
        if (sop.getStatus() != expectedStatus) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("Cannot %s SOP %s - current status is %s, expected %s",
                            action, sop.getId(), sop.getStatus(), expectedStatus));
        }
    }

    private void sendApprovalNotification(SopEntry sop, Approver approver, String comments) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("sopTitle", sop.getFileName());
            variables.put("brand", sop.getBrand());
            variables.put("category", sop.getFileCategory());
            variables.put("approvedBy", approver.getName());
            variables.put("approvedAt", LocalDateTime.now()); // Use current time
            variables.put("comments", comments != null ? comments : "No comments provided");
            variables.put("uploadedBy", sop.getUploadedBy());

            emailService.sendHtmlEmail(
                    adminEmail, // Send to admin instead of uploader
                    "SOP Approved - " + sop.getFileName(),
                    "sop-approved",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send approval notification email for SOP: {}", sop.getId(), e);
        }
    }

    private void sendRejectionNotification(SopEntry sop, Approver approver, String comments) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("sopTitle", sop.getFileName());
            variables.put("brand", sop.getBrand());
            variables.put("category", sop.getFileCategory());
            variables.put("rejectedBy", approver.getName());
            variables.put("rejectedAt", LocalDateTime.now()); // Use current time
            variables.put("rejectionComments", comments);
            variables.put("uploadedBy", sop.getUploadedBy());

            emailService.sendHtmlEmail(
                    adminEmail, // Send to admin instead of uploader
                    "SOP Rejected - " + sop.getFileName(),
                    "sop-rejected",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send rejection notification email for SOP: {}", sop.getId(), e);
        }
    }

    private void sendAutoApprovalNotification(SopEntry sop) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("sopTitle", sop.getFileName());
            variables.put("brand", sop.getBrand());
            variables.put("category", sop.getFileCategory());
            variables.put("pendingAt", sop.getCreatedAt()); // Use created time as pending time
            variables.put("autoApprovedAt", LocalDateTime.now()); // Use current time
            variables.put("uploadedBy", sop.getUploadedBy());

            emailService.sendHtmlEmail(
                    adminEmail, // Send to admin instead of uploader
                    "SOP Auto-Approved - " + sop.getFileName(),
                    "sop-auto-approved",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send auto-approval notification email for SOP: {}", sop.getId(), e);
        }
    }
}
