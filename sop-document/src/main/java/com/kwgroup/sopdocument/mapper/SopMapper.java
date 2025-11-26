package com.kwgroup.sopdocument.mapper;

import com.kwgroup.sopdocument.dto.SopEntryRequest;
import com.kwgroup.sopdocument.dto.SopEntryResponse;
import com.kwgroup.sopdocument.model.SopEntry;
import org.springframework.stereotype.Component;

@Component
public class SopMapper {
    public SopEntry toEntity(SopEntryRequest request){
        return SopEntry.builder()
                .fileCategory(request.getFileCategory())
                .brand(request.getBrand())
                .uploadedBy(
                        (request.getUploadedBy() == null || request.getUploadedBy().isBlank())
                                ? "admin"
                                : request.getUploadedBy()
                )
                .build();
    }
    public SopEntryResponse toDto(SopEntry entry){
        return SopEntryResponse.builder()
                .id(entry.getId())
                .fileName(entry.getFileName())
                .filePath(entry.getFilePath())
                .fileSize(entry.getFileSize())
                .fileCategory(entry.getFileCategory())
                .brand(entry.getBrand())
                .uploadedBy(entry.getUploadedBy())
                .createdAt(entry.getCreatedAt())
                .modifiedAt(entry.getModifiedAt())
                .build();
    }
}