package com.kwgroup.sopdocument.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity to track all pending operations requiring approval.
 * Supports UPLOAD, UPDATE, and DELETE operations.
 */
@Entity
@Table(name = "pending_operations", indexes = {
        @Index(name = "idx_pending_status", columnList = "status"),
        @Index(name = "idx_pending_sop_id", columnList = "sopId"),
        @Index(name = "idx_pending_type", columnList = "operationType"),
        @Index(name = "idx_pending_requested_at", columnList = "requestedAt")
})
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PendingOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Type of operation: UPLOAD, UPDATE, DELETE
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PendingOperationType operationType;

    /**
     * Reference to existing SOP document.
     * NULL for UPLOAD operations (no document exists yet).
     * NOT NULL for UPDATE and DELETE operations.
     */
    private String sopId;

    /**
     * Current status of the operation: PENDING, APPROVED, REJECTED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PendingOperationStatus status = PendingOperationStatus.PENDING;

    /**
     * Approver assigned to review this operation
     */
    private String assignedApproverId;

    /**
     * JSON data containing the proposed changes/data for this operation.
     * 
     * For UPLOAD: Contains all document metadata and temp file path
     * {
     * "fileName": "safety_manual",
     * "fileCategory": "Safety",
     * "brand": "Knitwell",
     * "tempFilePath": "/temp/uploads/abc123.pdf",
     * "uploadedBy": "john.doe"
     * }
     * 
     * For UPDATE: Contains old and new values
     * {
     * "changes": {
     * "fileCategory": {"old": "Quality", "new": "Production"},
     * "brand": {"old": "Knitwell", "new": "Knitwell Plus"},
     * "version": {"old": "v1.0", "new": "v2.0"}
     * }
     * }
     * 
     * For DELETE: Contains snapshot of document being deleted
     * {
     * "snapshot": {
     * "fileName": "safety_procedures",
     * "fileCategory": "Safety",
     * "brand": "Knitwell",
     * "version": "v3.0",
     * "filePath": "/data/sops/knitwell/safety_procedures.pdf"
     * }
     * }
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String proposedData;

    /**
     * Username of the person who requested this operation
     */
    @Column(nullable = false, length = 100)
    private String requestedBy;

    /**
     * When the operation was requested
     */
    @Column(nullable = false)
    private LocalDateTime requestedAt;

    /**
     * When the operation was reviewed (approved/rejected)
     */
    private LocalDateTime reviewedAt;

    /**
     * Username of the approver who reviewed this
     */
    @Column(length = 100)
    private String reviewedBy;

    /**
     * Comments from approver (approval notes or rejection reason)
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String comments;

    @PrePersist
    public void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = PendingOperationStatus.PENDING;
        }
    }

    @PreUpdate
    public void onUpdate() {
        // If status changed from PENDING to APPROVED/REJECTED, set reviewedAt
        if (this.status != PendingOperationStatus.PENDING && this.reviewedAt == null) {
            this.reviewedAt = LocalDateTime.now();
        }
    }
}
