package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.CatalogResponse;
import java.util.List;

public interface ICatalogService {
    List<String> getSupportedCatalogTypes();
    CatalogResponse findCatalog(String type);
}
