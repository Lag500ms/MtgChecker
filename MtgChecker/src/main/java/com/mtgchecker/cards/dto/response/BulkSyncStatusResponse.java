package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSyncStatusResponse {
    private boolean running;
    private String type;
    private long importedCount;
    private String status;
    private String message;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
