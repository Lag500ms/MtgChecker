package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkDataResponse {
    private String id;
    private String uri;
    private String type;
    private String updatedAt;
    private String name;
    private String description;
    private Long size;
    private Long compressedSize;
    private String downloadUri;
    private String jsonlDownloadUri;
    private String contentType;
    private String contentEncoding;
}
