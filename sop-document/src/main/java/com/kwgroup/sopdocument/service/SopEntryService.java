package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.dto.SopEntryRequest;
import com.kwgroup.sopdocument.dto.SopEntryResponse;
import com.kwgroup.sopdocument.dto.SopEntryUpdateRequest;
import com.kwgroup.sopdocument.mapper.SopMapper;
import com.kwgroup.sopdocument.model.*;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Service to handle SOP entry creation / update with file storage and backups.
 *
 * Behavior:
 * - Saves uploaded file directly under brand base path (e.g.
 * ./data/sops/knitwell)
 * - If a file with same disk name exists, moves it to
 * basePath/backups/<name>_ts.ext
 * - DB record is identified by beautified fileName (single-space, no extension)
 * - Updates existing DB entry if fileName already present, otherwise creates
 * new entry
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SopEntryService {

    private final SopEntryRepository sopEntryRepository;
    private final SopMapper sopMapper;
    private final PdfContentIndexService pdfContentIndexService;
    private final EmailService emailService;
    private final ApproverService approverService;
    private final ActionHistoryService actionHistoryService;

    @Value("${sop.notification.admin-email}")
    private String adminEmail;

    @Value("${sop.storage.path.knitwell}")
    private String knitwellBase;

    @Value("${sop.storage.path.talbots}")
    private String talbotsBase;

    @Value("${sop.storage.path.chicos}")
    private String chicosBase;

    @Value("${sop.upload.max-size-bytes:0}")
    private long maxUploadSize;

    private final Map<String, String> brandToBaseMap = new HashMap<>();

    @PostConstruct
    public void init() {
        if (knitwellBase != null)
            brandToBaseMap.put("knitwell", knitwellBase);
        if (talbotsBase != null)
            brandToBaseMap.put("talbots", talbotsBase);
        if (chicosBase != null)
            brandToBaseMap.put("chicos", chicosBase);
    }

    private static final DateTimeFormatter BACKUP_TS_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy_HH-mm-ss");
    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^A-Za-z0-9]+");

    /**
     * Save (create or update) a SOP entry with file upload.
     *
     * @param sopEntryRequest metadata provided by client (fileCategory, brand,
     *                        uploadedBy)
     * @param file            multipart uploaded file
     * @return SopEntryResponse of saved/updated entity
     */
    @Transactional
    @CacheEvict(value = { "pdfSearchResults", "pdfContent" }, allEntries = true)
    public SopEntryResponse save(SopEntryRequest sopEntryRequest, MultipartFile file) {
        // 1. validate uploaded file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is missing or empty");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFilename.isBlank()) {
            throw new IllegalArgumentException("Uploaded file must have a valid filename");
        }
        log.info("Uploading file: {}", originalFilename);

        // 2. derive DB-friendly fileName (space separated, no extension)
        String dbFileName = beautifyFileNameForDb(originalFilename);

        // 3. basic request validations (fileCategory and brand must exist on request)
        if (sopEntryRequest.getFileCategory() == null || sopEntryRequest.getFileCategory().isBlank()) {
            throw new IllegalArgumentException("fileCategory is required");
        }
        if (sopEntryRequest.getBrand() == null || sopEntryRequest.getBrand().isBlank()) {
            throw new IllegalArgumentException("brand is required");
        }

        String uploadedBy = nonNullOrDefault(sopEntryRequest.getUploadedBy(), "admin");

        // 4. normalize brand and resolve base path
        String brand = sopEntryRequest.getBrand().toLowerCase(Locale.ROOT).trim();
        if (!brandToBaseMap.containsKey(brand)) {
            throw new IllegalArgumentException("Unsupported brand: " + sopEntryRequest.getBrand());
        }
        String basePath = brandToBaseMap.get(brand);
        if (basePath == null || basePath.isBlank()) {
            throw new IllegalStateException("Base path for brand '" + brand + "' is not configured");
        }

        // 5. normalize category
        String category = sopEntryRequest.getFileCategory().toLowerCase(Locale.ROOT).trim();

        // 6. file size validation
        long size = file.getSize();
        if (maxUploadSize > 0 && size > maxUploadSize) {
            throw new IllegalArgumentException("File exceeds maximum allowed size: " + maxUploadSize);
        }

        // --------------------------
        // Save directly in basePath
        // --------------------------
        // prepare disk filename (underscore separated) and target path directly under
        // basePath
        String extension = getExtensionWithDot(originalFilename); // e.g. ".pdf"
        String diskBaseName = beautifyForDisk(dbFileName); // e.g. "testing_app_now"
        String diskFileName = diskBaseName + extension; // e.g. "testing_app_now.pdf"

        // ensure base path exists
        Path baseDir = Paths.get(basePath).normalize();
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            log.error("Failed to create base directory: {}", baseDir, e);
            throw new RuntimeException("Unable to create base directory: " + baseDir, e);
        }

        Path targetPath = baseDir.resolve(diskFileName).normalize();

        // If a physical file exists at targetPath -> move it to basePath/backups/
        if (Files.exists(targetPath)) {
            try {
                Path backupDir = baseDir.resolve("backups");
                Files.createDirectories(backupDir);
                String ts = LocalDateTime.now().format(BACKUP_TS_FORMAT); // dd-MM-yyyy_HH-mm-ss
                String backupName = diskBaseName + "_" + ts + extension; // e.g. testing_app_now_25-11-2025_12-00-00.pdf
                Path backupPath = backupDir.resolve(backupName).normalize();
                Files.move(targetPath, backupPath, StandardCopyOption.REPLACE_EXISTING);
                log.info("Backed up existing file '{}' to '{}'", targetPath, backupPath);
            } catch (IOException e) {
                log.error("Failed to backup existing file: {}", targetPath, e);
                throw new RuntimeException("Failed to backup existing file: " + targetPath, e);
            }
        }

        // write uploaded file to targetPath (overwrite if exists after backup)
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved uploaded file to {}", targetPath);
        } catch (IOException e) {
            log.error("Failed to write uploaded file to disk: {}", targetPath, e);
            throw new RuntimeException("Failed to write uploaded file to disk", e);
        }

        // 9. Now handle DB record (find by fileName AND brand)
        Optional<SopEntry> existingOpt = sopEntryRepository.findByFileNameAndBrand(dbFileName, brand);

        SopEntry toSave;
        if (existingOpt.isPresent()) {
            // update existing entity
            SopEntry existing = existingOpt.get();
            existing.setFilePath(targetPath.toString());
            existing.setFileSize(size);
            existing.setFileCategory(category);
            existing.setBrand(brand);
            existing.setUploadedBy(uploadedBy);
            existing.setModifiedAt(LocalDateTime.now());
            // Increment version
            existing.setVersion(getNextVersion(existing.getVersion(), null));
            toSave = existing;
        } else {
            // create new entity from request using mapper
            SopEntryRequest buildRequest = new SopEntryRequest();
            buildRequest.setFileCategory(category);
            buildRequest.setBrand(brand);
            buildRequest.setUploadedBy(uploadedBy);

            SopEntry entity = sopMapper.toEntity(buildRequest);

            // set server-derived fields
            entity.setFileName(dbFileName);
            entity.setFilePath(targetPath.toString());
            entity.setFileSize(size);
            entity.setCreatedAt(LocalDateTime.now());
            entity.setModifiedAt(LocalDateTime.now());
            entity.setBrand(brand);
            entity.setFileCategory(category);
            entity.setUploadedBy(uploadedBy);
            // Set initial version for new SOP
            entity.setVersion("v1.0");

            // Set approval workflow fields for new SOP
            entity.setStatus(ApprovalStatus.PENDING_APPROVAL);
            entity.setAssignedApproverId(sopEntryRequest.getAssignedApproverId());

            toSave = entity;
        }

        SopEntry saved = sopEntryRepository.save(toSave);
        log.info("Saved SOP: {} (brand: {}, category: {})", saved.getFileName(), saved.getBrand(),
                saved.getFileCategory());

        // Log to action history
        ActionType actionType = existingOpt.isPresent() ? ActionType.UPDATED : ActionType.UPLOADED;
        actionHistoryService.logAction(actionType, saved, sopEntryRequest.getUploadedBy(),
                existingOpt.isPresent() ? "Updated to version: " + saved.getVersion() : null);

        // Extract and index PDF content asynchronously
        try {
            pdfContentIndexService.indexSopEntry(saved);
        } catch (Exception e) {
            log.warn("Failed to index PDF content for entry: {}", saved.getId(), e);
        }

        // Send approval request email to assigned approver
        if (saved.getAssignedApproverId() != null) {
            sendApprovalRequestEmail(saved);
        } else {
            log.warn("No approver assigned for SOP: {}. Skipping approval notification.", saved.getId());
        }

        return sopMapper.toDto(saved);
    }

    /**
     * Update metadata of an existing SOP entry.
     *
     * @param id                    the ID of the SOP entry to update
     * @param sopEntryUpdateRequest metadata to update
     * @return SopEntryResponse of updated entity
     */
    @Transactional
    @CacheEvict(value = { "pdfSearchResults", "pdfContent" }, allEntries = true)
    public SopEntryResponse update(String id, SopEntryUpdateRequest sopEntryUpdateRequest) {
        SopEntry existing = sopEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOP entry not found with id: " + id));

        // 1. Update metadata fields
        if (sopEntryUpdateRequest.getFileCategory() != null && !sopEntryUpdateRequest.getFileCategory().isBlank()) {
            existing.setFileCategory(sopEntryUpdateRequest.getFileCategory().toLowerCase(Locale.ROOT).trim());
        }

        // Handle brand update
        String effectiveBrand = existing.getBrand();
        if (sopEntryUpdateRequest.getBrand() != null && !sopEntryUpdateRequest.getBrand().isBlank()) {
            String newBrand = sopEntryUpdateRequest.getBrand().toLowerCase(Locale.ROOT).trim();
            if (!brandToBaseMap.containsKey(newBrand)) {
                throw new IllegalArgumentException("Unsupported brand: " + sopEntryUpdateRequest.getBrand());
            }
            existing.setBrand(newBrand);
            effectiveBrand = newBrand;
        }

        if (sopEntryUpdateRequest.getUploadedBy() != null && !sopEntryUpdateRequest.getUploadedBy().isBlank()) {
            existing.setUploadedBy(sopEntryUpdateRequest.getUploadedBy());
        }

        // 2. Handle file replacement if provided
        MultipartFile file = sopEntryUpdateRequest.getFile();
        if (file != null && !file.isEmpty()) {
            // Validate size
            long size = file.getSize();
            if (maxUploadSize > 0 && size > maxUploadSize) {
                throw new IllegalArgumentException("File exceeds maximum allowed size: " + maxUploadSize);
            }

            String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            if (originalFilename.isBlank()) {
                throw new IllegalArgumentException("Uploaded file must have a valid filename");
            }

            // Derive new filenames
            String dbFileName = beautifyFileNameForDb(originalFilename);

            // Check for duplicate filename (if it's different from current)
            if (!dbFileName.equals(existing.getFileName())) {
                Optional<SopEntry> duplicate = sopEntryRepository.findByFileNameAndBrand(dbFileName, effectiveBrand);
                if (duplicate.isPresent()) {
                    throw new IllegalArgumentException(
                            "A file with name '" + dbFileName + "' already exists. Please rename the file.");
                }
            }

            String extension = getExtensionWithDot(originalFilename);
            String diskBaseName = beautifyForDisk(dbFileName);
            String diskFileName = diskBaseName + extension;

            // Resolve base path for the (possibly new) brand
            String basePath = brandToBaseMap.get(effectiveBrand);
            if (basePath == null || basePath.isBlank()) {
                throw new IllegalStateException("Base path for brand '" + effectiveBrand + "' is not configured");
            }

            Path baseDir = Paths.get(basePath).normalize();
            try {
                Files.createDirectories(baseDir);
            } catch (IOException e) {
                throw new RuntimeException("Unable to create base directory: " + baseDir, e);
            }

            Path targetPath = baseDir.resolve(diskFileName).normalize();

            // Backup logic (similar to save)
            if (Files.exists(targetPath)) {
                try {
                    Path backupDir = baseDir.resolve("backups");
                    Files.createDirectories(backupDir);
                    String ts = LocalDateTime.now().format(BACKUP_TS_FORMAT);
                    String backupName = diskBaseName + "_" + ts + extension;
                    Path backupPath = backupDir.resolve(backupName).normalize();
                    Files.move(targetPath, backupPath, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to backup existing file: " + targetPath, e);
                }
            }

            // Save new file
            try {
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Failed to write uploaded file to disk", e);
            }

            // Delete OLD file if it was different and exists
            // (Only if path is different, which it likely is if name changed or brand
            // changed)
            String oldFilePath = existing.getFilePath();
            if (oldFilePath != null && !oldFilePath.equals(targetPath.toString())) {
                try {
                    Files.deleteIfExists(Paths.get(oldFilePath));
                } catch (IOException e) {
                    log.warn("Failed to delete old file: {}", oldFilePath);
                }
            }

            // Update entity with new file info
            existing.setFileName(dbFileName);
            existing.setFilePath(targetPath.toString());
            existing.setFileSize(size);
        }

        existing.setModifiedAt(LocalDateTime.now());
        // Increment version on update
        existing.setVersion(getNextVersion(existing.getVersion(), sopEntryUpdateRequest.getVersionUpdateType()));
        SopEntry saved = sopEntryRepository.save(existing);

        // Re-index PDF content if file was replaced
        if (sopEntryUpdateRequest.getFile() != null && !sopEntryUpdateRequest.getFile().isEmpty()) {
            try {
                pdfContentIndexService.indexSopEntry(saved);
            } catch (Exception e) {
                log.warn("Failed to re-index PDF content for entry: {}", saved.getId(), e);
            }
        }

        // Send notification
        sendNotification("SOP Updated: " + saved.getFileName(), "An existing SOP has been updated.", saved);

        return sopMapper.toDto(saved);
    }

    /**
     * Delete a SOP entry by ID.
     *
     * @param id the ID of the SOP entry to delete
     */
    @Transactional
    @CacheEvict(value = { "pdfSearchResults", "pdfContent" }, allEntries = true)
    public void delete(String id) {
        delete(id, false);
    }

    /**
     * Delete a SOP entry by ID with option to skip notification.
     *
     * @param id               the ID of the SOP entry to delete
     * @param skipNotification if true, skip sending email notification (used when
     *                         called from rejection flow)
     */
    @Transactional
    @CacheEvict(value = { "pdfSearchResults", "pdfContent" }, allEntries = true)
    public void delete(String id, boolean skipNotification) {
        SopEntry existing = sopEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOP entry not found with id: " + id));

        // Save SOP details before deletion for action history
        String sopId = existing.getId();
        String fileName = existing.getFileName();
        String brand = existing.getBrand();
        String category = existing.getFileCategory();

        // Delete file from disk
        if (existing.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(existing.getFilePath()));
                log.info("Deleted file: {}", existing.getFilePath());
            } catch (IOException e) {
                log.error("Failed to delete file: {}", existing.getFilePath(), e);
                // We might want to continue deleting the DB record even if file deletion fails,
                // or throw an exception. For now, we log and proceed.
            }
        }

        sopEntryRepository.delete(existing);
        log.info("Deleted SOP entry with id: {}", id);

        // Log to action history (using saved details since entity is deleted)
        actionHistoryService.logAction(ActionType.DELETED, sopId, fileName, brand, category, "admin", "SOP deleted");

        // Send notification only if not skipped (to avoid duplicate emails from
        // rejection flow)
        if (!skipNotification) {
            sendNotification("SOP Deleted: " + fileName, "An SOP has been deleted.", existing);
        }
    }

    /* ---------- helper methods ---------- */

    private static String getExtensionWithDot(String filename) {
        if (filename == null)
            return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot) : "";
    }

    /**
     * Turn DB-friendly name into disk-friendly base name (underscore separated)
     * Example: "testing app now" -> "testing_app_now"
     */
    private static String beautifyForDisk(String dbName) {
        if (dbName == null)
            return "";
        return dbName.trim().replaceAll("\\s+", "_");
    }

    private static String nonNullOrDefault(String value, String def) {
        return (value == null || value.isBlank()) ? def : value;
    }

    /**
     * Turn raw filename into DB-friendly "single space separated" string without
     * extension.
     * Examples:
     * - "testing_app-now v2.pdf" -> "testing app now v2"
     */
    private static String beautifyFileNameForDb(String filename) {
        if (filename == null || filename.isEmpty())
            return "";
        int dot = filename.lastIndexOf('.');
        String baseName = (dot > 0) ? filename.substring(0, dot) : filename;
        String replaced = NON_WORD_PATTERN.matcher(baseName).replaceAll(" ").trim();
        replaced = replaced.replaceAll("\\s{2,}", " ");
        return replaced;
    }

    /**
     * Get next version number by incrementing current version.
     * Examples:
     * - "v1" -> "v1.1" (default minor)
     * - "v1.0" + MINOR -> "v1.1"
     * - "v1.0" + MAJOR -> "v2.0"
     * - "v1.5" + MAJOR -> "v2.0"
     */
    private static String getNextVersion(String currentVersion, String updateType) {
        if (currentVersion == null || currentVersion.isEmpty()) {
            return "v1.0";
        }

        // Default to MINOR if not specified
        boolean isMajor = "MAJOR".equalsIgnoreCase(updateType);

        try {
            String cleanVersion = currentVersion.toLowerCase().replace("v", "");
            int major = 1;
            int minor = 0;

            if (cleanVersion.contains(".")) {
                String[] parts = cleanVersion.split("\\.");
                major = Integer.parseInt(parts[0]);
                minor = Integer.parseInt(parts[1]);
            } else {
                // Handle legacy "v1", "v2" etc.
                major = Integer.parseInt(cleanVersion);
                minor = 0;
            }

            if (isMajor) {
                major++;
                minor = 0;
            } else {
                if (minor == 9) {
                    major++;
                    minor = 0;
                } else {
                    minor++;
                }
            }

            return "v" + major + "." + minor;
        } catch (Exception e) {
            log.warn("Failed to parse version '{}', defaulting to v1.0", currentVersion);
            return "v1.0";
        }
    }

    private void sendNotification(String title, String message, SopEntry sopEntry) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("title", title);
        variables.put("message", message);

        Map<String, String> details = new HashMap<>();
        details.put("File Name", sopEntry.getFileName());
        details.put("Brand", sopEntry.getBrand());
        details.put("Category", sopEntry.getFileCategory());
        details.put("Uploaded By", sopEntry.getUploadedBy());
        details.put("Version", sopEntry.getVersion());
        details.put("Time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        variables.put("details", details);

        emailService.sendHtmlEmail(adminEmail, title, "email-template", variables);
    }

    private void sendApprovalRequestEmail(SopEntry sopEntry) {
        try {
            // Get approver details
            Optional<Approver> approverOpt = approverService.getAllActiveApprovers().stream()
                    .filter(a -> a.getId().equals(sopEntry.getAssignedApproverId()))
                    .findFirst();

            if (approverOpt.isEmpty()) {
                log.error("Assigned approver not found: {}", sopEntry.getAssignedApproverId());
                return;
            }

            Approver approver = approverOpt.get();

            Map<String, Object> variables = new HashMap<>();
            variables.put("sopTitle", sopEntry.getFileName());
            variables.put("brand", sopEntry.getBrand());
            variables.put("category", sopEntry.getFileCategory());
            variables.put("uploadedBy", sopEntry.getUploadedBy());
            variables.put("pendingAt", sopEntry.getCreatedAt()); // Use createdAt since pendingAt removed
            variables.put("expiryDate", sopEntry.getCreatedAt().plusDays(7)); // Use createdAt
            // TODO: Generate actual approval link with token
            variables.put("approvalLink", "http://localhost:3000/approval/" + sopEntry.getId());

            emailService.sendHtmlEmail(
                    approver.getEmail(),
                    "[Action Required] SOP Approval Request - " + sopEntry.getFileName(),
                    "sop-approval-request",
                    variables,
                    adminEmail); // CC admin on approval requests

            log.info("Sent approval request email to: {} (CC: {}) for SOP: {}", approver.getEmail(), adminEmail,
                    sopEntry.getId());
        } catch (Exception e) {
            log.error("Failed to send approval request email for SOP: {}", sopEntry.getId(), e);
        }
    }
}