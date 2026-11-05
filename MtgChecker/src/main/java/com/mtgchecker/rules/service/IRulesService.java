package com.mtgchecker.rules.service;

import com.mtgchecker.rules.dto.request.AskJudgeRequest;
import com.mtgchecker.rules.dto.request.CardInteractionRequest;
import com.mtgchecker.rules.dto.response.CheatSheetResponse;
import com.mtgchecker.rules.dto.response.ComprehensiveRuleResponse;
import com.mtgchecker.rules.dto.response.FormatRuleResponse;
import com.mtgchecker.rules.dto.response.JudgeVerdictResponse;
import com.mtgchecker.rules.dto.response.RuleGlossaryResponse;
import com.mtgchecker.rules.dto.response.SectionSummaryResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IRulesService {

    JudgeVerdictResponse askJudge(AskJudgeRequest request);

    List<CheatSheetResponse> getCheatSheets();

    List<JudgeVerdictResponse> getQuickDisputes();

    List<FormatRuleResponse> getFormatRules();

    JudgeVerdictResponse analyzeInteraction(CardInteractionRequest request);

    List<SectionSummaryResponse> getCrSections();

    List<ComprehensiveRuleResponse> getCrRulesByChapter(String chapterNumber);

    ComprehensiveRuleResponse getCrRule(String ruleNumber);

    Page<ComprehensiveRuleResponse> searchCrRules(String query, int page, int size);

    Page<RuleGlossaryResponse> searchGlossary(String query, int page, int size);
}
