package com.kwgroup.sopdocument.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_history", indexes = {
        @Index(name = "idx_sop_id", columnList = "sopId"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_action_type", columnList = "actionType"),
        @Index(name = "idx_pending_operation_id", columnList = "pendingOperationId")
})
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ActionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActionType actionType;

    private String sopId; // Nullable - deleted SOPs won't have this

    /**
     * Link to the pending operation that triggered this action.
     * Allows tracing which approval/rejection created this history entry.
     */
    private String pendingOperationId;

    private String sopFileName;
    private String sopBrand;
    private String sopCategory;

    private String actorName; // Who performed the action

    @Lob
    @Column(columnDefinition = "TEXT")
    private String comments; // Rejection reason, update notes, etc.

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    public void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
