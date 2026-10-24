package com.mtgchecker.cards.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.cards.dto.response.BulkDataResponse;
import com.mtgchecker.cards.dto.response.BulkSyncStatusResponse;
import com.mtgchecker.cards.entity.CachedCard;
import com.mtgchecker.cards.repository.CachedCardRepository;
import com.mtgchecker.cards.service.IBulkDataService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.ExternalServiceException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.GZIPInputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkDataServiceImpl implements IBulkDataService {

    private final ScryfallClient scryfallClient;
    private final CachedCardRepository cachedCardRepository;
    private final ObjectMapper objectMapper;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicLong currentImportCount = new AtomicLong(0);
    private volatile String currentType = null;
    private volatile String currentStatus = "IDLE";
    private volatile String currentMessage = "Ready to sync";
    private volatile LocalDateTime syncStartedAt = null;
    private volatile LocalDateTime syncCompletedAt = null;

    @Override
    public List<BulkDataResponse> findAll() {
        try {
            ScryfallBulkDataList list = scryfallClient.findAllBulkData();
            if (list == null || list.data() == null) {
                return List.of();
            }
            return list.data().stream().map(BulkDataServiceImpl::toResponse).toList();
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Failed to fetch bulk data: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public BulkDataResponse findById(String id) {
        try {
            ScryfallBulkData item = scryfallClient.findBulkDataById(id);
            if (item == null) {
                throw new NotFoundException("Bulk data not found with id: " + id);
            }
            return toResponse(item);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Bulk data not found with id: " + id);
            }
            throw new ExternalServiceException("Failed to fetch bulk data: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public BulkDataResponse findByType(String type) {
        try {
            ScryfallBulkData item = scryfallClient.findBulkDataByType(type);
            if (item == null) {
                throw new NotFoundException("Bulk data not found for type: " + type);
            }
            return toResponse(item);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND)) {
                throw new NotFoundException("Bulk data not found for type: " + type);
            }
            throw new ExternalServiceException("Failed to fetch bulk data: " + ex.getResponseBodyAsString(), ex);
        }
    }

    @Override
    public synchronized BulkSyncStatusResponse startSync(String type, Integer limit) {
        if (isRunning.get()) {
            throw new BadRequestException("Bulk data sync is already in progress for type: " + currentType);
        }

        String targetType = (type != null && !type.isBlank()) ? type.toLowerCase().trim() : "default-cards";
        BulkDataResponse bulkInfo = findByType(targetType);
        String downloadUri = bulkInfo.getJsonlDownloadUri();
        if (downloadUri == null || downloadUri.isBlank()) {
            downloadUri = bulkInfo.getDownloadUri();
        }
        if (downloadUri == null || downloadUri.isBlank()) {
            throw new ExternalServiceException("Download URI not found for bulk data type: " + targetType);
        }

        isRunning.set(true);
        currentType = targetType;
        currentStatus = "RUNNING";
        currentImportCount.set(0);
        currentMessage = "Starting download and sync from: " + downloadUri;
        syncStartedAt = LocalDateTime.now();
        syncCompletedAt = null;

        String finalDownloadUri = downloadUri;
        CompletableFuture.runAsync(() -> doSyncProcess(finalDownloadUri, limit));

        return getSyncStatus();
    }

    @Override
    public BulkSyncStatusResponse getSyncStatus() {
        return BulkSyncStatusResponse.builder()
                .running(isRunning.get())
                .type(currentType)
                .importedCount(currentImportCount.get())
                .status(currentStatus)
                .message(currentMessage)
                .startedAt(syncStartedAt)
                .completedAt(syncCompletedAt)
                .build();
    }

    private void doSyncProcess(String downloadUri, Integer limit) {
        try {
            URL url = URI.create(downloadUri).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "MtgChecker/0.0.1 (personal card inventory)");
            conn.setRequestProperty("Accept", "*/*");
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(60000);

            try (InputStream in = conn.getInputStream();
                 GZIPInputStream gzip = new GZIPInputStream(in);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(gzip, StandardCharsets.UTF_8))) {

                String line;
                List<CachedCard> batch = new ArrayList<>(500);
                long count = 0;

                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) {
                        continue;
                    }

                    try {
                        JsonNode node = objectMapper.readTree(line);
                        String id = node.path("id").asText(null);
                        if (id == null || id.isBlank()) {
                            continue;
                        }

                        String name = node.path("name").asText("");
                        String normName = name.toLowerCase().replaceAll("[^a-z0-9]", "");

                        CachedCard entity = CachedCard.builder()
                                .id(id)
                                .oracleId(node.path("oracle_id").asText(null))
                                .name(name)
                                .normalizedName(normName)
                                .setCode(node.path("set").asText("").toLowerCase())
                                .setName(node.path("set_name").asText(null))
                                .collectorNumber(node.path("collector_number").asText("").toLowerCase())
                                .lang(node.path("lang").asText("en"))
                                .manaCost(node.path("mana_cost").asText(null))
                                .typeLine(node.path("type_line").asText(null))
                                .oracleText(node.path("oracle_text").asText(null))
                                .rarity(node.path("rarity").asText(null))
                                .power(node.path("power").asText(null))
                                .toughness(node.path("toughness").asText(null))
                                .loyalty(node.path("loyalty").asText(null))
                                .artist(node.path("artist").asText(null))
                                .flavorText(node.path("flavor_text").asText(null))
                                .releasedAt(node.path("released_at").asText(null))
                                .scryfallUri(node.path("scryfall_uri").asText(null))
                                .rawJson(line)
                                .cachedAt(LocalDateTime.now())
                                .build();

                        batch.add(entity);
                        count++;
                        currentImportCount.set(count);

                        if (batch.size() >= 500) {
                            cachedCardRepository.saveAll(batch);
                            batch.clear();
                        }

                        if (limit != null && limit > 0 && count >= limit) {
                            break;
                        }
                    } catch (Exception ex) {
                        log.debug("Skipping unparseable card JSON line: {}", ex.getMessage());
                    }
                }

                if (!batch.isEmpty()) {
                    cachedCardRepository.saveAll(batch);
                }

                currentStatus = "COMPLETED";
                currentMessage = "Successfully imported " + count + " cards from Scryfall bulk data.";
                syncCompletedAt = LocalDateTime.now();
                log.info("Finished bulk sync: {} cards imported", count);
            }
        } catch (Exception ex) {
            log.error("Failed to process bulk data sync: {}", ex.getMessage(), ex);
            currentStatus = "FAILED";
            currentMessage = "Sync failed: " + ex.getMessage();
            syncCompletedAt = LocalDateTime.now();
        } finally {
            isRunning.set(false);
        }
    }

    private static BulkDataResponse toResponse(ScryfallBulkData b) {
        String effectiveUri = b.effectiveDownloadUri();
        Long effectiveSize = b.effectiveSize();
        return BulkDataResponse.builder()
                .id(b.id())
                .uri(b.uri())
                .type(b.type())
                .updatedAt(b.updatedAt())
                .name(b.name())
                .description(b.description())
                .size(effectiveSize)
                .compressedSize(effectiveSize)
                .downloadUri(effectiveUri)
                .jsonlDownloadUri(effectiveUri)
                .contentType(b.contentType())
                .contentEncoding(b.contentEncoding())
                .build();
    }
}
