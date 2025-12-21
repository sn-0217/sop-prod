package com.kwgroup.sopdocument.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kwgroup.sopdocument.model.*;
import com.kwgroup.sopdocument.repository.PendingOperationRepository;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PendingOperationService {

    private final PendingOperationRepository pendingOperationRepository;
    private final SopEntryRepository sopEntryRepository;
    private final ActionHistoryService actionHistoryService;
    private final EmailService emailService;
    private final ApproverService approverService;
    private final ObjectMapper objectMapper;
    private final PdfContentIndexService pdfContentIndexService;

    /**
     * Get all pending operations
     */
    public List<PendingOperation> getAllPendingOperations() {
        return pendingOperationRepository.findByStatus(PendingOperationStatus.PENDING);
    }

    /**
     * Get pending operations for a specific approver
     */
    public List<PendingOperation> getPendingOperationsForApprover(String approverId) {
        return pendingOperationRepository.findByStatusAndAssignedApproverId(
                PendingOperationStatus.PENDING,
                approverId);
    }

    /**
     * Get pending operations for a specific SOP
     */
    public List<PendingOperation> getPendingOperationsForSop(String sopId) {
        return pendingOperationRepository.findBySopIdAndStatus(
                sopId,
                PendingOperationStatus.PENDING);
    }

    /**
     * Approve a pending operation
     */
    @Transactional
    public void approveOperation(String operationId, String approverUsername, String comments) {
        PendingOperation operation = pendingOperationRepository.findById(operationId)
                .orElseThrow(() -> new IllegalArgumentException("Operation not found: " + operationId));

        if (operation.getStatus() != PendingOperationStatus.PENDING) {
            throw new IllegalStateException("Operation is not pending: " + operation.getStatus());
        }

        // Update operation status
        operation.setStatus(PendingOperationStatus.APPROVED);
        operation.setReviewedBy(approverUsername);
        operation.setReviewedAt(LocalDateTime.now());
        operation.setComments(comments);
        pendingOperationRepository.save(operation);

        // Execute the operation based on type
        executeApprovedOperation(operation);

        // Log action history with SOP details from proposed data
        ActionType actionType = getActionTypeForApproval(operation.getOperationType());
        String[] sopDetails = extractSopDetails(operation);
        actionHistoryService.logActionWithOperation(
                actionType,
                operation.getSopId(),
                operation.getId(),
                sopDetails[0], // fileName
                sopDetails[1], // brand
                sopDetails[2], // category
                approverUsername,
                comments);

        // Cleanup: Delete the pending operation after successful approval
        pendingOperationRepository.delete(operation);

        log.info("Operation {} approved by {} and cleaned up", operationId, approverUsername);
    }

    /**
     * Reject a pending operation
     */
    @Transactional
    public void rejectOperation(String operationId, String approverUsername, String comments) {
        if (comments == null || comments.isBlank()) {
            throw new IllegalArgumentException("Comments are required for rejection");
        }

        PendingOperation operation = pendingOperationRepository.findById(operationId)
                .orElseThrow(() -> new IllegalArgumentException("Operation not found: " + operationId));

        if (operation.getStatus() != PendingOperationStatus.PENDING) {
            throw new IllegalStateException("Operation is not pending: " + operation.getStatus());
        }

        // Update operation status
        operation.setStatus(PendingOperationStatus.REJECTED);
        operation.setReviewedBy(approverUsername);
        operation.setReviewedAt(LocalDateTime.now());
        operation.setComments(comments);
        pendingOperationRepository.save(operation);

        // Log action history with SOP details from proposed data
        ActionType actionType = getActionTypeForRejection(operation.getOperationType());
        String[] sopDetails = extractSopDetails(operation);
        actionHistoryService.logActionWithOperation(
                actionType,
                operation.getSopId(),
                operation.getId(),
                sopDetails[0], // fileName
                sopDetails[1], // brand
                sopDetails[2], // category
                approverUsername,
                comments);

        // Send rejection notification
        sendRejectionNotification(operation, approverUsername, comments);

        // Cleanup: Delete the pending operation after rejection
        pendingOperationRepository.delete(operation);

        log.info("Operation {} rejected by {} and cleaned up: {}", operationId, approverUsername, comments);
    }

    /**
     * Auto-approve a pending operation (called by scheduler)
     */
    @Transactional
    public void autoApproveOperation(PendingOperation operation) {
        if (operation.getStatus() != PendingOperationStatus.PENDING) {
            log.warn("Cannot auto-approve operation {} - status is {}",
                    operation.getId(), operation.getStatus());
            return;
        }

        // Update operation status
        operation.setStatus(PendingOperationStatus.APPROVED);
        operation.setReviewedBy("SYSTEM");
        operation.setReviewedAt(LocalDateTime.now());
        operation.setComments("Auto-approved after " + operation.getRequestedAt());
        pendingOperationRepository.save(operation);

        // Execute the operation
        executeApprovedOperation(operation);

        // Log action history with auto-approval type
        ActionType actionType = getActionTypeForAutoApproval(operation.getOperationType());
        String[] sopDetails = extractSopDetails(operation);
        actionHistoryService.logActionWithOperation(
                actionType,
                operation.getSopId(),
                operation.getId(),
                sopDetails[0], // fileName
                sopDetails[1], // brand
                sopDetails[2], // category
                "SYSTEM",
                "Auto-approved after 7 days");

        // Send auto-approval notification
        sendAutoApprovalNotification(operation);

        // Cleanup: Delete the pending operation after auto-approval
        pendingOperationRepository.delete(operation);

        log.info("Operation {} auto-approved and cleaned up", operation.getId());
    }

    /**
     * Execute the approved operation based on its type
     */
    private void executeApprovedOperation(PendingOperation operation) {
        try {
            switch (operation.getOperationType()) {
                case UPLOAD -> executeUploadOperation(operation);
                case UPDATE -> executeUpdateOperation(operation);
                case DELETE -> executeDeleteOperation(operation);
                default -> throw new IllegalStateException("Unknown operation type: " +
                        operation.getOperationType());
            }
        } catch (Exception e) {
            log.error("Failed to execute approved operation: {}", operation.getId(), e);
            throw new RuntimeException("Failed to execute operation", e);
        }
    }

    /**
     * Execute upload operation - create the SOP entry
     */
    private void executeUploadOperation(PendingOperation operation) {
        try {
            Map<String, Object> data = objectMapper.readValue(
                    operation.getProposedData(),
                    Map.class);

            // Create SOP entry from proposed data
            SopEntry sopEntry = new SopEntry();
            sopEntry.setFileName((String) data.get("fileName"));
            sopEntry.setFilePath((String) data.get("filePath"));
            sopEntry.setFileSize(((Number) data.get("fileSize")).longValue());
            sopEntry.setFileCategory((String) data.get("fileCategory"));
            sopEntry.setBrand((String) data.get("brand"));
            sopEntry.setUploadedBy((String) data.get("uploadedBy"));
            sopEntry.setVersion((String) data.getOrDefault("version", "v1.0"));
            sopEntry.setActive(true);
            sopEntry.setCreatedAt(LocalDateTime.now());
            sopEntry.setModifiedAt(LocalDateTime.now());

            SopEntry saved = sopEntryRepository.save(sopEntry);

            // Index PDF content for full-text search
            try {
                pdfContentIndexService.indexSopEntry(saved);
                log.info("Indexed PDF content for SOP: {}", saved.getId());
            } catch (Exception e) {
                log.warn("Failed to index PDF content for SOP: {} - {}", saved.getId(), e.getMessage());
                // Don't fail the operation if indexing fails
            }

            // Update operation with created SOP ID
            operation.setSopId(saved.getId());
            pendingOperationRepository.save(operation);

            log.info("Created SOP {} from approved upload operation", saved.getId());
        } catch (Exception e) {
            log.error("Failed to execute upload operation: {}", operation.getId(), e);
            throw new RuntimeException("Failed to create SOP from upload operation", e);
        }
    }

    /**
     * Execute update operation - apply changes to SOP entry
     */
    private void executeUpdateOperation(PendingOperation operation) {
        SopEntry sopEntry = sopEntryRepository.findById(operation.getSopId())
                .orElseThrow(() -> new IllegalArgumentException("SOP not found: " + operation.getSopId()));

        try {
            Map<String, Object> data = objectMapper.readValue(
                    operation.getProposedData(),
                    Map.class);

            Map<String, Map<String, Object>> changes = (Map<String, Map<String, Object>>) data.get("changes");

            // Apply each change
            for (Map.Entry<String, Map<String, Object>> change : changes.entrySet()) {
                String field = change.getKey();
                Object newValue = change.getValue().get("new");

                switch (field) {
                    case "fileCategory" -> sopEntry.setFileCategory((String) newValue);
                    case "brand" -> sopEntry.setBrand((String) newValue);
                    case "version" -> sopEntry.setVersion((String) newValue);
                    case "uploadedBy" -> sopEntry.setUploadedBy((String) newValue);
                }
            }

            sopEntry.setModifiedAt(LocalDateTime.now());
            sopEntryRepository.save(sopEntry);

            log.info("Updated SOP {} from approved update operation", sopEntry.getId());
        } catch (Exception e) {
            log.error("Failed to execute update operation: {}", operation.getId(), e);
            throw new RuntimeException("Failed to update SOP", e);
        }
    }

    /**
     * Execute delete operation - hard delete the SOP entry
     */
    private void executeDeleteOperation(PendingOperation operation) {
        SopEntry sopEntry = sopEntryRepository.findById(operation.getSopId())
                .orElseThrow(() -> new IllegalArgumentException("SOP not found: " + operation.getSopId()));

        // Hard delete - remove from database completely
        // Audit trail is preserved in ACTION_HISTORY table
        sopEntryRepository.delete(sopEntry);

        log.info("Hard-deleted SOP {} from approved delete operation", sopEntry.getId());
    }

    /**
     * Get action type for approval based on operation type
     */
    private ActionType getActionTypeForApproval(PendingOperationType operationType) {
        return switch (operationType) {
            case UPLOAD -> ActionType.UPLOAD_APPROVED;
            case UPDATE -> ActionType.UPDATE_APPROVED;
            case DELETE -> ActionType.DELETE_APPROVED;
        };
    }

    /**
     * Get action type for rejection based on operation type
     */
    private ActionType getActionTypeForRejection(PendingOperationType operationType) {
        return switch (operationType) {
            case UPLOAD -> ActionType.UPLOAD_REJECTED;
            case UPDATE -> ActionType.UPDATE_REJECTED;
            case DELETE -> ActionType.DELETE_REJECTED;
        };
    }

    /**
     * Get action type for auto-approval based on operation type
     */
    private ActionType getActionTypeForAutoApproval(PendingOperationType operationType) {
        return switch (operationType) {
            case UPLOAD -> ActionType.UPLOAD_AUTO_APPROVED;
            case UPDATE -> ActionType.UPDATE_AUTO_APPROVED;
            case DELETE -> ActionType.DELETE_AUTO_APPROVED;
        };
    }

    /**
     * Extract SOP details (fileName, brand, category) from operation's
     * proposedData.
     * Returns array: [fileName, brand, category]
     */
    private String[] extractSopDetails(PendingOperation operation) {
        String[] result = new String[3]; // [fileName, brand, category]

        try {
            Map<String, Object> data = objectMapper.readValue(operation.getProposedData(), Map.class);

            switch (operation.getOperationType()) {
                case UPLOAD -> {
                    result[0] = (String) data.get("fileName");
                    result[1] = (String) data.get("brand");
                    result[2] = (String) data.get("fileCategory");
                }
                case UPDATE -> {
                    // For updates, get info from the existing SOP
                    if (operation.getSopId() != null) {
                        sopEntryRepository.findById(operation.getSopId()).ifPresent(sop -> {
                            result[0] = sop.getFileName();
                            result[1] = sop.getBrand();
                            result[2] = sop.getFileCategory();
                        });
                    }
                }
                case DELETE -> {
                    Map<String, Object> snapshot = (Map<String, Object>) data.get("snapshot");
                    if (snapshot != null) {
                        result[0] = (String) snapshot.get("fileName");
                        result[1] = (String) snapshot.get("brand");
                        result[2] = (String) snapshot.get("fileCategory");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract SOP details from operation {}: {}", operation.getId(), e.getMessage());
        }

        return result;
    }

    /**
     * Send rejection notification email
     */
    private void sendRejectionNotification(PendingOperation operation, String reviewedBy, String comments) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("operationType", operation.getOperationType());
            variables.put("reviewedBy", reviewedBy);
            variables.put("comments", comments);
            variables.put("requestedBy", operation.getRequestedBy());

            // TODO: Get email from user/approver service
            String recipientEmail = "admin@example.com";

            emailService.sendHtmlEmail(
                    recipientEmail,
                    "Operation Rejected - " + operation.getOperationType(),
                    "sop-rejected",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send rejection notification for operation: {}", operation.getId(), e);
        }
    }

    /**
     * Send auto-approval notification email
     */
    private void sendAutoApprovalNotification(PendingOperation operation) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("operationType", operation.getOperationType());
            variables.put("requestedBy", operation.getRequestedBy());
            variables.put("requestedAt", operation.getRequestedAt());

            // TODO: Get email from user/approver service
            String recipientEmail = "admin@example.com";

            emailService.sendHtmlEmail(
                    recipientEmail,
                    "Operation Auto-Approved - " + operation.getOperationType(),
                    "sop-auto-approved",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send auto-approval notification for operation: {}", operation.getId(), e);
        }
    }

    /**
     * Create a pending upload operation
     * This is called when a user uploads a new SOP document
     */
    @Transactional
    public PendingOperation createUploadOperation(
            String fileName,
            String filePath,
            Long fileSize,
            String fileCategory,
            String brand,
            String uploadedBy,
            String version,
            String assignedApproverId,
            String comments) {

        try {
            // Create proposed data as JSON
            Map<String, Object> proposedData = new HashMap<>();
            proposedData.put("fileName", fileName);
            proposedData.put("filePath", filePath);
            proposedData.put("fileSize", fileSize);
            proposedData.put("fileCategory", fileCategory);
            proposedData.put("brand", brand);
            proposedData.put("uploadedBy", uploadedBy);
            proposedData.put("version", version != null ? version : "v1.0");

            String proposedDataJson = objectMapper.writeValueAsString(proposedData);

            // Create pending operation
            PendingOperation operation = PendingOperation.builder()
                    .operationType(PendingOperationType.UPLOAD)
                    .sopId(null) // Will be set when approved
                    .status(PendingOperationStatus.PENDING)
                    .assignedApproverId(assignedApproverId)
                    .proposedData(proposedDataJson)
                    .requestedBy(uploadedBy)
                    .requestedAt(LocalDateTime.now())
                    .comments(comments)
                    .build();

            PendingOperation saved = pendingOperationRepository.save(operation);

            // Log action history with SOP details
            actionHistoryService.logActionWithOperation(
                    ActionType.UPLOAD_REQUESTED,
                    null, // No SOP ID yet
                    saved.getId(),
                    fileName,
                    brand,
                    fileCategory,
                    uploadedBy,
                    comments != null && !comments.isBlank() ? comments : "Upload requested for: " + fileName);

            // Send approval request notification
            sendApprovalRequestNotification(saved);

            log.info("Created pending upload operation {} for file: {}", saved.getId(), fileName);
            return saved;

        } catch (Exception e) {
            log.error("Failed to create upload operation", e);
            throw new RuntimeException("Failed to create upload operation", e);
        }
    }

    /**
     * Send approval request notification email
     */
    private void sendApprovalRequestNotification(PendingOperation operation) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("operationType", operation.getOperationType());
            variables.put("requestedBy", operation.getRequestedBy());
            variables.put("requestedAt", operation.getRequestedAt());

            // TODO: Get email from approver service
            String recipientEmail = "admin@example.com";

            emailService.sendHtmlEmail(
                    recipientEmail,
                    "Approval Required - " + operation.getOperationType(),
                    "sop-approval-request",
                    variables);
        } catch (Exception e) {
            log.error("Failed to send approval request notification for operation: {}", operation.getId(), e);
        }
    }

    /**
     * Create a pending update operation
     */
    @Transactional
    public PendingOperation createUpdateOperation(
            String sopId,
            Map<String, Map<String, Object>> changes,
            String requestedBy,
            String assignedApproverId,
            String comments) {

        try {
            // Verify SOP exists
            SopEntry sopEntry = sopEntryRepository.findById(sopId)
                    .orElseThrow(() -> new IllegalArgumentException("SOP not found: " + sopId));

            // Create proposed data as JSON
            Map<String, Object> proposedData = new HashMap<>();
            proposedData.put("changes", changes);
            proposedData.put("sopId", sopId);

            String proposedDataJson = objectMapper.writeValueAsString(proposedData);

            // Create pending operation
            PendingOperation operation = PendingOperation.builder()
                    .operationType(PendingOperationType.UPDATE)
                    .sopId(sopId)
                    .status(PendingOperationStatus.PENDING)
                    .assignedApproverId(assignedApproverId)
                    .proposedData(proposedDataJson)
                    .requestedBy(requestedBy)
                    .requestedAt(LocalDateTime.now())
                    .comments(comments)
                    .build();

            PendingOperation saved = pendingOperationRepository.save(operation);

            // Log action history with full SOP details
            actionHistoryService.logActionWithOperation(
                    ActionType.UPDATE_REQUESTED,
                    sopId,
                    saved.getId(),
                    sopEntry.getFileName(),
                    sopEntry.getBrand(),
                    sopEntry.getFileCategory(),
                    requestedBy,
                    comments != null && !comments.isBlank() ? comments
                            : "Update requested for: " + sopEntry.getFileName());

            // Send approval request notification
            sendApprovalRequestNotification(saved);

            log.info("Created pending update operation {} for SOP: {}", saved.getId(), sopId);
            return saved;

        } catch (Exception e) {
            log.error("Failed to create update operation for SOP: {}", sopId, e);
            throw new RuntimeException("Failed to create update operation", e);
        }
    }

    /**
     * Create a pending delete operation
     */
    @Transactional
    public PendingOperation createDeleteOperation(
            String sopId,
            String requestedBy,
            String assignedApproverId,
            String comments) {

        try {
            // Verify SOP exists and get snapshot
            SopEntry sopEntry = sopEntryRepository.findById(sopId)
                    .orElseThrow(() -> new IllegalArgumentException("SOP not found: " + sopId));

            // Create snapshot of current state
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("id", sopEntry.getId());
            snapshot.put("fileName", sopEntry.getFileName());
            snapshot.put("filePath", sopEntry.getFilePath());
            snapshot.put("fileSize", sopEntry.getFileSize());
            snapshot.put("fileCategory", sopEntry.getFileCategory());
            snapshot.put("brand", sopEntry.getBrand());
            snapshot.put("uploadedBy", sopEntry.getUploadedBy());
            snapshot.put("version", sopEntry.getVersion());

            // Create proposed data as JSON
            Map<String, Object> proposedData = new HashMap<>();
            proposedData.put("snapshot", snapshot);
            proposedData.put("reason", comments != null && !comments.isBlank() ? comments : "Delete requested");

            String proposedDataJson = objectMapper.writeValueAsString(proposedData);

            // Create pending operation
            PendingOperation operation = PendingOperation.builder()
                    .operationType(PendingOperationType.DELETE)
                    .sopId(sopId)
                    .status(PendingOperationStatus.PENDING)
                    .assignedApproverId(assignedApproverId)
                    .proposedData(proposedDataJson)
                    .requestedBy(requestedBy)
                    .requestedAt(LocalDateTime.now())
                    .comments(comments)
                    .build();

            PendingOperation saved = pendingOperationRepository.save(operation);

            // Log action history with full SOP details
            actionHistoryService.logActionWithOperation(
                    ActionType.DELETE_REQUESTED,
                    sopId,
                    saved.getId(),
                    sopEntry.getFileName(),
                    sopEntry.getBrand(),
                    sopEntry.getFileCategory(),
                    requestedBy,
                    comments != null && !comments.isBlank() ? comments
                            : "Delete requested for: " + sopEntry.getFileName());

            // Send approval request notification
            sendApprovalRequestNotification(saved);

            log.info("Created pending delete operation {} for SOP: {}", saved.getId(), sopId);
            return saved;

        } catch (Exception e) {
            log.error("Failed to create delete operation for SOP: {}", sopId, e);
            throw new RuntimeException("Failed to create delete operation", e);
        }
    }
}
