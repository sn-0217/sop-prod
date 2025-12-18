package com.kwgroup.sopdocument.controller;

import com.kwgroup.sopdocument.dto.ApprovalRequest;
import com.kwgroup.sopdocument.dto.ApproverResponse;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.service.ApprovalService;
import com.kwgroup.sopdocument.service.ApproverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final ApproverService approverService;

    /**
     * Get all active approvers for selection in upload form.
     */
    @GetMapping("/approvers")
    public ResponseEntity<List<ApproverResponse>> getApprovers() {
        log.info("Fetching all active approvers");
        List<ApproverResponse> approvers = approverService.getAllActiveApprovers()
                .stream()
                .map(ApproverResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(approvers);
    }

    /**
     * Get all SOPs pending approval.
     */
    @GetMapping("/sops/pending")
    public ResponseEntity<List<SopEntry>> getPendingSOPs() {
        log.info("Fetching all pending SOPs");
        List<SopEntry> pendingSOPs = approvalService.getPendingSOPs();
        return ResponseEntity.ok(pendingSOPs);
    }

    /**
     * Approve a SOP (requires approver authentication).
     */
    @PostMapping("/sops/{id}/approve")
    public ResponseEntity<String> approveSOP(
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {

        log.info("Approval request for SOP: {} by user: {}", id, request.getApproverUsername());

        try {
            approvalService.approveSOP(id, request.getApproverUsername(),
                    request.getApproverPassword(), request.getComments());
            return ResponseEntity.ok("SOP approved successfully");
        } catch (Exception e) {
            log.error("Error approving SOP: {}", id, e);
            throw e;
        }
    }

    /**
     * Reject a SOP (requires approver authentication and comments).
     */
    @PostMapping("/sops/{id}/reject")
    public ResponseEntity<String> rejectSOP(
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {

        log.info("Rejection request for SOP: {} by user: {}", id, request.getApproverUsername());

        try {
            approvalService.rejectSOP(id, request.getApproverUsername(),
                    request.getApproverPassword(), request.getComments());
            return ResponseEntity.ok("SOP rejected successfully");
        } catch (Exception e) {
            log.error("Error rejecting SOP: {}", id, e);
            throw e;
        }
    }
}
