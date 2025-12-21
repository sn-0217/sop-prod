package com.kwgroup.sopdocument.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kwgroup.sopdocument.model.PendingOperation;
import com.kwgroup.sopdocument.model.PendingOperationType;
import com.kwgroup.sopdocument.service.ApprovalService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final ObjectMapper objectMapper;

    /**
     * Get all pending operations awaiting approval.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<PendingOperation>> getPendingOperations() {
        List<PendingOperation> pending = approvalService.getPendingOperations();
        return ResponseEntity.ok(pending);
    }

    /**
     * Get a specific pending operation.
     */
    @GetMapping("/{operationId}")
    public ResponseEntity<PendingOperation> getPendingOperation(@PathVariable String operationId) {
        PendingOperation operation = approvalService.getPendingOperation(operationId);
        return ResponseEntity.ok(operation);
    }

    /**
     * View PDF file for a pending operation inline (for preview).
     * Works for UPLOAD operations (serves the pending file) and UPDATE/DELETE
     * (serves the existing SOP file).
     */
    @GetMapping(value = { "/{operationId}/view", "/{operationId}/view/{filename}" })
    public ResponseEntity<Object> viewPendingOperationFile(@PathVariable String operationId) {
        try {
            PendingOperation operation = approvalService.getPendingOperation(operationId);
            if (operation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pending operation not found");
            }

            JsonNode proposedData = objectMapper.readTree(operation.getProposedData());
            String filePath = null;
            String fileName = null;

            if (operation.getOperationType() == PendingOperationType.UPLOAD) {
                // For uploads, the file path is directly in proposedData
                filePath = proposedData.has("filePath") ? proposedData.get("filePath").asText() : null;
                fileName = proposedData.has("fileName") ? proposedData.get("fileName").asText() : null;
            } else if (operation.getOperationType() == PendingOperationType.DELETE) {
                // For deletes, get from snapshot
                JsonNode snapshot = proposedData.get("snapshot");
                if (snapshot != null) {
                    filePath = snapshot.has("filePath") ? snapshot.get("filePath").asText() : null;
                    fileName = snapshot.has("fileName") ? snapshot.get("fileName").asText() : null;
                }
            }

            if (filePath == null || filePath.isBlank()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No file path found in pending operation");
            }

            return servePdfResource(filePath, fileName);

        } catch (Exception e) {
            log.error("Error viewing pending operation file: {}", operationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error viewing file: " + e.getMessage());
        }
    }

    private ResponseEntity<Object> servePdfResource(String filePath, String suggestedFileName) {
        try {
            Path path = Paths.get(filePath).normalize();
            Path absolutePath = path.toAbsolutePath();

            if (!Files.exists(path)) {
                log.warn("File does not exist: {}", absolutePath);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found at path: " + absolutePath);
            }
            if (!Files.isReadable(path) || Files.isDirectory(path)) {
                log.warn("File is not readable or is directory: {}", absolutePath);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File is not readable or is directory");
            }

            Resource resource = new FileSystemResource(path.toFile());
            long contentLength = Files.size(path);

            // Build filename for header
            if (suggestedFileName == null || suggestedFileName.isBlank()) {
                suggestedFileName = path.getFileName().toString();
            } else {
                // Append extension from actual file
                String ext = getExtension(path.getFileName().toString());
                suggestedFileName = suggestedFileName.replaceAll("\\s+", " ");
                if (!suggestedFileName.toLowerCase().endsWith(ext.toLowerCase())) {
                    suggestedFileName = suggestedFileName + ext;
                }
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + suggestedFileName + "\"");
            headers.setContentLength(contentLength);

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error while serving file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error serving file: " + e.getMessage());
        }
    }

    private static String getExtension(String filename) {
        if (filename == null)
            return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot) : "";
    }

    /**
     * Approve a pending operation.
     */
    @PostMapping("/{operationId}/approve")
    public ResponseEntity<Void> approveOperation(
            @PathVariable String operationId,
            @RequestBody ApprovalRequest request) {

        approvalService.approveOperation(
                operationId,
                request.getUsername(),
                request.getPassword(),
                request.getComments());

        return ResponseEntity.ok().build();
    }

    /**
     * Reject a pending operation.
     */
    @PostMapping("/{operationId}/reject")
    public ResponseEntity<Void> rejectOperation(
            @PathVariable String operationId,
            @RequestBody ApprovalRequest request) {

        approvalService.rejectOperation(
                operationId,
                request.getUsername(),
                request.getPassword(),
                request.getComments());

        return ResponseEntity.ok().build();
    }

    @Data
    public static class ApprovalRequest {
        private String username;
        private String password;
        private String comments;
    }
}
