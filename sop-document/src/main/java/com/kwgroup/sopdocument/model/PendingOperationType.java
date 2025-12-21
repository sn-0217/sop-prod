package com.kwgroup.sopdocument.model;

/**
 * Types of operations that can be pending approval.
 */
public enum PendingOperationType {
    /**
     * New document upload - creates a new SOP entry
     */
    UPLOAD,
    
    /**
     * Update to existing document metadata/content
     */
    UPDATE,
    
    /**
     * Deletion of existing document
     */
    DELETE
}
