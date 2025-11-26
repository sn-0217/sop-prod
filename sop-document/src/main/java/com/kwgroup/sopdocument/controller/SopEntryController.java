package com.kwgroup.sopdocument.controller;

import com.kwgroup.sopdocument.dto.SopEntryRequest;
import com.kwgroup.sopdocument.dto.SopEntryResponse;
import com.kwgroup.sopdocument.service.SopEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sops")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SopEntryController {

    private final SopEntryService sopEntryService;

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
    public ResponseEntity<SopEntryResponse> uploadNewSop(
            @Valid @ModelAttribute SopEntryRequest req) {
        // manual validation for MultipartFile
        MultipartFile file = req.getFile();
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is missing or empty");
        }

        // delegate to service which expects (SopEntryRequest, MultipartFile)
        SopEntryResponse saved = sopEntryService.save(req, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SopEntryResponse> updateSop(
            @PathVariable String id,
            @Valid @ModelAttribute com.kwgroup.sopdocument.dto.SopEntryUpdateRequest req) {
        SopEntryResponse updated = sopEntryService.update(id, req);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSop(@PathVariable String id) {
        sopEntryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
