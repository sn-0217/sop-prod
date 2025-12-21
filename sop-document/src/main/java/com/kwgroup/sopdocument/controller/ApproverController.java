package com.kwgroup.sopdocument.controller;

import com.kwgroup.sopdocument.model.Approver;
import com.kwgroup.sopdocument.service.ApproverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approvers")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ApproverController {

    private final ApproverService approverService;

    /**
     * Get all active approvers.
     * Used by the frontend to populate approver selection dropdowns.
     */
    @GetMapping
    public ResponseEntity<List<Approver>> getAllActiveApprovers() {
        List<Approver> approvers = approverService.getAllActiveApprovers();
        log.debug("Returning {} active approvers", approvers.size());
        return ResponseEntity.ok(approvers);
    }
}
