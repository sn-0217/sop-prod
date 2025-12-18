package com.kwgroup.sopdocument.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.kwgroup.sopdocument.model.ApprovalStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SopEntryResponse {
    private String id;
    private String fileName;
    private String filePath;
    private Long fileSize;

    private String fileCategory;

    private String brand;

    private String uploadedBy;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modifiedAt;

    private String version;

    // Approval workflow fields
    private ApprovalStatus status;
    private String assignedApproverId;
}
