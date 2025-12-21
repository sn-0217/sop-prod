package com.kwgroup.sopdocument.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sop_documents")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SopEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String fileName;
    private String filePath;
    private long fileSize;

    private String fileCategory;
    private String brand;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String pdfContent;

    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private String version; // e.g., "v1", "v2", "v3"

    /**
     * Soft delete flag. When true, document is active.
     * When false, document has been deleted but kept for audit trail.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.modifiedAt = LocalDateTime.now();
    }
}
