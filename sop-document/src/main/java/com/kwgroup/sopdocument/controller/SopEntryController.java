package com.kwgroup.sopdocument.controller;

import com.kwgroup.sopdocument.dto.SopEntryRequest;
import com.kwgroup.sopdocument.service.SopEntryService;
import com.kwgroup.sopdocument.service.SopApprovalWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/sops")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SopEntryController {

    private final SopEntryService sopEntryService;
    private final SopApprovalWorkflowService approvalWorkflowService;

    /**
     * Accepts multipart/form-data with:
     * - file (file input)
     * - fileCategory (text)
     * - brand (text)
     * - uploadedBy (text)
     *
     * Example curl:
     * curl -X POST http://localhost:8080/api/sops/upload \
     * -F "file=@/path/to/testing_app_now.pdf" \
     * -F "fileCategory=github" \
     * -F "brand=knitwell" \
     * -F "uploadedBy=alice"
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> uploadNewSop(
            @Valid @ModelAttribute SopEntryRequest req) {
        // manual validation for MultipartFile
        MultipartFile file = req.getFile();
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is missing or empty");
        }

        // delegate to service which creates a pending operation
        var pendingOperation = sopEntryService.saveWithApproval(req, file);

        // Return success message with operation ID
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Upload submitted for approval",
                "operationId", pendingOperation.getId(),
                "status", "PENDING_APPROVAL"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateSop(
            @PathVariable String id,
            @Valid @ModelAttribute com.kwgroup.sopdocument.dto.SopEntryUpdateRequest req,
            @RequestParam(required = false, defaultValue = "system") String requestedBy,
            @RequestParam(required = false, defaultValue = "") String comments,
            @RequestParam(required = false) String assignedApproverId) {
        var pendingOperation = approvalWorkflowService.updateWithApproval(id, req, requestedBy, comments,
                assignedApproverId);
        return ResponseEntity.ok(Map.of(
                "message", "Update submitted for approval",
                "operationId", pendingOperation.getId(),
                "status", "PENDING_APPROVAL"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSop(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "system") String requestedBy,
            @RequestParam(required = false, defaultValue = "") String comments,
            @RequestParam(required = false) String assignedApproverId) {
        var pendingOperation = approvalWorkflowService.deleteWithApproval(id, requestedBy, comments,
                assignedApproverId);
        return ResponseEntity.ok(Map.of(
                "message", "Delete submitted for approval",
                "operationId", pendingOperation.getId(),
                "status", "PENDING_APPROVAL"));
    }
}
