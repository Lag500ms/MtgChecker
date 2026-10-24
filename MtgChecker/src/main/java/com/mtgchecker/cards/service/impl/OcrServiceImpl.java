package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.dto.response.ScanCardBounds;
import com.mtgchecker.cards.dto.response.ScanCardResultResponse;
import com.mtgchecker.cards.dto.response.SetResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.cards.service.IOcrService;
import com.mtgchecker.cards.service.ISetService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.leptonica.PIX;
import org.bytedeco.tesseract.TessBaseAPI;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static org.bytedeco.leptonica.global.leptonica.pixDestroy;
import static org.bytedeco.leptonica.global.leptonica.pixReadMem;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrServiceImpl implements IOcrService {

    private final ICardService cardService;
    private final ISetService setService;

    private final Set<String> cachedSetCodes = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private volatile long lastSetCacheRefresh = 0;
    private static final long CACHE_TTL_MS = 24 * 60 * 60 * 1000L;

    private static final Set<String> FALLBACK_COMMON_SETS = Set.of(
            "ONE", "NEO", "FDN", "BLB", "MH2", "MH3", "OTJ", "WOE", "MKM", "LCI",
            "DMU", "BRO", "SNC", "MID", "VOW", "KHM", "ZNR", "IKO", "THB", "ELD",
            "WAR", "RNA", "GRN", "DOM", "XLN", "RIX", "HOU", "AKH", "AER", "KLD",
            "EMN", "SOI", "OGW", "BFZ", "EOE", "FIN", "TSR", "2X2", "2XM", "DMR"
    );

    @Override
    public ScanCardResultResponse scanCardImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file cannot be empty");
        }
        try {
            return processImageBytes(file.getBytes());
        } catch (IOException e) {
            throw new BadRequestException("Failed to read image bytes: " + e.getMessage());
        }
    }

    @Override
    public ScanCardResultResponse scanCardBase64(String base64Image) {
        if (base64Image == null || base64Image.isBlank()) {
            throw new BadRequestException("Base64 image payload cannot be empty");
        }

        String sanitized = base64Image.trim();
        int commaIndex = sanitized.indexOf(',');
        if (commaIndex != -1) {
            sanitized = sanitized.substring(commaIndex + 1);
        }

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(sanitized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid Base64 image encoding");
        }

        return processImageBytes(bytes);
    }

    private ScanCardResultResponse processImageBytes(byte[] bytes) {
        BufferedImage original;
        try {
            original = ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            original = null;
        }

        if (original == null) {
            throw new BadRequestException("Could not decode image data into a valid picture");
        }

        Set<String> setCodes = getKnownSetCodes();
        List<MtgTextLocator.LocatedCandidate> candidates = MtgTextLocator.locateCollectorTextBlocks(original, 3);
        List<String> triedTexts = new ArrayList<>();

        for (MtgTextLocator.LocatedCandidate candidate : candidates) {
            BufferedImage binarized = MtgTextLocator.extractAndBinarize(original, candidate);
            byte[] png = toPngBytes(binarized);
            String rawText = extractTextWithTesseract(png);
            if (rawText == null || rawText.isBlank()) continue;

            String cleanedText = MtgCollectorParser.cleanOCRText(rawText);
            int rawScore = MtgCollectorParser.scoreCollectorNumberResult(rawText, setCodes);
            int cleanScore = MtgCollectorParser.scoreCollectorNumberResult(cleanedText, setCodes);
            String chosenText = (rawScore >= cleanScore) ? rawText.trim() : cleanedText.trim();
            int score = Math.max(rawScore, cleanScore);

            triedTexts.add(chosenText);
            log.info("MTG Locator Candidate [score={}] text: '{}'", score, chosenText);

            MtgCollectorParser.ParsedCollectorInfo parsed = MtgCollectorParser.parseCollectorNumber(chosenText, setCodes);
            if (parsed == null && !cleanedText.equals(chosenText)) {
                parsed = MtgCollectorParser.parseCollectorNumber(cleanedText, setCodes);
            }

            if (parsed != null) {
                try {
                    CardResponse card = cardService.findBySetAndCollectorNumber(
                            parsed.setCode(),
                            parsed.collectorNumber(),
                            MtgCollectorParser.mapLanguageCode(parsed.language())
                    );
                    if (card != null) {
                        String confidence = (score >= 80) ? "HIGH" : (score >= 40 ? "MEDIUM" : "LOW");
                        return new ScanCardResultResponse(
                                card,
                                confidence,
                                chosenText,
                                candidate.bounds(),
                                triedTexts
                        );
                    }
                } catch (Exception ex) {
                    log.debug("Lookup failed for candidate {}/{}: {}", parsed.setCode(), parsed.collectorNumber(), ex.getMessage());
                }
            }
        }

        int origW = original.getWidth();
        int origH = original.getHeight();
        int roiX = (int) (origW * 0.02);
        int roiY = (int) (origH * 0.70);
        int roiW = Math.min((int) (origW * 0.65), origW - roiX);
        int roiH = Math.min((int) (origH * 0.28), origH - roiY);

        if (roiW > 20 && roiH > 20) {
            BufferedImage blCrop = original.getSubimage(roiX, roiY, roiW, roiH);
            byte[] blPng = prepareOptimizedPng(blCrop, 2.2);
            String blText = extractTextWithTesseract(blPng);
            if (blText != null && !blText.isBlank()) {
                triedTexts.add(blText.trim());
                MtgCollectorParser.ParsedCollectorInfo parsed = MtgCollectorParser.parseCollectorNumber(blText, setCodes);
                if (parsed != null) {
                    try {
                        CardResponse card = cardService.findBySetAndCollectorNumber(
                                parsed.setCode(),
                                parsed.collectorNumber(),
                                MtgCollectorParser.mapLanguageCode(parsed.language())
                        );
                        if (card != null) {
                            return new ScanCardResultResponse(
                                    card,
                                    "MEDIUM",
                                    blText.trim(),
                                    new ScanCardBounds(roiX, roiY, roiW, roiH),
                                    triedTexts
                            );
                        }
                    } catch (Exception ex) {
                        log.debug("Fallback BL lookup failed: {}", ex.getMessage());
                    }
                }
            }
        }

        String summary = triedTexts.isEmpty() ? "No text detected on the card footer." : String.join(" | ", triedTexts);
        throw new NotFoundException("Could not identify MTG card set and collector number from the photo. Tried: " + summary);
    }

    private byte[] toPngBytes(BufferedImage img) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            return new byte[0];
        }
    }

    private byte[] prepareOptimizedPng(BufferedImage src, double scale) {
        int targetW = (int) (src.getWidth() * scale);
        int targetH = (int) (src.getHeight() * scale);

        BufferedImage gray = new BufferedImage(targetW, targetH, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(src, 0, 0, targetW, targetH, null);
        g.dispose();

        return toPngBytes(gray);
    }

    private String extractTextWithTesseract(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) return "";
        String tessdataPath = resolveTessdataPath();
        PIX pix = pixReadMem(imageBytes, imageBytes.length);
        if (pix == null) return "";

        try (TessBaseAPI api = new TessBaseAPI()) {
            if (api.Init(tessdataPath, "eng") != 0) {
                log.error("Could not initialize Tesseract with datapath: {}", tessdataPath);
                return "";
            }

            api.SetPageSegMode(6);
            api.SetImage(pix);
            try (BytePointer textPtr = api.GetUTF8Text()) {
                String result = textPtr != null ? textPtr.getString() : "";
                api.End();
                return result;
            }
        } finally {
            pixDestroy(pix);
        }
    }

    private String resolveTessdataPath() {
        String[] candidates = {
                "tessdata",
                "MtgChecker/tessdata",
                "target/classes/tessdata",
                new File("tessdata").getAbsolutePath(),
                new File("MtgChecker", "tessdata").getAbsolutePath()
        };

        for (String c : candidates) {
            File f = new File(c);
            if (f.exists() && f.isDirectory()) {
                File trained = new File(f, "eng.traineddata");
                if (trained.exists()) {
                    return f.getAbsolutePath();
                }
            }
        }
        return "tessdata";
    }

    private Set<String> getKnownSetCodes() {
        long now = System.currentTimeMillis();
        if (cachedSetCodes.isEmpty() || (now - lastSetCacheRefresh) > CACHE_TTL_MS) {
            try {
                List<SetResponse> sets = setService.findAll();
                if (sets != null && !sets.isEmpty()) {
                    cachedSetCodes.clear();
                    for (SetResponse s : sets) {
                        if (s.getCode() != null) {
                            cachedSetCodes.add(s.getCode().toUpperCase());
                        }
                    }
                    lastSetCacheRefresh = now;
                }
            } catch (Exception ex) {
                log.warn("Could not refresh sets from setService: {}", ex.getMessage());
            }
        }
        if (cachedSetCodes.isEmpty()) {
            cachedSetCodes.addAll(FALLBACK_COMMON_SETS);
        }
        return cachedSetCodes;
    }
}
