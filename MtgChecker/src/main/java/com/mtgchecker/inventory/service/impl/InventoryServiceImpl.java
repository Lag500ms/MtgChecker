package com.mtgchecker.inventory.service.impl;

import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.configs.security.SecurityUtil;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import com.mtgchecker.inventory.dto.request.AddOwnedCardRequest;
import com.mtgchecker.inventory.dto.request.UpdateOwnedCardRequest;
import com.mtgchecker.inventory.dto.response.OwnedCardResponse;
import com.mtgchecker.inventory.entity.OwnedCard;
import com.mtgchecker.inventory.repository.OwnedCardRepository;
import com.mtgchecker.inventory.service.IInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements IInventoryService {

    private final OwnedCardRepository ownedCardRepository;
    private final ICardService cardService;

    @Override
    @Transactional
    public OwnedCardResponse add(AddOwnedCardRequest request) {
        String accountId = SecurityUtil.currentAccountId();
        CardResponse printing = cardService.findBySetAndCollectorNumber(
                request.getSetCode(),
                request.getCollectorNumber());
        String finish = normalizeFinish(printing, request.getFinish());
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
                        .quantity(0)
                        .build());
        owned.setQuantity(owned.getQuantity() + request.getQuantity());
        OwnedCard saved = ownedCardRepository.save(owned);
        return toResponse(saved, priceForFinish(printing.getPrices(), finish));
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
                    return toResponse(owned, price);
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
        OwnedCard saved = ownedCardRepository.save(owned);
        return findAll().stream()
                .filter(card -> card.getId().equals(saved.getId()))
                .findFirst()
                .orElseGet(() -> toResponse(saved, null));
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
        return switch (finish) {
            case "foil" -> prices.getUsdFoil();
            case "etched" -> prices.getUsdEtched();
            default -> prices.getUsd();
        };
    }

    private static OwnedCardResponse toResponse(OwnedCard owned, String priceUsd) {
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
                .quantity(owned.getQuantity())
                .priceUsd(priceUsd)
                .build();
    }
}
