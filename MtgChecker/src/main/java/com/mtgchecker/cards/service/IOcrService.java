package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.ScanCardResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface IOcrService {

    ScanCardResultResponse scanCardImage(MultipartFile file);

    ScanCardResultResponse scanCardBase64(String base64Image);
}
