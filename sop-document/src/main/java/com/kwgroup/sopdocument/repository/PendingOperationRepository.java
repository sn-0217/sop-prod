package com.kwgroup.sopdocument.repository;

import com.kwgroup.sopdocument.model.PendingOperation;
import com.kwgroup.sopdocument.model.PendingOperationStatus;
import com.kwgroup.sopdocument.model.PendingOperationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PendingOperationRepository extends JpaRepository<PendingOperation, String> {

    /**
     * Find all pending operations with given status
     */
    List<PendingOperation> findByStatus(PendingOperationStatus status);

    /**
     * Find all pending operations for a specific SOP document
     */
    List<PendingOperation> findBySopId(String sopId);

    /**
     * Find all pending operations of a specific type
     */
    List<PendingOperation> findByOperationType(PendingOperationType operationType);

    /**
     * Find all pending operations assigned to a specific approver
     */
    List<PendingOperation> findByAssignedApproverId(String approverId);

    /**
     * Find all pending operations by status and approver
     */
    List<PendingOperation> findByStatusAndAssignedApproverId(
            PendingOperationStatus status,
            String approverId);

    /**
     * Find all pending operations requested before a certain date (for
     * auto-approval)
     */
    List<PendingOperation> findByStatusAndRequestedAtBefore(
            PendingOperationStatus status,
            LocalDateTime dateTime);

    /**
     * Find all pending operations for a SOP with given status
     */
    List<PendingOperation> findBySopIdAndStatus(String sopId, PendingOperationStatus status);
}
