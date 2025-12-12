package com.kwgroup.sopdocument.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure Caffeine cache manager for high-performance in-memory caching.
     * 
     * Cache specifications:
     * - Maximum 1000 entries per cache
     * - Expire after 6 hours of write
     * - Expire after 2 hours of access
     * - Record cache statistics for monitoring
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "pdfContent", // Cache for extracted PDF text content
                "pdfSearchResults" // Cache for search query results
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(6, TimeUnit.HOURS)
                .expireAfterAccess(2, TimeUnit.HOURS)
                .recordStats());

        return cacheManager;
    }
}
