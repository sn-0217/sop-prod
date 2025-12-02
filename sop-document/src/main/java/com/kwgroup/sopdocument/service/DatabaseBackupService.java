package com.kwgroup.sopdocument.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseBackupService {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${sop.notification.admin-email}")
    private String adminEmail;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final String BACKUP_DIR = "./data/backups/db";

    /**
     * Runs a database backup every day at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void performBackup() {
        log.info("Starting scheduled database backup...");
        try {
            // Ensure backup directory exists
            Path backupPath = Paths.get(BACKUP_DIR);
            if (!Files.exists(backupPath)) {
                Files.createDirectories(backupPath);
            }

            String timestamp = LocalDateTime.now().format(FORMATTER);
            String fileName = "sop-db_backup_" + timestamp + ".zip";
            String fullPath = backupPath.resolve(fileName).toAbsolutePath().toString();

            // Execute H2 BACKUP command
            // BACKUP TO 'fileName.zip'
            String sql = String.format("BACKUP TO '%s'", fullPath);
            jdbcTemplate.execute(sql);

            log.info("Database backup completed successfully: {}", fullPath);

            // Send notification
            java.util.Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("title", "Database Backup Successful");
            variables.put("message", "The daily database backup has been completed successfully.");
            java.util.Map<String, String> details = new java.util.HashMap<>();
            details.put("File", fileName);
            details.put("Path", fullPath);
            details.put("Time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            variables.put("details", details);
            emailService.sendHtmlEmail(adminEmail, "Database Backup Successful", "email-template", variables);

            // Cleanup old backups (keep last 7 days)
            cleanupOldBackups(backupPath);

        } catch (Exception e) {
            log.error("Failed to perform database backup", e);

            // Send notification
            java.util.Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("title", "Database Backup Failed");
            variables.put("message", "The daily database backup failed. Please check the logs.");
            java.util.Map<String, String> details = new java.util.HashMap<>();
            details.put("Error", e.getMessage());
            details.put("Time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            variables.put("details", details);
            emailService.sendHtmlEmail(adminEmail, "Database Backup Failed", "email-template", variables);
        }
    }

    private void cleanupOldBackups(Path backupDir) {
        try (java.util.stream.Stream<Path> files = Files.list(backupDir)) {
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

            files.filter(path -> path.toString().endsWith(".zip"))
                    .filter(path -> {
                        try {
                            // Extract timestamp from filename: sop-db_backup_yyyyMMdd_HHmmss.zip
                            String filename = path.getFileName().toString();
                            String datePart = filename.replace("sop-db_backup_", "").replace(".zip", "");
                            LocalDateTime fileDate = LocalDateTime.parse(datePart, FORMATTER);
                            return fileDate.isBefore(sevenDaysAgo);
                        } catch (Exception e) {
                            log.warn("Skipping file with unexpected name format: {}", path);
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.info("Deleted old backup: {}", path);
                        } catch (IOException e) {
                            log.error("Failed to delete old backup: {}", path, e);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to list backup files for cleanup", e);
        }
    }
}
