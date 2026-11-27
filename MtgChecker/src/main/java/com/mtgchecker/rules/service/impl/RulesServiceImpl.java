package com.mtgchecker.rules.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.dto.response.RulingResponse;
import com.mtgchecker.cards.entity.CachedCard;
import com.mtgchecker.cards.repository.CachedCardRepository;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.cards.service.IRulingService;
import com.mtgchecker.exceptions.NotFoundException;
import com.mtgchecker.rules.dto.request.AskJudgeRequest;
import com.mtgchecker.rules.dto.request.CardInteractionRequest;
import com.mtgchecker.rules.dto.response.ChapterSummaryResponse;
import com.mtgchecker.rules.dto.response.CheatSheetResponse;
import com.mtgchecker.rules.dto.response.ComprehensiveRuleResponse;
import com.mtgchecker.rules.dto.response.FormatRuleResponse;
import com.mtgchecker.rules.dto.response.JudgeVerdictResponse;
import com.mtgchecker.rules.dto.response.RuleGlossaryResponse;
import com.mtgchecker.rules.dto.response.SectionSummaryResponse;
import com.mtgchecker.rules.entity.ComprehensiveRule;
import com.mtgchecker.rules.entity.FormatRule;
import com.mtgchecker.rules.entity.QuickDispute;
import com.mtgchecker.rules.entity.RuleCheatSheet;
import com.mtgchecker.rules.entity.RuleGlossary;
import com.mtgchecker.rules.entity.RuleQueryCache;
import com.mtgchecker.rules.repository.ComprehensiveRuleRepository;
import com.mtgchecker.rules.repository.FormatRuleRepository;
import com.mtgchecker.rules.repository.QuickDisputeRepository;
import com.mtgchecker.rules.repository.RuleCheatSheetRepository;
import com.mtgchecker.rules.repository.RuleGlossaryRepository;
import com.mtgchecker.rules.repository.RuleQueryCacheRepository;
import com.mtgchecker.rules.service.IRulesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.mtgchecker.exceptions.ExternalServiceException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class RulesServiceImpl implements IRulesService {

    private final RuleQueryCacheRepository cacheRepository;
    private final RuleCheatSheetRepository cheatSheetRepository;
    private final QuickDisputeRepository quickDisputeRepository;
    private final FormatRuleRepository formatRuleRepository;
    private final ComprehensiveRuleRepository comprehensiveRuleRepository;
    private final RuleGlossaryRepository ruleGlossaryRepository;
    private final CachedCardRepository cachedCardRepository;
    private final ICardService cardService;
    private final IRulingService rulingService;
    private final N8nClient n8nClient;
    private final ObjectMapper objectMapper;


    @Override
    @Cacheable(value = "judge_verdict", key = "'deepseek-v1:' + #request.question.trim().toLowerCase()", unless = "#result == null")
    public JudgeVerdictResponse askJudge(AskJudgeRequest request) {
        String rawQuery = request.getQuestion().trim();
        String normalizedQuery = rawQuery.toLowerCase().replaceAll("\\s+", " ");
        String queryHash = computeHash("deepseek-v1:" + normalizedQuery);

        Optional<RuleQueryCache> cachedOpt = cacheRepository.findByQueryHash(queryHash);
        if (cachedOpt.isPresent()) {
            RuleQueryCache cached = cachedOpt.get();
            try {
                JudgeVerdictResponse response = objectMapper.readValue(cached.getResponseJson(), JudgeVerdictResponse.class);
                response.setIsCached(true);
                return response;
            } catch (Exception e) {
                log.warn("Failed to deserialize cached rule response for hash: {}", queryHash, e);
            }
        }

        List<RetrievedCardContext> retrievedCards = retrieveCardKnowledge(rawQuery);
        List<ComprehensiveRule> retrievedRules = retrieveCrRules(rawQuery, retrievedCards);
        List<RuleGlossary> retrievedGlossary = retrieveGlossaryTerms(rawQuery, retrievedCards);

        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(rawQuery, retrievedCards, retrievedRules, retrievedGlossary);

        JudgeVerdictResponse response;
        try {
            String json = n8nClient.askJudge(rawQuery, systemPrompt, userPrompt);
            response = objectMapper.readValue(json, JudgeVerdictResponse.class);
            if (response == null || response.getSummary() == null || response.getSummary().isBlank()
                    || !List.of("YES", "NO", "CONDITIONAL").contains(response.getVerdict())) {
                throw new IllegalArgumentException("Invalid judge verdict");
            }
        } catch (Exception e) {
            throw new ExternalServiceException("Trọng tài AI tạm thời chưa thể trả lời. Vui lòng thử lại.", e);
        }

        if (response.getId() == null || response.getId().isBlank()) {
            response.setId(UUID.randomUUID().toString());
        }
        response.setQuery(rawQuery);
        if (response.getCardNames() == null || response.getCardNames().isEmpty()) {
            response.setCardNames(retrievedCards.stream().map(c -> c.name).toList());
        }
        Set<String> sources = retrievedRules.stream().map(r -> "CR " + r.getRuleNumber())
                .collect(java.util.stream.Collectors.toSet());
        response.setCrRules(response.getCrRules() == null ? List.of()
                : response.getCrRules().stream().filter(sources::contains).distinct().toList());
        response.setIsCached(false);

        try {
            String savedJson = objectMapper.writeValueAsString(response);
            RuleQueryCache cacheEntry = RuleQueryCache.builder()
                    .queryHash(queryHash)
                    .userQuery(rawQuery)
                    .responseJson(savedJson)
                    .cardNames(String.join(", ", response.getCardNames()))
                    .build();
            cacheRepository.save(cacheEntry);
        } catch (Exception e) {
            log.warn("Failed to persist rule query to cache: {}", queryHash, e);
        }

        return response;
    }

    private List<RetrievedCardContext> retrieveCardKnowledge(String query) {
        List<String> candidates = extractPotentialCardNames(query);
        List<RetrievedCardContext> cards = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();

        for (String candidate : candidates) {
            if (cards.size() >= 3) break;

            try {
                CardResponse apiCard = cardService.findByName(null, candidate, null);
                if (apiCard != null && seenNames.add(apiCard.getName().toLowerCase())) {
                    List<String> rulings = fetchCardRulings(apiCard.getId());
                    cards.add(new RetrievedCardContext(
                            apiCard.getName(),
                            apiCard.getTypeLine(),
                            apiCard.getManaCost(),
                            apiCard.getOracleText(),
                            rulings
                    ));
                }
            } catch (Exception ignored) {
            }
        }

        return cards;
    }

    private List<String> fetchCardRulings(String cardId) {
        if (cardId == null || cardId.isBlank()) return Collections.emptyList();
        try {
            List<RulingResponse> rulings = rulingService.findByCardId(cardId);
            return rulings.stream()
                    .map(r -> r.getPublishedAt() + ": " + r.getComment())
                    .limit(6)
                    .toList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<String> extractPotentialCardNames(String query) {
        List<String> candidates = new ArrayList<>();

        java.util.regex.Matcher quoteMatcher = java.util.regex.Pattern.compile("\"([^\"]+)\"").matcher(query);
        while (quoteMatcher.find()) {
            candidates.add(quoteMatcher.group(1).trim());
        }

        String cleaned = query.replaceAll("(?i)\\b(cho tôi hỏi|hỏi|về|thực sự|hữu dụng|mạnh không|tốt không|có tốt không|đánh giá|does|is|can|what happens when|if|opponent|player|battlefield|graveyard|stack)\\b", " ");

        for (String part : cleaned.split("(?i)(\\+|\\bvs\\b|\\band\\b|\\bwith\\b|\\bvới\\b|\\bvà\\b|,|;)")) {
            String candidate = part.trim().replaceAll("(?i)^the\\s+", "").trim();
            if (candidate.length() >= 3 && candidate.matches(".*[A-Za-z]{3,}.*") && !candidates.contains(candidate)) {
                candidates.add(candidate);
            }
        }

        java.util.regex.Matcher engMatcher = java.util.regex.Pattern.compile("(?i)\\b(?:the\\s+)?([A-Za-z][A-Za-z' -]{2,}[A-Za-z])\\b").matcher(query);
        while (engMatcher.find()) {
            String engPhrase = engMatcher.group(1).trim().replaceAll("(?i)^the\\s+", "").trim();
            if (engPhrase.length() >= 4 && !candidates.contains(engPhrase)) {
                candidates.add(engPhrase);
            }
        }

        return candidates;
    }

    private String buildSystemPrompt() {
        return """
                You are an expert MTG Level 2 Certified Tournament Judge and Magic: The Gathering strategist.
                Your job is to answer rules disputes, card interactions, and card utility assessments accurately, rigorously, and clearly.

                CRITICAL LANGUAGE & TONE:
                - Always respond in the same language as the user's question (e.g. fluent Vietnamese if asked in Vietnamese).
                - Be insightful, accurate, and direct.

                Use only relevant supplied Oracle text, rulings, glossary and CR entries as evidence.
                Cite only supplied CR numbers as "CR <number>". If evidence is insufficient, return CONDITIONAL
                and explain what is missing. Example citations in the schema are not evidence.

                FOR UTILITY / CARD EVALUATION QUESTIONS:
                - If the user asks whether a card is useful or good (e.g. "is Spore Frog useful?"):
                  - verdict: "YES" or "CONDITIONAL" or "NO"
                  - verdictTitle: Concise punchy assessment of the card in formats like Commander (EDH) or Modern.
                  - summary: Explain why the card is valuable, key synergies/combos (e.g. Spore Frog fog lock with Muldrotha, Meren, Karador), and format viability.
                  - stackSteps: Sequential steps of how its ability resolves or interacts on the stack.
                  - crRules: Pertinent Comprehensive Rules citations (e.g. activated abilities, combat damage prevention).

                STRICT DOMAIN SCOPE & GUARDRAIL:
                If the user question is NOT about Magic: The Gathering (e.g. asking about general knowledge, cooking, other games, politics, weather, math, code, daily life, chit-chat), you MUST politely decline and return:
                {
                  "verdict": "CONDITIONAL",
                  "verdictTitle": "Câu hỏi ngoài phạm vi MTG (Out of Scope)",
                  "summary": "Tôi là Trọng tài AI chuyên trách về luật thi đấu, tương tác thẻ bài và cơ chế Comprehensive Rules của Magic: The Gathering. Câu hỏi này không thuộc phạm vi luật hoặc thẻ bài MTG. Vui lòng đặt câu hỏi liên quan đến thẻ bài hoặc luật chơi MTG!",
                  "stackSteps": [],
                  "crRules": []
                }

                OUTPUT JSON FORMAT:
                You must return a valid JSON object matching this exact schema:
                {
                  "verdict": "YES" or "NO" or "CONDITIONAL",
                  "verdictTitle": "A concise, punchy title summarizing the verdict in 1 sentence",
                  "summary": "Clear, detailed explanation explaining why and referencing the relevant mechanics",
                  "stackSteps": [
                    "Step 1: Description of spell/trigger/action",
                    "Step 2: Priority pass or state-based action check",
                    "Step 3: Resolution outcome"
                  ],
                  "crRules": [
                    "CR 704.5s",
                    "CR 613.1d"
                  ]
                }
                """;
    }

    private String buildUserPrompt(String query, List<RetrievedCardContext> cards, List<ComprehensiveRule> rules, List<RuleGlossary> glossary) {
        StringBuilder sb = new StringBuilder();

        sb.append("PLAYER QUESTION:\n").append(query).append("\n\n");

        if (!rules.isEmpty()) {
            sb.append("OFFICIAL COMPREHENSIVE RULES GROUND TRUTH (CR):\n");
            for (ComprehensiveRule r : rules) {
                sb.append("[CR ").append(r.getRuleNumber()).append(" - ").append(r.getChapterTitle()).append("]\n");
                sb.append(r.getRuleText()).append("\n");
                if (r.getExamplesText() != null && !r.getExamplesText().isBlank()) {
                    sb.append("Example: ").append(r.getExamplesText()).append("\n");
                }
                sb.append("\n");
            }
        }

        if (!glossary.isEmpty()) {
            sb.append("OFFICIAL RULES GLOSSARY DEFINITIONS:\n");
            for (RuleGlossary g : glossary) {
                sb.append("[").append(g.getTerm()).append("]: ").append(g.getDefinition()).append("\n");
            }
            sb.append("\n");
        }

        if (!cards.isEmpty()) {
            sb.append("RETRIEVED CARD ORACLE DATA & OFFICIAL RULINGS:\n");
            for (RetrievedCardContext card : cards) {
                sb.append("--- CARD: ").append(card.name).append(" ---\n");
                sb.append("Type: ").append(card.typeLine).append("\n");
                sb.append("Mana Cost: ").append(card.manaCost).append("\n");
                sb.append("Oracle Text: ").append(card.oracleText).append("\n");
                if (!card.rulings.isEmpty()) {
                    sb.append("Official WotC Rulings:\n");
                    for (String ruling : card.rulings) {
                        sb.append(" * ").append(ruling).append("\n");
                    }
                }
                sb.append("\n");
            }
        }

        sb.append("Ground your verdict strictly on the official Comprehensive Rules and Card Oracle texts provided above. Provide your official MTG tournament judge ruling in JSON format.");
        return sb.toString();
    }

    private List<ComprehensiveRule> retrieveCrRules(String query, List<RetrievedCardContext> cards) {
        Set<String> ruleIds = new LinkedHashSet<>();
        List<ComprehensiveRule> results = new ArrayList<>();

        Matcher numMatcher = Pattern.compile("(?i)\\b(?:cr\\s*)?([1-9]\\d{2}(?:\\.\\d+[a-z]?)?)\\b").matcher(query);
        while (numMatcher.find()) {
            String num = numMatcher.group(1);
            comprehensiveRuleRepository.findByRuleNumberIgnoreCase(num).ifPresent(r -> {
                if (ruleIds.add(r.getRuleNumber())) {
                    results.add(r);
                }
            });
        }

        List<String> keywords = extractRuleKeywords(query, cards);
        for (String kw : keywords) {
            if (results.size() >= 5) break;
            List<ComprehensiveRule> found = comprehensiveRuleRepository.searchRules(kw, PageRequest.of(0, 2)).getContent();
            for (ComprehensiveRule r : found) {
                if (ruleIds.add(r.getRuleNumber())) {
                    results.add(r);
                    if (results.size() >= 5) break;
                }
            }
        }

        return results;
    }

    private List<RuleGlossary> retrieveGlossaryTerms(String query, List<RetrievedCardContext> cards) {
        List<RuleGlossary> results = new ArrayList<>();
        Set<String> termNames = new HashSet<>();
        List<String> keywords = extractRuleKeywords(query, cards);

        for (String kw : keywords) {
            if (results.size() >= 3) break;
            ruleGlossaryRepository.findByTermIgnoreCase(kw).ifPresent(g -> {
                if (termNames.add(g.getTerm().toLowerCase())) {
                    results.add(g);
                }
            });
        }

        return results;
    }

    private List<String> extractRuleKeywords(String query, List<RetrievedCardContext> cards) {
        List<String> keywords = new ArrayList<>();
        String[] commonConcepts = {
                "layer", "layers", "stack", "priority", "state-based", "sba", "legend rule", "legendary",
                "counter", "token", "combat", "damage", "commander", "trigger", "activated ability",
                "replacement effect", "target", "indestructible", "hexproof", "ward", "trample",
                "flying", "deathtouch", "haste", "vigilance", "flash", "double strike", "first strike",
                "phasing", "sacrifice", "mill", "scry", "surveil", "exile", "graveyard", "copy"
        };

        String lowerQuery = query.toLowerCase();
        for (String c : commonConcepts) {
            if (lowerQuery.contains(c) && !keywords.contains(c)) {
                keywords.add(c);
            }
        }

        for (RetrievedCardContext card : cards) {
            if (card.oracleText() != null) {
                String lowerOracle = card.oracleText().toLowerCase();
                for (String c : commonConcepts) {
                    if (lowerOracle.contains(c) && !keywords.contains(c)) {
                        keywords.add(c);
                    }
                }
            }
        }

        return keywords;
    }

    @Override
    @Cacheable(value = "rules_cheat_sheets", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<CheatSheetResponse> getCheatSheets() {
        List<RuleCheatSheet> sheets = cheatSheetRepository.findAllByOrderByDisplayOrderAsc();
        List<CheatSheetResponse> result = new ArrayList<>();
        for (RuleCheatSheet s : sheets) {
            List<CheatSheetResponse.SectionDto> sections = Collections.emptyList();
            if (s.getSectionsJson() != null && !s.getSectionsJson().isBlank()) {
                try {
                    sections = objectMapper.readValue(
                            s.getSectionsJson(),
                            new TypeReference<List<CheatSheetResponse.SectionDto>>() {}
                    );
                } catch (Exception e) {
                    log.warn("Failed to parse sectionsJson for cheat sheet: {}", s.getId(), e);
                }
            }
            result.add(CheatSheetResponse.builder()
                    .id(s.getId())
                    .title(s.getTitle())
                    .subtitle(s.getSubtitle())
                    .icon(s.getIcon())
                    .badge(s.getBadge())
                    .sections(sections)
                    .build());
        }
        return result;
    }

    @Override
    @Cacheable(value = "rules_disputes", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<JudgeVerdictResponse> getQuickDisputes() {
        List<QuickDispute> disputes = quickDisputeRepository.findAllByOrderByDisplayOrderAsc();
        List<JudgeVerdictResponse> result = new ArrayList<>();
        for (QuickDispute d : disputes) {
            List<String> cardNames = Collections.emptyList();
            List<String> stackSteps = Collections.emptyList();
            List<String> crRules = Collections.emptyList();
            try {
                if (d.getCardNamesJson() != null && !d.getCardNamesJson().isBlank()) {
                    cardNames = objectMapper.readValue(d.getCardNamesJson(), new TypeReference<List<String>>() {});
                }
                if (d.getStackStepsJson() != null && !d.getStackStepsJson().isBlank()) {
                    stackSteps = objectMapper.readValue(d.getStackStepsJson(), new TypeReference<List<String>>() {});
                }
                if (d.getCrRulesJson() != null && !d.getCrRulesJson().isBlank()) {
                    crRules = objectMapper.readValue(d.getCrRulesJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception e) {
                log.warn("Failed to parse JSON for dispute: {}", d.getId(), e);
            }
            result.add(JudgeVerdictResponse.builder()
                    .id(d.getId())
                    .query(d.getQuery())
                    .cardNames(cardNames)
                    .verdict(d.getVerdict())
                    .verdictTitle(d.getVerdictTitle())
                    .summary(d.getSummary())
                    .stackSteps(stackSteps)
                    .crRules(crRules)
                    .category(d.getCategory())
                    .isCached(true)
                    .build());
        }
        return result;
    }

    @Override
    @Cacheable(value = "rules_formats", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<FormatRuleResponse> getFormatRules() {
        List<FormatRule> formats = formatRuleRepository.findAllByOrderByDisplayOrderAsc();
        List<FormatRuleResponse> result = new ArrayList<>();
        for (FormatRule f : formats) {
            List<FormatRuleResponse.FormatKeyRuleResponse> keyRules = Collections.emptyList();
            try {
                if (f.getKeyRulesJson() != null && !f.getKeyRulesJson().isBlank()) {
                    keyRules = objectMapper.readValue(f.getKeyRulesJson(), new TypeReference<List<FormatRuleResponse.FormatKeyRuleResponse>>() {});
                }
            } catch (Exception e) {
                log.warn("Failed to parse JSON for format: {}", f.getId(), e);
            }
            result.add(FormatRuleResponse.builder()
                    .id(f.getId())
                    .name(f.getName())
                    .badge(f.getBadge())
                    .icon(f.getIcon())
                    .summary(f.getSummary())
                    .startingLife(f.getStartingLife())
                    .minDeckSize(f.getMinDeckSize())
                    .maxDeckSize(f.getMaxDeckSize())
                    .keyRules(keyRules)
                    .displayOrder(f.getDisplayOrder())
                    .build());
        }
        return result;
    }

    @Override
    public JudgeVerdictResponse analyzeInteraction(CardInteractionRequest request) {
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append(request.getCardA().trim()).append(" + ").append(request.getCardB().trim());
        if (request.getTiming() != null && !request.getTiming().isBlank()) {
            queryBuilder.append(" during ").append(request.getTiming().trim());
        }
        if (request.getDetails() != null && !request.getDetails().isBlank()) {
            queryBuilder.append(" (").append(request.getDetails().trim()).append(")");
        }
        return askJudge(AskJudgeRequest.builder().question(queryBuilder.toString()).build());
    }

    @Override
    @Cacheable(value = "cr_sections", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<SectionSummaryResponse> getCrSections() {
        List<Object[]> rawSections = comprehensiveRuleRepository.findDistinctSections();
        Map<Integer, SectionSummaryResponse> sectionMap = new LinkedHashMap<>();
        for (Object[] row : rawSections) {
            Integer secNum = (Integer) row[0];
            String secTitle = (String) row[1];
            if (secNum != null && !sectionMap.containsKey(secNum)) {
                List<Object[]> rawChapters = comprehensiveRuleRepository.findDistinctChaptersBySection(secNum);
                List<ChapterSummaryResponse> chapters = new ArrayList<>();
                Set<String> seenChapters = new HashSet<>();
                for (Object[] chRow : rawChapters) {
                    String chNum = (String) chRow[0];
                    String chTitle = (String) chRow[1];
                    if (chNum != null && seenChapters.add(chNum)) {
                        chapters.add(ChapterSummaryResponse.builder()
                                .chapterNumber(chNum)
                                .chapterTitle(chTitle)
                                .build());
                    }
                }
                sectionMap.put(secNum, SectionSummaryResponse.builder()
                        .sectionNumber(secNum)
                        .sectionTitle(secTitle)
                        .chapters(chapters)
                        .build());
            }
        }
        return new ArrayList<>(sectionMap.values());
    }

    @Override
    public List<ComprehensiveRuleResponse> getCrRulesByChapter(String chapterNumber) {
        return comprehensiveRuleRepository.findByChapterNumberOrderByRuleNumberAsc(chapterNumber.trim())
                .stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Override
    public ComprehensiveRuleResponse getCrRule(String ruleNumber) {
        ComprehensiveRule rule = comprehensiveRuleRepository.findByRuleNumberIgnoreCase(ruleNumber.trim())
                .orElseThrow(() -> new NotFoundException("Comprehensive Rule not found: " + ruleNumber));
        return toRuleResponse(rule);
    }

    @Override
    public Page<ComprehensiveRuleResponse> searchCrRules(String query, int page, int size) {
        String cleanQuery = (query == null) ? "" : query.trim();
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 50));
        return comprehensiveRuleRepository.searchRules(cleanQuery, pageRequest)
                .map(this::toRuleResponse);
    }

    @Override
    public Page<RuleGlossaryResponse> searchGlossary(String query, int page, int size) {
        String cleanQuery = (query == null) ? "" : query.trim();
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 50));
        Page<RuleGlossary> rawPage;
        if (cleanQuery.isBlank()) {
            rawPage = ruleGlossaryRepository.findAllByOrderByTermAsc(pageRequest);
        } else {
            rawPage = ruleGlossaryRepository.searchGlossary(cleanQuery, pageRequest);
        }
        return rawPage.map(g -> RuleGlossaryResponse.builder()
                .term(g.getTerm())
                .definition(g.getDefinition())
                .seeRule(g.getSeeRule())
                .isObsolete(g.getIsObsolete())
                .build());
    }

    private ComprehensiveRuleResponse toRuleResponse(ComprehensiveRule entity) {
        List<String> crossRefs = Collections.emptyList();
        if (entity.getCrossReferences() != null && !entity.getCrossReferences().isBlank()) {
            crossRefs = List.of(entity.getCrossReferences().split(",\\s*"));
        }
        return ComprehensiveRuleResponse.builder()
                .ruleNumber(entity.getRuleNumber())
                .chapterNumber(entity.getChapterNumber())
                .chapterTitle(entity.getChapterTitle())
                .sectionNumber(entity.getSectionNumber())
                .sectionTitle(entity.getSectionTitle())
                .ruleText(entity.getRuleText())
                .examplesText(entity.getExamplesText())
                .crossReferences(crossRefs)
                .build();
    }

    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.nameUUIDFromBytes(input.getBytes(StandardCharsets.UTF_8)).toString();
        }
    }

    private record RetrievedCardContext(
            String name,
            String typeLine,
            String manaCost,
            String oracleText,
            List<String> rulings
    ) {
    }
}
