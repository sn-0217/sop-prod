package com.kwgroup.sopdocument.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SopEntryRequest {

    private MultipartFile file;
    @NotBlank(message = "File category cannot be empty")
    private String fileCategory;

    @NotBlank(message = "Brand cannot be empty")
    @Pattern(regexp = "chicos|knitwell|talbots", flags = Pattern.Flag.CASE_INSENSITIVE, message = "Brand must be chicos, knitwell, or talbots")
    private String brand;

    @NotBlank(message = "UploadedBy cannot be empty")
    private String uploadedBy;

    // Approval workflow - optional approver assignment
    private String assignedApproverId;

    // Version - optional, defaults to v1.0 if not provided
    @Pattern(regexp = "^v\\d+\\.\\d+$", message = "Version must be in format v1.0, v2.0, etc.")
    private String version;

    // Comments - required for explaining the reason for upload
    @NotBlank(message = "Comments cannot be empty")
    private String comments;
}
