package com.kwgroup.sopdocument.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class DatabaseBackupServiceTest {

    @Autowired
    private DatabaseBackupService databaseBackupService;

    @Test
    public void testPerformBackup() {
        // Run the backup
        databaseBackupService.performBackup();

        // Verify that a backup file was created in the last minute
        Path backupDir = Paths.get("./data/backups/db");
        assertTrue(Files.exists(backupDir), "Backup directory should exist");

        // Check if any zip file exists
        try (java.util.stream.Stream<Path> files = Files.list(backupDir)) {
            boolean hasBackup = files.anyMatch(
                    path -> path.getFileName().toString().startsWith("sop-db_backup_")
                            && path.toString().endsWith(".zip"));
            assertTrue(hasBackup, "A backup zip file starting with 'sop-db_backup_' should exist");
        } catch (Exception e) {
            throw new RuntimeException("Failed to list backup files", e);
        }
    }
}
