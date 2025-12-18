package com.kwgroup.sopdocument.dto;

import com.kwgroup.sopdocument.model.Approver;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproverResponse {
    private String id;
    private String username;
    private String name;
    private String email;

    public static ApproverResponse from(Approver approver) {
        return ApproverResponse.builder()
                .id(approver.getId())
                .username(approver.getUsername())
                .name(approver.getName())
                .email(approver.getEmail())
                .build();
    }
}
