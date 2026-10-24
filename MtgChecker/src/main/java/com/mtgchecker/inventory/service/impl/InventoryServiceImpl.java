package com.mtgchecker.inventory.service.impl;

import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.configs.security.SecurityUtil;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import com.mtgchecker.inventory.dto.request.AddOwnedCardRequest;
import com.mtgchecker.inventory.dto.request.UpdateOwnedCardRequest;
import com.mtgchecker.inventory.dto.response.CollectionSummaryResponse;
import com.mtgchecker.inventory.dto.response.OwnedCardResponse;
import com.mtgchecker.inventory.entity.CollectionSnapshot;
import com.mtgchecker.inventory.entity.OwnedCard;
import com.mtgchecker.inventory.repository.CollectionSnapshotRepository;
import com.mtgchecker.inventory.repository.OwnedCardRepository;
import com.mtgchecker.inventory.service.IInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements IInventoryService {

    private final OwnedCardRepository ownedCardRepository;
    private final CollectionSnapshotRepository collectionSnapshotRepository;
    private final ICardService cardService;

    @Override
    @Transactional
    public CollectionSummaryResponse getSummary() {
        String accountId = SecurityUtil.currentAccountId();
        List<OwnedCard> ownedCards = ownedCardRepository.findByAccountIdOrderByNameAscSetCodeAsc(accountId);
        if (ownedCards.isEmpty()) {
            return CollectionSummaryResponse.builder()
                    .totalValueUsd(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .totalCardsCount(0)
                    .uniqueCardsCount(0)
                    .deltaValue7d(null)
                    .deltaPercent7d(null)
                    .cards(List.of())
                    .build();
        }

        List<String> ids = ownedCards.stream()
                .map(OwnedCard::getScryfallId)
                .distinct()
                .toList();
        Map<String, CardResponse> printings = cardService.findByIds(ids).stream()
                .collect(Collectors.toMap(CardResponse::getId, Function.identity(), (left, right) -> left));

        BigDecimal totalValue = BigDecimal.ZERO;
        int totalCardsCount = 0;
        List<OwnedCardResponse> cardResponses = new ArrayList<>();

        for (OwnedCard owned : ownedCards) {
            CardResponse printing = printings.get(owned.getScryfallId());
            String price = printing == null ? null : priceForFinish(printing.getPrices(), owned.getFinish());
            OwnedCardResponse resp = toResponse(owned, price, printing);
            cardResponses.add(resp);

            totalCardsCount += owned.getQuantity();
            if (price != null) {
                try {
                    BigDecimal unitPrice = new BigDecimal(price);
                    totalValue = totalValue.add(unitPrice.multiply(BigDecimal.valueOf(owned.getQuantity())));
                } catch (NumberFormatException ignored) {
                }
            }
        }

        totalValue = totalValue.setScale(2, RoundingMode.HALF_UP);
        int uniqueCardsCount = ownedCards.size();

        LocalDate today = LocalDate.now();
        CollectionSnapshot todaySnapshot = collectionSnapshotRepository
                .findByAccountIdAndSnapshotDate(accountId, today)
                .orElseGet(() -> CollectionSnapshot.builder()
                        .accountId(accountId)
                        .snapshotDate(today)
                        .totalValueUsd(BigDecimal.ZERO)
                        .totalCardsCount(0)
                        .uniqueCardsCount(0)
                        .build());
        todaySnapshot.setTotalValueUsd(totalValue);
        todaySnapshot.setTotalCardsCount(totalCardsCount);
        todaySnapshot.setUniqueCardsCount(uniqueCardsCount);
        collectionSnapshotRepository.save(todaySnapshot);

        LocalDate pastThreshold = today.minusDays(7);
        Optional<CollectionSnapshot> priorSnapshotOpt = collectionSnapshotRepository
                .findTopByAccountIdAndSnapshotDateLessThanEqualOrderBySnapshotDateDesc(accountId, pastThreshold);

        BigDecimal deltaValue7d = null;
        Double deltaPercent7d = null;
        if (priorSnapshotOpt.isPresent()) {
            CollectionSnapshot prior = priorSnapshotOpt.get();
            deltaValue7d = totalValue.subtract(prior.getTotalValueUsd()).setScale(2, RoundingMode.HALF_UP);
            if (prior.getTotalValueUsd().compareTo(BigDecimal.ZERO) > 0) {
                deltaPercent7d = deltaValue7d
                        .divide(prior.getTotalValueUsd(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }
        }

        return CollectionSummaryResponse.builder()
                .totalValueUsd(totalValue)
                .totalCardsCount(totalCardsCount)
                .uniqueCardsCount(uniqueCardsCount)
                .deltaValue7d(deltaValue7d)
                .deltaPercent7d(deltaPercent7d)
                .cards(cardResponses)
                .build();
    }

    @Override
    @Transactional
    public OwnedCardResponse add(AddOwnedCardRequest request) {
        String accountId = SecurityUtil.currentAccountId();
        CardResponse printing = cardService.findBySetAndCollectorNumber(
                request.getSetCode(),
                request.getCollectorNumber());
        String finish = normalizeFinish(printing, request.getFinish());
        String condition = request.getCondition() != null && !request.getCondition().isBlank()
                ? request.getCondition().trim().toUpperCase()
                : "NM";
        String priceUsd = priceForFinish(printing.getPrices(), finish);
        String acquiredPrice = request.getAcquiredPriceUsd() != null && !request.getAcquiredPriceUsd().isBlank()
                ? request.getAcquiredPriceUsd().trim()
                : priceUsd;

        OwnedCard owned = ownedCardRepository
                .findByAccountIdAndScryfallIdAndFinish(accountId, printing.getId(), finish)
                .orElseGet(() -> OwnedCard.builder()
                        .accountId(accountId)
                        .scryfallId(printing.getId())
                        .oracleId(printing.getOracleId())
                        .name(printing.getName())
                        .setCode(printing.getSet())
                        .setName(printing.getSetName())
                        .collectorNumber(printing.getCollectorNumber())
                        .lang(printing.getLang())
                        .finish(finish)
                        .condition(condition)
                        .acquiredPriceUsd(acquiredPrice)
                        .storageLocation(request.getStorageLocation())
                        .quantity(0)
                        .build());

        owned.setQuantity(owned.getQuantity() + request.getQuantity());
        if (request.getCondition() != null && !request.getCondition().isBlank()) {
            owned.setCondition(condition);
        }
        if (request.getStorageLocation() != null) {
            owned.setStorageLocation(request.getStorageLocation());
        }
        if (request.getAcquiredPriceUsd() != null && !request.getAcquiredPriceUsd().isBlank()) {
            owned.setAcquiredPriceUsd(request.getAcquiredPriceUsd().trim());
        }

        OwnedCard saved = ownedCardRepository.save(owned);
        return toResponse(saved, priceUsd, printing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnedCardResponse> findAll() {
        String accountId = SecurityUtil.currentAccountId();
        List<OwnedCard> ownedCards = ownedCardRepository.findByAccountIdOrderByNameAscSetCodeAsc(accountId);
        if (ownedCards.isEmpty()) {
            return List.of();
        }
        List<String> ids = ownedCards.stream()
                .map(OwnedCard::getScryfallId)
                .distinct()
                .toList();
        Map<String, CardResponse> printings = cardService.findByIds(ids).stream()
                .collect(Collectors.toMap(CardResponse::getId, Function.identity(), (left, right) -> left));
        return ownedCards.stream()
                .map(owned -> {
                    CardResponse printing = printings.get(owned.getScryfallId());
                    String price = printing == null ? null : priceForFinish(printing.getPrices(), owned.getFinish());
                    return toResponse(owned, price, printing);
                })
                .toList();
    }

    @Override
    @Transactional
    public OwnedCardResponse updateQuantity(String id, UpdateOwnedCardRequest request) {
        String accountId = SecurityUtil.currentAccountId();
        OwnedCard owned = ownedCardRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new NotFoundException("Owned card not found: " + id));
        owned.setQuantity(request.getQuantity());
        if (request.getCondition() != null && !request.getCondition().isBlank()) {
            owned.setCondition(request.getCondition().trim().toUpperCase());
        }
        if (request.getStorageLocation() != null) {
            owned.setStorageLocation(request.getStorageLocation());
        }
        if (request.getAcquiredPriceUsd() != null && !request.getAcquiredPriceUsd().isBlank()) {
            owned.setAcquiredPriceUsd(request.getAcquiredPriceUsd().trim());
        }

        OwnedCard saved = ownedCardRepository.save(owned);
        String priceUsd = null;
        CardResponse printing = null;
        try {
            List<CardResponse> printings = cardService.findByIds(List.of(saved.getScryfallId()));
            if (!printings.isEmpty()) {
                printing = printings.getFirst();
                priceUsd = priceForFinish(printing.getPrices(), saved.getFinish());
            }
        } catch (RuntimeException ignored) {
        }
        return toResponse(saved, priceUsd, printing);
    }

    @Override
    @Transactional
    public void delete(String id) {
        String accountId = SecurityUtil.currentAccountId();
        if (!ownedCardRepository.existsByIdAndAccountId(id, accountId)) {
            throw new NotFoundException("Owned card not found: " + id);
        }
        ownedCardRepository.deleteById(id);
    }

    private static String normalizeFinish(CardResponse printing, String finish) {
        if (printing.getFinishes() == null) {
            throw new BadRequestException("Printing has no finishes");
        }
        return printing.getFinishes().stream()
                .filter(available -> available.equalsIgnoreCase(finish))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Finish " + finish + " is not available for " + printing.getSet() + " #" + printing.getCollectorNumber()));
    }

    private static String priceForFinish(CardPriceResponse prices, String finish) {
        if (prices == null) {
            return null;
        }
        return switch (finish.toLowerCase()) {
            case "foil" -> prices.getUsdFoil();
            case "etched" -> prices.getUsdEtched();
            default -> prices.getUsd();
        };
    }

    private static OwnedCardResponse toResponse(OwnedCard owned, String priceUsd, CardResponse printing) {
        String totalPriceUsd = null;
        if (priceUsd != null) {
            try {
                BigDecimal unit = new BigDecimal(priceUsd);
                BigDecimal total = unit.multiply(BigDecimal.valueOf(owned.getQuantity()));
                totalPriceUsd = total.setScale(2, RoundingMode.HALF_UP).toString();
            } catch (NumberFormatException ignored) {
            }
        }

        String imageUri = null;
        String rarity = null;
        String manaCost = null;
        if (printing != null) {
            if (printing.getImageUris() != null) {
                imageUri = printing.getImageUris().get("normal");
                if (imageUri == null) {
                    imageUri = printing.getImageUris().get("small");
                }
            }
            rarity = printing.getRarity();
            manaCost = printing.getManaCost();
        }

        return OwnedCardResponse.builder()
                .id(owned.getId())
                .scryfallId(owned.getScryfallId())
                .oracleId(owned.getOracleId())
                .name(owned.getName())
                .setCode(owned.getSetCode())
                .setName(owned.getSetName())
                .collectorNumber(owned.getCollectorNumber())
                .lang(owned.getLang())
                .finish(owned.getFinish())
                .condition(owned.getCondition() != null ? owned.getCondition() : "NM")
                .acquiredPriceUsd(owned.getAcquiredPriceUsd())
                .storageLocation(owned.getStorageLocation())
                .quantity(owned.getQuantity())
                .priceUsd(priceUsd)
                .totalPriceUsd(totalPriceUsd)
                .imageUri(imageUri)
                .rarity(rarity)
                .manaCost(manaCost)
                .build();
    }
}
