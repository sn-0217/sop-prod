package com.kwgroup.sopdocument.repository;

import com.kwgroup.sopdocument.model.SopEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SopEntryRepository extends JpaRepository<SopEntry, String> {
    Optional<SopEntry> findByFileName(String dbFileName);

    Optional<SopEntry> findByFileNameAndBrand(String fileName, String brand);
}
