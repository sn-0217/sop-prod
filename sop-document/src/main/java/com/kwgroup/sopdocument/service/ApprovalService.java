package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.*;
import com.kwgroup.sopdocument.repository.PendingOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

/**
 * Service to handle approval workflow using PendingOperation system.
 * This service authenticates approvers and delegates to
 * PendingOperationService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final PendingOperationRepository pendingOperationRepository;
    private final PendingOperationService pendingOperationService;
    private final ApproverService approverService;

    /**
     * Approve a pending operation after authenticating the approver.
     */
    @Transactional
    public void approveOperation(String operationId, String username, String password, String comments) {
        // Authenticate approver
        Approver approver = authenticateApprover(username, password);

        // Delegate to PendingOperationService
        pendingOperationService.approveOperation(operationId, approver.getName(), comments);

        log.info("Operation approved: {} by approver: {}", operationId, username);
    }

    /**
     * Reject a pending operation after authenticating the approver.
     * Comments are mandatory for rejection.
     */
    @Transactional
    public void rejectOperation(String operationId, String username, String password, String comments) {
        // Validate comments are provided
        if (comments == null || comments.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comments are required for rejection");
        }

        // Authenticate approver
        Approver approver = authenticateApprover(username, password);

        // Delegate to PendingOperationService
        pendingOperationService.rejectOperation(operationId, approver.getName(), comments);

        log.info("Operation rejected: {} by approver: {} with comments: {}", operationId, username, comments);
    }

    /**
     * Get all pending operations awaiting approval.
     */
    public List<PendingOperation> getPendingOperations() {
        return pendingOperationRepository.findByStatus(PendingOperationStatus.PENDING);
    }

    /**
     * Get pending operations for a specific approver.
     */
    public List<PendingOperation> getPendingOperationsForApprover(String approverId) {
        return pendingOperationRepository.findByStatusAndAssignedApproverId(
                PendingOperationStatus.PENDING,
                approverId);
    }

    /**
     * Get a specific pending operation by ID.
     */
    public PendingOperation getPendingOperation(String operationId) {
        return pendingOperationRepository.findById(operationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Pending operation not found: " + operationId));
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
}
