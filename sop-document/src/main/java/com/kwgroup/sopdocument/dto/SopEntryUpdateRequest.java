package com.kwgroup.sopdocument.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SopEntryUpdateRequest {

    private String fileCategory;

    @Pattern(regexp = "chicos|knitwell|talbots", flags = Pattern.Flag.CASE_INSENSITIVE, message = "Brand must be chicos, knitwell, or talbots")
    private String brand;

    private String uploadedBy;

    private org.springframework.web.multipart.MultipartFile file;

    private String versionUpdateType; // "MAJOR" or "MINOR"
}
