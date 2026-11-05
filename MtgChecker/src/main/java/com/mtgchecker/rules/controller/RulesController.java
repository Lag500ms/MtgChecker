package com.mtgchecker.rules.controller;

import com.mtgchecker.rules.dto.request.AskJudgeRequest;
import com.mtgchecker.rules.dto.request.CardInteractionRequest;
import com.mtgchecker.rules.dto.response.CheatSheetResponse;
import com.mtgchecker.rules.dto.response.ComprehensiveRuleResponse;
import com.mtgchecker.rules.dto.response.FormatRuleResponse;
import com.mtgchecker.rules.dto.response.JudgeVerdictResponse;
import com.mtgchecker.rules.dto.response.RuleGlossaryResponse;
import com.mtgchecker.rules.dto.response.SectionSummaryResponse;
import com.mtgchecker.rules.service.IRulesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
@Tag(name = "Rules", description = "MTG Rules & Judge AI Assistant via RAG + LLM")
public class RulesController {

    private final IRulesService rulesService;

    @PostMapping("/ask")
    @Operation(summary = "Ask MTG Judge a rule dispute or card interaction using RAG + LLM")
    public ResponseEntity<JudgeVerdictResponse> askJudge(@Valid @RequestBody AskJudgeRequest request) {
        JudgeVerdictResponse response = rulesService.askJudge(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interact")
    @Operation(summary = "Analyze direct interaction between two cards at specific timing")
    public ResponseEntity<JudgeVerdictResponse> analyzeInteraction(@Valid @RequestBody CardInteractionRequest request) {
        JudgeVerdictResponse response = rulesService.analyzeInteraction(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/formats")
    @Operation(summary = "Get official format rules crash course (Commander, Standard, Modern, 2HG)")
    public ResponseEntity<List<FormatRuleResponse>> getFormatRules() {
        return ResponseEntity.ok(rulesService.getFormatRules());
    }

    @GetMapping("/cheat-sheets")
    @Operation(summary = "Get all MTG comprehensive rules cheat sheets")
    public ResponseEntity<List<CheatSheetResponse>> getCheatSheets() {
        return ResponseEntity.ok(rulesService.getCheatSheets());
    }

    @GetMapping("/disputes")
    @Operation(summary = "Get curated popular quick tournament disputes and judge verdicts")
    public ResponseEntity<List<JudgeVerdictResponse>> getQuickDisputes() {
        return ResponseEntity.ok(rulesService.getQuickDisputes());
    }

    @GetMapping("/cr/sections")
    @Operation(summary = "Get all 9 Comprehensive Rules sections and their chapters")
    public ResponseEntity<List<SectionSummaryResponse>> getCrSections() {
        return ResponseEntity.ok(rulesService.getCrSections());
    }

    @GetMapping("/cr/chapters/{chapterNumber}")
    @Operation(summary = "Get all Comprehensive Rules in a specific chapter")
    public ResponseEntity<List<ComprehensiveRuleResponse>> getCrRulesByChapter(@PathVariable String chapterNumber) {
        return ResponseEntity.ok(rulesService.getCrRulesByChapter(chapterNumber));
    }

    @GetMapping("/cr/rules/{ruleNumber}")
    @Operation(summary = "Get a single Comprehensive Rule by rule number")
    public ResponseEntity<ComprehensiveRuleResponse> getCrRule(@PathVariable String ruleNumber) {
        return ResponseEntity.ok(rulesService.getCrRule(ruleNumber));
    }

    @GetMapping("/cr/search")
    @Operation(summary = "Full-text search Comprehensive Rules by query text or rule number")
    public ResponseEntity<Page<ComprehensiveRuleResponse>> searchCrRules(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(rulesService.searchCrRules(q, page, size));
    }

    @GetMapping("/cr/glossary")
    @Operation(summary = "Search or browse MTG Comprehensive Rules Glossary terms")
    public ResponseEntity<Page<RuleGlossaryResponse>> searchGlossary(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "30") int size
    ) {
        return ResponseEntity.ok(rulesService.searchGlossary(q, page, size));
    }
}
