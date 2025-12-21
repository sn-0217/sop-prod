package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.dto.SopEntryUpdateRequest;
import com.kwgroup.sopdocument.model.PendingOperation;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for handling approval workflows for UPDATE and DELETE operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SopApprovalWorkflowService {

    private final SopEntryRepository sopEntryRepository;
    private final PendingOperationService pendingOperationService;
    private final ApproverService approverService;

    /**
     * Update SOP with approval workflow - creates a pending operation
     */
    @Transactional
    public PendingOperation updateWithApproval(String id, SopEntryUpdateRequest sopEntryUpdateRequest,
            String requestedBy, String comments, String assignedApproverId) {
        SopEntry existing = sopEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOP entry not found with id: " + id));

        Map<String, Map<String, Object>> changes = new HashMap<>();

        if (sopEntryUpdateRequest.getFileCategory() != null && !sopEntryUpdateRequest.getFileCategory().isBlank()) {
            Map<String, Object> change = new HashMap<>();
            change.put("old", existing.getFileCategory());
            change.put("new", sopEntryUpdateRequest.getFileCategory());
            changes.put("fileCategory", change);
        }

        if (sopEntryUpdateRequest.getBrand() != null && !sopEntryUpdateRequest.getBrand().isBlank()) {
            Map<String, Object> change = new HashMap<>();
            change.put("old", existing.getBrand());
            change.put("new", sopEntryUpdateRequest.getBrand());
            changes.put("brand", change);
        }

        if (sopEntryUpdateRequest.getUploadedBy() != null && !sopEntryUpdateRequest.getUploadedBy().isBlank()) {
            Map<String, Object> change = new HashMap<>();
            change.put("old", existing.getUploadedBy());
            change.put("new", sopEntryUpdateRequest.getUploadedBy());
            changes.put("uploadedBy", change);
        }

        // Handle version update based on versionUpdateType
        String versionUpdateType = sopEntryUpdateRequest.getVersionUpdateType();
        if (versionUpdateType != null && !versionUpdateType.isBlank()) {
            String currentVersion = existing.getVersion();
            String newVersion = getNextVersion(currentVersion, versionUpdateType);
            Map<String, Object> change = new HashMap<>();
            change.put("old", currentVersion);
            change.put("new", newVersion);
            changes.put("version", change);
            log.info("Version update: {} -> {} ({})", currentVersion, newVersion, versionUpdateType);
        }

        if (changes.isEmpty()) {
            throw new IllegalArgumentException("No changes detected");
        }

        // Auto-assign approver if not explicitly specified
        String effectiveApproverId = assignedApproverId;
        if (effectiveApproverId == null || effectiveApproverId.isBlank()) {
            effectiveApproverId = approverService.getNextAvailableApprover()
                    .map(approver -> approver.getId())
                    .orElse(null);
            log.info("Auto-assigned approver ID for update: {}", effectiveApproverId);
        }

        log.info("Creating pending update operation for SOP: {} with approver: {}", id, effectiveApproverId);
        return pendingOperationService.createUpdateOperation(id, changes, requestedBy, effectiveApproverId, comments);
    }

    /**
     * Get next version number by incrementing current version.
     * Examples:
     * - "v1" -> "v1.1" (default minor)
     * - "v1.0" + MINOR -> "v1.1"
     * - "v1.0" + MAJOR -> "v2.0"
     * - "v1.5" + MAJOR -> "v2.0"
     */
    private static String getNextVersion(String currentVersion, String updateType) {
        if (currentVersion == null || currentVersion.isEmpty()) {
            return "v1.0";
        }

        // Default to MINOR if not specified
        boolean isMajor = "MAJOR".equalsIgnoreCase(updateType);

        try {
            String cleanVersion = currentVersion.toLowerCase().replace("v", "");
            int major = 1;
            int minor = 0;

            if (cleanVersion.contains(".")) {
                String[] parts = cleanVersion.split("\\.");
                major = Integer.parseInt(parts[0]);
                minor = Integer.parseInt(parts[1]);
            } else {
                // Handle legacy "v1", "v2" etc.
                major = Integer.parseInt(cleanVersion);
                minor = 0;
            }

            if (isMajor) {
                major++;
                minor = 0;
            } else {
                if (minor == 9) {
                    major++;
                    minor = 0;
                } else {
                    minor++;
                }
            }

            return "v" + major + "." + minor;
        } catch (Exception e) {
            return "v1.0";
        }
    }

    /**
     * Delete SOP with approval workflow - creates a pending operation
     */
    @Transactional
    public PendingOperation deleteWithApproval(String id, String requestedBy, String comments,
            String assignedApproverId) {
        sopEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOP entry not found with id: " + id));

        // Auto-assign approver if not explicitly specified
        String effectiveApproverId = assignedApproverId;
        if (effectiveApproverId == null || effectiveApproverId.isBlank()) {
            effectiveApproverId = approverService.getNextAvailableApprover()
                    .map(approver -> approver.getId())
                    .orElse(null);
            log.info("Auto-assigned approver ID for delete: {}", effectiveApproverId);
        }

        log.info("Creating pending delete operation for SOP: {} with approver: {}", id, effectiveApproverId);
        return pendingOperationService.createDeleteOperation(id, requestedBy, effectiveApproverId, comments);
    }
}
