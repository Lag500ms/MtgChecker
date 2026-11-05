package com.mtgchecker.decks.service.impl;

import com.mtgchecker.decks.dto.request.CreateDeckFormatRequest;
import com.mtgchecker.decks.dto.response.DeckFormatResponse;
import com.mtgchecker.decks.entity.DeckFormat;
import com.mtgchecker.decks.repository.DeckFormatRepository;
import com.mtgchecker.decks.service.IDeckFormatService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckFormatServiceImpl implements IDeckFormatService {

    private final DeckFormatRepository deckFormatRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DeckFormatResponse> findAllActive() {
        return deckFormatRepository.findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(DeckFormatServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckFormatResponse> findAll() {
        return deckFormatRepository.findAll()
                .stream()
                .map(DeckFormatServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeckFormatResponse findById(String id) {
        DeckFormat format = deckFormatRepository.findById(id.toLowerCase())
                .orElseThrow(() -> new NotFoundException("Deck format not found with id: " + id));
        return toResponse(format);
    }

    @Override
    @Transactional
    public DeckFormatResponse create(CreateDeckFormatRequest request) {
        String id = request.getId().trim().toLowerCase();
        if (deckFormatRepository.existsByIdIgnoreCase(id)) {
            throw new BadRequestException("Deck format ID already exists: " + id);
        }

        DeckFormat format = DeckFormat.builder()
                .id(id)
                .name(request.getName().trim())
                .description(request.getDescription())
                .scryfallKey(request.getScryfallKey().trim().toLowerCase())
                .minCards(request.getMinCards())
                .maxCards(request.getMaxCards())
                .maxCopies(request.getMaxCopies())
                .hasCommander(request.isHasCommander())
                .hasSideboard(request.isHasSideboard())
                .active(true)
                .build();

        return toResponse(deckFormatRepository.save(format));
    }

    @Override
    @Transactional
    public DeckFormatResponse update(String id, CreateDeckFormatRequest request) {
        DeckFormat format = deckFormatRepository.findById(id.toLowerCase())
                .orElseThrow(() -> new NotFoundException("Deck format not found with id: " + id));

        format.setName(request.getName().trim());
        format.setDescription(request.getDescription());
        format.setScryfallKey(request.getScryfallKey().trim().toLowerCase());
        format.setMinCards(request.getMinCards());
        format.setMaxCards(request.getMaxCards());
        format.setMaxCopies(request.getMaxCopies());
        format.setHasCommander(request.isHasCommander());
        format.setHasSideboard(request.isHasSideboard());

        return toResponse(deckFormatRepository.save(format));
    }

    @Override
    @Transactional
    public void delete(String id) {
        DeckFormat format = deckFormatRepository.findById(id.toLowerCase())
                .orElseThrow(() -> new NotFoundException("Deck format not found with id: " + id));
        format.setActive(false);
        deckFormatRepository.save(format);
    }

    public static DeckFormatResponse toResponse(DeckFormat f) {
        if (f == null) return null;
        return DeckFormatResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .description(f.getDescription())
                .scryfallKey(f.getScryfallKey())
                .minCards(f.getMinCards())
                .maxCards(f.getMaxCards())
                .maxCopies(f.getMaxCopies())
                .hasCommander(f.isHasCommander())
                .hasSideboard(f.isHasSideboard())
                .active(f.isActive())
                .build();
    }
}
