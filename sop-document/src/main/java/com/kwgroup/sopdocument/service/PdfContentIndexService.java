package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Service for extracting text content from PDF files and indexing them.
 * Uses Spring Cache to avoid re-extracting content unnecessarily.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfContentIndexService {

    private final SopEntryRepository sopEntryRepository;

    /**
     * Extract text content from a PDF file using Apache PDFBox.
     * Results are cached to avoid re-extraction.
     *
     * @param filePath path to the PDF file
     * @return extracted text content, or empty string if extraction fails
     */
    @Cacheable(value = "pdfContent", key = "#filePath")
    public String extractPdfContent(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            log.warn("Empty file path provided for PDF extraction");
            return "";
        }

        Path path = Paths.get(filePath).normalize();

        if (!Files.exists(path)) {
            log.warn("PDF file does not exist: {}", path);
            return "";
        }

        try {
            File pdfFile = path.toFile();
            log.info("Extracting text from PDF: {}", path);

            try (PDDocument document = Loader.loadPDF(pdfFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);

                log.info("Successfully extracted {} characters from PDF: {}",
                        text != null ? text.length() : 0, path.getFileName());

                return text != null ? text.trim() : "";
            }
        } catch (IOException e) {
            log.error("Failed to extract text from PDF: {}", path, e);
            return "";
        } catch (Exception e) {
            log.error("Unexpected error while extracting PDF text: {}", path, e);
            return "";
        }
    }

    /**
     * Index (extract and store) PDF content for a single SOP entry.
     *
     * @param entry the SOP entry to index
     * @return true if indexing was successful, false otherwise
     */
    @Transactional
    public boolean indexSopEntry(SopEntry entry) {
        if (entry == null || entry.getFilePath() == null) {
            return false;
        }

        try {
            String content = extractPdfContent(entry.getFilePath());
            entry.setPdfContent(content);
            sopEntryRepository.save(entry);
            log.info("Indexed PDF content for SOP: {} ({} characters)",
                    entry.getFileName(), content.length());
            return true;
        } catch (Exception e) {
            log.error("Failed to index SOP entry: {}", entry.getId(), e);
            return false;
        }
    }

    /**
     * Index all existing SOP entries after application startup.
     * Runs asynchronously to avoid blocking application startup.
     * Triggered when the application is fully ready.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void indexAllExistingEntries() {
        log.info("Application ready. Starting background indexing of all PDF entries...");

        try {
            // Small delay to let application fully initialize
            Thread.sleep(5000);

            List<SopEntry> allEntries = sopEntryRepository.findAll();
            int total = allEntries.size();
            int indexed = 0;
            int skipped = 0;

            log.info("Found {} SOP entries to index", total);

            for (SopEntry entry : allEntries) {
                // Skip if already indexed
                if (entry.getPdfContent() != null && !entry.getPdfContent().isBlank()) {
                    skipped++;
                    continue;
                }

                if (indexSopEntry(entry)) {
                    indexed++;
                }

                // Small delay between entries to avoid overwhelming the system
                if (indexed % 10 == 0) {
                    Thread.sleep(100);
                }
            }

            log.info("PDF indexing complete. Indexed: {}, Skipped: {}, Total: {}",
                    indexed, skipped, total);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("PDF indexing interrupted", e);
        } catch (Exception e) {
            log.error("Error during PDF indexing", e);
        }
    }

    /**
     * Re-index a specific SOP entry (useful after updates).
     *
     * @param id the ID of the SOP entry to re-index
     * @return true if re-indexing was successful, false otherwise
     */
    @Transactional
    public boolean reindexEntry(String id) {
        return sopEntryRepository.findById(id)
                .map(this::indexSopEntry)
                .orElse(false);
    }
}
