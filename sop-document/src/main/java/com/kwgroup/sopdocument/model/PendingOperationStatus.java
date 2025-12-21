package com.kwgroup.sopdocument.model;

/**
 * Status of a pending operation.
 */
public enum PendingOperationStatus {
    /**
     * Operation is awaiting approval
     */
    PENDING,

    /**
     * Operation has been approved by an approver
     */
    APPROVED,

    /**
     * Operation has been rejected by an approver
     */
    REJECTED
}
