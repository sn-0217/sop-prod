package com.kwgroup.sopdocument.model;

public enum ActionType {
    // === LEGACY ACTION TYPES (Keep for backward compatibility) ===
    UPLOADED,
    APPROVED,
    REJECTED,
    UPDATED,
    DELETED,
    AUTO_APPROVED,

    // === NEW OPERATION REQUEST TYPES ===
    /**
     * User requested a new document upload
     */
    UPLOAD_REQUESTED,

    /**
     * User requested an update to existing document
     */
    UPDATE_REQUESTED,

    /**
     * User requested deletion of existing document
     */
    DELETE_REQUESTED,

    // === NEW OPERATION APPROVAL TYPES ===
    /**
     * Upload operation was approved
     */
    UPLOAD_APPROVED,

    /**
     * Update operation was approved
     */
    UPDATE_APPROVED,

    /**
     * Delete operation was approved
     */
    DELETE_APPROVED,

    // === NEW OPERATION REJECTION TYPES ===
    /**
     * Upload operation was rejected
     */
    UPLOAD_REJECTED,

    /**
     * Update operation was rejected
     */
    UPDATE_REJECTED,

    /**
     * Delete operation was rejected
     */
    DELETE_REJECTED,

    // === AUTO-APPROVAL TYPES ===
    /**
     * Upload was auto-approved after timeout
     */
    UPLOAD_AUTO_APPROVED,

    /**
     * Update was auto-approved after timeout
     */
    UPDATE_AUTO_APPROVED,

    /**
     * Delete was auto-approved after timeout
     */
    DELETE_AUTO_APPROVED
}
