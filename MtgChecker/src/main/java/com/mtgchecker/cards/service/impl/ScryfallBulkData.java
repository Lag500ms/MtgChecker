package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallBulkData(
        String id,
        String uri,
        String type,
        @JsonProperty("updated_at") String updatedAt,
        String name,
        String description,
        Long size,
        @JsonProperty("compressed_size") Long compressedSize,
        @JsonProperty("download_uri") String downloadUri,
        @JsonProperty("jsonl_download_uri") String jsonlDownloadUri,
        @JsonProperty("content_type") String contentType,
        @JsonProperty("content_encoding") String contentEncoding
) {
    public String effectiveDownloadUri() {
        if (jsonlDownloadUri != null && !jsonlDownloadUri.isBlank()) {
            return jsonlDownloadUri;
        }
        return downloadUri;
    }

    public Long effectiveSize() {
        if (compressedSize != null && compressedSize > 0) {
            return compressedSize;
        }
        return size;
    }
}
