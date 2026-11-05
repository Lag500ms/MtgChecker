package com.mtgchecker.decks.service.impl;

import com.mtgchecker.decks.dto.request.CreateDeckRequest;
import com.mtgchecker.decks.dto.request.DeckCardItemRequest;
import com.mtgchecker.decks.dto.request.SyncDeckCardsRequest;
import com.mtgchecker.decks.dto.request.UpdateDeckRequest;
import com.mtgchecker.decks.dto.response.DeckCardResponse;
import com.mtgchecker.decks.dto.response.DeckResponse;
import com.mtgchecker.decks.dto.response.DeckSummaryResponse;
import com.mtgchecker.decks.entity.Deck;
import com.mtgchecker.decks.entity.DeckCard;
import com.mtgchecker.decks.entity.DeckFormat;
import com.mtgchecker.decks.repository.DeckFormatRepository;
import com.mtgchecker.decks.repository.DeckRepository;
import com.mtgchecker.decks.service.IDeckService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements IDeckService {

    private final DeckRepository deckRepository;
    private final DeckFormatRepository deckFormatRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DeckSummaryResponse> findAllByAccount(String accountId) {
        return deckRepository.findAllByAccountIdOrderByUpdatedAtDesc(accountId)
                .stream()
                .map(DeckServiceImpl::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeckResponse findByIdAndAccount(String id, String accountId) {
        Deck deck = deckRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new NotFoundException("Deck not found with id: " + id));
        return toDetailResponse(deck);
    }

    @Override
    @Transactional
    public DeckResponse create(String accountId, CreateDeckRequest request) {
        DeckFormat format = deckFormatRepository.findById(request.getFormatId().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid format ID: " + request.getFormatId()));

        Deck deck = Deck.builder()
                .accountId(accountId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .format(format)
                .commanderCardId(request.getCommanderCardId())
                .commanderCardName(request.getCommanderCardName())
                .coverCardUri(request.getCoverCardUri())
                .partnerCommanderCardId(request.getPartnerCommanderCardId())
                .partnerCommanderCardName(request.getPartnerCommanderCardName())
                .partnerCoverCardUri(request.getPartnerCoverCardUri())
                .commanderColorIdentity(request.getCommanderColorIdentity())
                .visibility(request.getVisibility() != null ? request.getVisibility().toUpperCase() : "PUBLIC")
                .cards(new ArrayList<>())
                .build();

        Deck saved = deckRepository.save(deck);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public DeckResponse update(String id, String accountId, UpdateDeckRequest request) {
        Deck deck = deckRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new NotFoundException("Deck not found with id: " + id));

        DeckFormat format = deckFormatRepository.findById(request.getFormatId().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid format ID: " + request.getFormatId()));

        deck.setName(request.getName().trim());
        deck.setDescription(request.getDescription());
        deck.setFormat(format);
        deck.setCommanderCardId(request.getCommanderCardId());
        deck.setCommanderCardName(request.getCommanderCardName());
        deck.setCoverCardUri(request.getCoverCardUri());
        deck.setPartnerCommanderCardId(request.getPartnerCommanderCardId());
        deck.setPartnerCommanderCardName(request.getPartnerCommanderCardName());
        deck.setPartnerCoverCardUri(request.getPartnerCoverCardUri());
        deck.setCommanderColorIdentity(request.getCommanderColorIdentity());
        if (request.getVisibility() != null) {
            deck.setVisibility(request.getVisibility().toUpperCase());
        }

        Deck saved = deckRepository.save(deck);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public DeckResponse syncCards(String id, String accountId, SyncDeckCardsRequest request) {
        Deck deck = deckRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new NotFoundException("Deck not found with id: " + id));

        deck.getCards().clear();

        if (request.getCards() != null) {
            for (DeckCardItemRequest item : request.getCards()) {
                DeckCard card = DeckCard.builder()
                        .deck(deck)
                        .scryfallId(item.getScryfallId())
                        .name(item.getName())
                        .setCode(item.getSetCode())
                        .collectorNumber(item.getCollectorNumber())
                        .manaCost(item.getManaCost())
                        .typeLine(item.getTypeLine())
                        .imageUrl(item.getImageUrl())
                        .cmc(item.getCmc())
                        .quantity(Math.max(1, item.getQuantity()))
                        .category(item.getCategory() != null ? item.getCategory().toUpperCase() : "MAINBOARD")
                        .build();
                deck.getCards().add(card);
            }
        }

        Deck saved = deckRepository.save(deck);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String id, String accountId) {
        Deck deck = deckRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new NotFoundException("Deck not found with id: " + id));
        deckRepository.delete(deck);
    }

    public static DeckSummaryResponse toSummaryResponse(Deck d) {
        if (d == null) return null;

        int mainboard = 0;
        int sideboard = 0;
        if (d.getCards() != null) {
            for (DeckCard c : d.getCards()) {
                if ("SIDEBOARD".equalsIgnoreCase(c.getCategory())) {
                    sideboard += c.getQuantity();
                } else {
                    mainboard += c.getQuantity();
                }
            }
        }

        return DeckSummaryResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .description(d.getDescription())
                .format(DeckFormatServiceImpl.toResponse(d.getFormat()))
                .commanderCardId(d.getCommanderCardId())
                .commanderCardName(d.getCommanderCardName())
                .coverCardUri(d.getCoverCardUri())
                .partnerCommanderCardId(d.getPartnerCommanderCardId())
                .partnerCommanderCardName(d.getPartnerCommanderCardName())
                .partnerCoverCardUri(d.getPartnerCoverCardUri())
                .commanderColorIdentity(d.getCommanderColorIdentity())
                .visibility(d.getVisibility())
                .mainboardCount(mainboard)
                .sideboardCount(sideboard)
                .totalCount(mainboard + sideboard)
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public static DeckResponse toDetailResponse(Deck d) {
        if (d == null) return null;

        int mainboard = 0;
        int sideboard = 0;
        List<DeckCardResponse> cardResponses = new ArrayList<>();

        if (d.getCards() != null) {
            for (DeckCard c : d.getCards()) {
                if ("SIDEBOARD".equalsIgnoreCase(c.getCategory())) {
                    sideboard += c.getQuantity();
                } else {
                    mainboard += c.getQuantity();
                }

                cardResponses.add(DeckCardResponse.builder()
                        .id(c.getId())
                        .scryfallId(c.getScryfallId())
                        .name(c.getName())
                        .setCode(c.getSetCode())
                        .collectorNumber(c.getCollectorNumber())
                        .manaCost(c.getManaCost())
                        .typeLine(c.getTypeLine())
                        .imageUrl(c.getImageUrl())
                        .cmc(c.getCmc())
                        .quantity(c.getQuantity())
                        .category(c.getCategory())
                        .build());
            }
        }

        return DeckResponse.builder()
                .id(d.getId())
                .accountId(d.getAccountId())
                .name(d.getName())
                .description(d.getDescription())
                .format(DeckFormatServiceImpl.toResponse(d.getFormat()))
                .commanderCardId(d.getCommanderCardId())
                .commanderCardName(d.getCommanderCardName())
                .coverCardUri(d.getCoverCardUri())
                .partnerCommanderCardId(d.getPartnerCommanderCardId())
                .partnerCommanderCardName(d.getPartnerCommanderCardName())
                .partnerCoverCardUri(d.getPartnerCoverCardUri())
                .commanderColorIdentity(d.getCommanderColorIdentity())
                .visibility(d.getVisibility())
                .mainboardCount(mainboard)
                .sideboardCount(sideboard)
                .totalCount(mainboard + sideboard)
                .cards(cardResponses)
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
