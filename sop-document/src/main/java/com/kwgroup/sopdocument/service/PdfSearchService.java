package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.dto.SopEntryResponse;
import com.kwgroup.sopdocument.mapper.SopMapper;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.SopEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for searching PDF content across all SOP entries.
 * Uses caching for improved performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfSearchService {

    private final SopEntryRepository sopEntryRepository;
    private final SopMapper sopMapper;

    /**
     * Search for SOPs by PDF content.
     * Results are cached based on the query string.
     *
     * @param query the search query
     * @return list of matching SOP entries
     */
    @Cacheable(value = "pdfSearchResults", key = "#query.toLowerCase()")
    public List<SopEntryResponse> searchByContent(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String searchTerm = "%" + query.trim().toLowerCase() + "%";
        log.info("Searching PDFs for content: {}", searchTerm);

        List<SopEntry> results = sopEntryRepository.searchByPdfContent(searchTerm);

        log.info("Found {} results for query: {}", results.size(), searchTerm);

        return results.stream()
                .map(sopMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Search for SOPs by PDF content with brand filter.
     *
     * @param query the search query
     * @param brand the brand to filter by
     * @return list of matching SOP entries
     */
    @Cacheable(value = "pdfSearchResults", key = "#query.toLowerCase() + '_' + #brand.toLowerCase()")
    public List<SopEntryResponse> searchByContentAndBrand(String query, String brand) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String searchTerm = "%" + query.trim().toLowerCase() + "%";
        String brandFilter = brand.trim().toLowerCase();

        log.info("Searching PDFs for content: {} in brand: {}", searchTerm, brandFilter);

        List<SopEntry> results = sopEntryRepository.searchByPdfContentAndBrand(searchTerm, brandFilter);

        log.info("Found {} results for query: {} in brand: {}",
                results.size(), searchTerm, brandFilter);

        return results.stream()
                .map(sopMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Search for SOPs by PDF content with category filter.
     *
     * @param query    the search query
     * @param category the category to filter by
     * @return list of matching SOP entries
     */
    @Cacheable(value = "pdfSearchResults", key = "#query.toLowerCase() + '_cat_' + #category.toLowerCase()")
    public List<SopEntryResponse> searchByContentAndCategory(String query, String category) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String searchTerm = "%" + query.trim().toLowerCase() + "%";
        String categoryFilter = category.trim().toLowerCase();

        log.info("Searching PDFs for content: {} in category: {}", searchTerm, categoryFilter);

        List<SopEntry> results = sopEntryRepository.searchByPdfContentAndCategory(searchTerm, categoryFilter);

        log.info("Found {} results for query: {} in category: {}",
                results.size(), searchTerm, categoryFilter);

        return results.stream()
                .map(sopMapper::toDto)
                .collect(Collectors.toList());
    }
}
