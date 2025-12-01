package com.kwgroup.sopdocument.controller;

import com.kwgroup.sopdocument.dto.SopEntryResponse;
import com.kwgroup.sopdocument.mapper.SopMapper;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import com.kwgroup.sopdocument.service.PdfSearchService;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sops")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SopEntryQueryController {

    private final SopEntryRepository sopEntryRepository;
    private final SopMapper sopMapper;
    private final PdfSearchService pdfSearchService;

    /**
     * Return all SOP entries as JSON.
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<SopEntryResponse>> listAll() {
        List<SopEntryResponse> all = sopEntryRepository.findAll().stream()
                .map(sopMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(all);
    }

    /**
     * Return single SOP entry metadata by id.
     */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SopEntryResponse> getById(@PathVariable String id) {
        return sopEntryRepository.findById(id)
                .map(entry -> ResponseEntity.ok(sopMapper.toDto(entry)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Download the PDF (force download).
     */
    @GetMapping(value = { "/download/{id}", "/download/{id}/{filename}" })
    public ResponseEntity<Object> downloadPdf(@PathVariable String id) {
        return sopEntryRepository.findById(id)
                .<ResponseEntity<Object>>map(entry -> servePdfResource(entry, true))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("SOP Entry not found"));
    }

    /**
     * Serve the PDF inline so browser can view it (not force download).
     * Example: GET /api/sops/view/{id}
     * Example: GET /api/sops/view/{id}/some-file-name.pdf (better for browser
     * title)
     */
    @GetMapping(value = { "/view/{id}", "/view/{id}/{filename}" })
    public ResponseEntity<Object> viewPdfInline(@PathVariable String id) {
        return sopEntryRepository.findById(id)
                .<ResponseEntity<Object>>map(entry -> servePdfResource(entry, false))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("SOP Entry not found"));
    }

    /**
     * Search SOPs by PDF content.
     * Example: GET /api/sops/search?q=safety&brand=knitwell&category=production
     */
    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<SopEntryResponse>> searchByContent(
            @RequestParam(name = "q", required = true) String query,
            @RequestParam(name = "brand", required = false) String brand,
            @RequestParam(name = "category", required = false) String category) {

        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        List<SopEntryResponse> results;

        if (brand != null && !brand.isBlank()) {
            results = pdfSearchService.searchByContentAndBrand(query, brand);
        } else if (category != null && !category.isBlank()) {
            results = pdfSearchService.searchByContentAndCategory(query, category);
        } else {
            results = pdfSearchService.searchByContent(query);
        }

        return ResponseEntity.ok(results);
    }

    /* ---------- helpers ---------- */

    private ResponseEntity<Object> servePdfResource(SopEntry entry, boolean attachment) {
        String filePath = entry.getFilePath();
        if (filePath == null || filePath.isBlank()) {
            log.warn("Entry {} has empty filePath", entry.getId());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Entry has empty filePath");
        }

        try {
            // Safety: resolve & normalize
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

            // content length
            long contentLength = Files.size(path);

            // build headers to show inline
            String suggestedFileName = entry.getFileName();
            // If DB fileName is "testing app now", and disk has underscore name, create
            // safe filename for header:
            if (suggestedFileName == null || suggestedFileName.isBlank()) {
                suggestedFileName = path.getFileName().toString();
            } else {
                // append extension from actual file
                String ext = getExtension(path.getFileName().toString());
                suggestedFileName = suggestedFileName.replaceAll("\\s+", " ");
                if (!suggestedFileName.toLowerCase().endsWith(ext.toLowerCase())) {
                    suggestedFileName = suggestedFileName + ext;
                }
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);

            String disposition = attachment ? "attachment" : "inline";
            headers.set(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + suggestedFileName + "\"");
            headers.setContentLength(contentLength);

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error while serving file for entry {}: {}", entry.getId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error serving file: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error while serving file for entry {}: {}", entry.getId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error: " + e.getMessage());
        }
    }

    private static String getExtension(String filename) {
        if (filename == null)
            return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot) : "";
    }
}
