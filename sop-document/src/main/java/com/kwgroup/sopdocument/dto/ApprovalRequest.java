package com.kwgroup.sopdocument.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApprovalRequest {

    @NotBlank(message = "Approver username is required")
    private String approverUsername;

    @NotBlank(message = "Approver password is required")
    private String approverPassword;

    private String comments; // optional for approval, mandatory for rejection
}
