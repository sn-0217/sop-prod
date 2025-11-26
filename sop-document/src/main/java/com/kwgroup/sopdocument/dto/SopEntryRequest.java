package com.kwgroup.sopdocument.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
}
