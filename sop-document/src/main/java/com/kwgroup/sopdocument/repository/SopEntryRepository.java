package com.kwgroup.sopdocument.repository;

import com.kwgroup.sopdocument.model.SopEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SopEntryRepository extends JpaRepository<SopEntry, String> {
    Optional<SopEntry> findByFileName(String dbFileName);

    Optional<SopEntry> findByFileNameAndBrand(String fileName, String brand);

    /**
     * Search for SOP entries by PDF content (case-insensitive).
     * Using native query for H2 compatibility with LOB/TEXT fields.
     */
    @Query(value = "SELECT * FROM sop_documents WHERE LOWER(pdf_content) LIKE :query", nativeQuery = true)
    List<SopEntry> searchByPdfContent(@Param("query") String query);

    /**
     * Search for SOP entries by PDF content and brand (case-insensitive).
     */
    @Query(value = "SELECT * FROM sop_documents WHERE LOWER(pdf_content) LIKE :query AND LOWER(brand) = LOWER(:brand)", nativeQuery = true)
    List<SopEntry> searchByPdfContentAndBrand(@Param("query") String query, @Param("brand") String brand);

    /**
     * Search for SOP entries by PDF content and category (case-insensitive).
     */
    @Query(value = "SELECT * FROM sop_documents WHERE LOWER(pdf_content) LIKE :query AND LOWER(file_category) = LOWER(:category)", nativeQuery = true)
    List<SopEntry> searchByPdfContentAndCategory(@Param("query") String query, @Param("category") String category);
}
