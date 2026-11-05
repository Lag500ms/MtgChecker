package com.mtgchecker.rules.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.mtgchecker.rules.entity.ComprehensiveRule;
import com.mtgchecker.rules.entity.RuleGlossary;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.BufferedReader;
import java.io.File;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class ComprehensiveRulesParser {

    private static final Pattern SECTION_PATTERN = Pattern.compile("^([1-9])\\.\\s+(.+)$");
    private static final Pattern CHAPTER_PATTERN = Pattern.compile("^(\\d{3})\\.\\s+(.+)$");
    private static final Pattern RULE_PATTERN = Pattern.compile("^(\\d{3}\\.\\d+[a-z]?)\\.?\\s+(.+)$");
    private static final Pattern CROSS_REF_PATTERN = Pattern.compile("(?i)rule\\s+(\\d{3}(?:\\.\\d+[a-z]?)?)");

    public static class ParseResult {
        public List<ComprehensiveRule> rules = new ArrayList<>();
        public List<RuleGlossary> glossary = new ArrayList<>();
    }

    public static ParseResult parsePdf(File pdfFile) throws Exception {
        ParseResult result = new ParseResult();
        String fullText;

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            fullText = stripper.getText(document);
        }

        Pattern glossaryHeader = Pattern.compile("(?m)^Glossary\\s*$");
        Matcher gm = glossaryHeader.matcher(fullText);
        int glossaryIndex = -1;
        /* Skip table of contents mention of Glossary if any */
        while (gm.find()) {
            if (gm.start() > 10000) {
                glossaryIndex = gm.start();
                break;
            }
        }
        log.debug("Found glossaryIndex: {}", glossaryIndex);

        String rulesPart;
        String glossaryPart = "";
        if (glossaryIndex != -1) {
            rulesPart = fullText.substring(0, glossaryIndex);
            Pattern creditsHeader = Pattern.compile("(?m)^Credits\\s*$");
            Matcher cm = creditsHeader.matcher(fullText);
            int creditsIndex = -1;
            while (cm.find()) {
                if (cm.start() > glossaryIndex) {
                    creditsIndex = cm.start();
                    break;
                }
            }
            if (creditsIndex != -1) {
                glossaryPart = fullText.substring(glossaryIndex, creditsIndex);
            } else {
                glossaryPart = fullText.substring(glossaryIndex);
            }
        } else {
            rulesPart = fullText;
        }

        log.debug("Glossary part length: {}", glossaryPart.length());

        result.rules = parseRulesPart(rulesPart);
        if (!glossaryPart.isBlank()) {
            result.glossary = parseGlossaryPart(glossaryPart);
        }

        return result;
    }

    private static List<ComprehensiveRule> parseRulesPart(String text) throws Exception {
        Map<String, ComprehensiveRule> ruleMap = new LinkedHashMap<>();

        int currentSectionNumber = 1;
        String currentSectionTitle = "Game Concepts";
        String currentChapterNumber = "100";
        String currentChapterTitle = "General";

        ComprehensiveRule currentRule = null;
        StringBuilder currentText = new StringBuilder();
        StringBuilder currentExamples = new StringBuilder();
        boolean inExample = false;

        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }

                if (line.equals("Contents") || line.startsWith("Magic: The Gathering Comprehensive Rules") || line.startsWith("These rules are effective as of")) {
                    continue;
                }

                Matcher sectionMatcher = SECTION_PATTERN.matcher(line);
                if (sectionMatcher.matches()) {
                    currentSectionNumber = Integer.parseInt(sectionMatcher.group(1));
                    currentSectionTitle = sectionMatcher.group(2).trim();
                    continue;
                }

                Matcher chapterMatcher = CHAPTER_PATTERN.matcher(line);
                if (chapterMatcher.matches()) {
                    currentChapterNumber = chapterMatcher.group(1);
                    currentChapterTitle = chapterMatcher.group(2).trim();
                    continue;
                }

                Matcher ruleMatcher = RULE_PATTERN.matcher(line);
                if (ruleMatcher.matches()) {
                    if (currentRule != null) {
                        currentRule.setRuleText(currentText.toString().trim());
                        if (currentExamples.length() > 0) {
                            currentRule.setExamplesText(currentExamples.toString().trim());
                        }
                        currentRule.setCrossReferences(extractCrossReferences(currentRule.getRuleText()));
                        ruleMap.put(currentRule.getRuleNumber(), currentRule);
                    }

                    String ruleNum = ruleMatcher.group(1);
                    String ruleBody = ruleMatcher.group(2).trim();

                    currentRule = ComprehensiveRule.builder()
                            .ruleNumber(ruleNum)
                            .chapterNumber(currentChapterNumber)
                            .chapterTitle(currentChapterTitle)
                            .sectionNumber(currentSectionNumber)
                            .sectionTitle(currentSectionTitle)
                            .build();

                    currentText = new StringBuilder(ruleBody);
                    currentExamples = new StringBuilder();
                    inExample = false;
                    continue;
                }

                if (currentRule != null) {
                    if (line.startsWith("Example:") || line.startsWith("Example 1:") || line.startsWith("Example 2:")) {
                        inExample = true;
                        if (currentExamples.length() > 0) {
                            currentExamples.append("\n\n");
                        }
                        currentExamples.append(line);
                    } else if (inExample) {
                        currentExamples.append(" ").append(line);
                    } else {
                        currentText.append(" ").append(line);
                    }
                }
            }

            if (currentRule != null) {
                currentRule.setRuleText(currentText.toString().trim());
                if (currentExamples.length() > 0) {
                    currentRule.setExamplesText(currentExamples.toString().trim());
                }
                currentRule.setCrossReferences(extractCrossReferences(currentRule.getRuleText()));
                ruleMap.put(currentRule.getRuleNumber(), currentRule);
            }
        }

        return new ArrayList<>(ruleMap.values());
    }

    private static List<RuleGlossary> parseGlossaryPart(String text) throws Exception {
        List<RuleGlossary> list = new ArrayList<>();
        String currentTerm = null;
        StringBuilder currentDef = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.equalsIgnoreCase("Glossary")) {
                    continue;
                }

                boolean isTermCandidate = isGlossaryTerm(line, currentDef);
                if (isTermCandidate && currentTerm != null && currentDef.length() > 0) {
                    String def = currentDef.toString().trim();
                    list.add(RuleGlossary.builder()
                            .term(currentTerm)
                            .definition(def)
                            .seeRule(extractSingleSeeRule(def))
                            .isObsolete(currentTerm.toLowerCase().contains("obsolete"))
                            .build());

                    currentTerm = line;
                    currentDef = new StringBuilder();
                } else if (currentTerm == null && isTermCandidate) {
                    currentTerm = line;
                    currentDef = new StringBuilder();
                } else {
                    if (currentDef.length() > 0) {
                        currentDef.append(" ");
                    }
                    currentDef.append(line);
                }
            }

            if (currentTerm != null && currentDef.length() > 0) {
                String def = currentDef.toString().trim();
                list.add(RuleGlossary.builder()
                        .term(currentTerm)
                        .definition(def)
                        .seeRule(extractSingleSeeRule(def))
                        .isObsolete(currentTerm.toLowerCase().contains("obsolete"))
                        .build());
            }
        }

        return list;
    }

    private static boolean isGlossaryTerm(String line, StringBuilder currentDef) {
        if (line == null || line.isBlank() || line.length() > 50) {
            return false;
        }
        if (currentDef != null && currentDef.length() > 0) {
            String defSoFar = currentDef.toString().trim();
            if (!defSoFar.endsWith(".") && !defSoFar.endsWith(".”") && !defSoFar.endsWith("\".") && !defSoFar.endsWith(".\"")) {
                return false;
            }
        }
        char firstChar = line.charAt(0);
        if (!Character.isUpperCase(firstChar)) {
            return false;
        }
        char lastChar = line.charAt(line.length() - 1);
        if (lastChar == '.' || lastChar == ',' || lastChar == ':' || lastChar == ';' || lastChar == '”' || lastChar == '"' || lastChar == '-') {
            return false;
        }
        String lower = line.toLowerCase();
        if (lower.startsWith("see ") || lower.startsWith("rule ") || lower.startsWith("rules ") || lower.startsWith("section ")
                || lower.startsWith("a ") || lower.startsWith("an ") || lower.startsWith("the ")
                || lower.startsWith("if ") || lower.startsWith("when ") || lower.startsWith("whenever ")
                || lower.startsWith("this ") || lower.startsWith("these ") || lower.startsWith("each ")
                || lower.startsWith("any ") || lower.startsWith("some ") || lower.startsWith("all ")
                || lower.startsWith("to ") || lower.startsWith("for ") || lower.startsWith("with ")) {
            return false;
        }
        return true;
    }

    private static String extractCrossReferences(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = CROSS_REF_PATTERN.matcher(text);
        List<String> refs = new ArrayList<>();
        while (matcher.find()) {
            String r = matcher.group(1);
            if (!refs.contains(r)) {
                refs.add(r);
            }
        }
        return refs.isEmpty() ? null : String.join(", ", refs);
    }

    private static String extractSingleSeeRule(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = CROSS_REF_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    public static void main(String[] args) throws Exception {
        File pdfFile;
        if (args.length > 0) {
            pdfFile = new File(args[0]);
        } else {
            pdfFile = new File("C:\\Users\\LY THE VINH\\.gemini\\antigravity\\brain\\f6aa0111-2701-42e0-8416-2353e2a9151c\\.user_uploaded\\media_1792999543054_a4d1abdb.pdf");
        }

        if (!pdfFile.exists()) {
            log.error("File not found: {}", pdfFile.getAbsolutePath());
            System.exit(1);
        }

        log.info("Parsing PDF: {}", pdfFile.getAbsolutePath());
        ParseResult result = parsePdf(pdfFile);
        log.info("Parsed rules count: {}", result.rules.size());
        log.info("Parsed glossary count: {}", result.glossary.size());

        ObjectMapper mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        File outDir = new File("src/main/resources/rules");
        outDir.mkdirs();

        File rulesOut = new File(outDir, "cr_rules.json");
        mapper.writeValue(rulesOut, result.rules);
        log.info("Saved rules to: {} ({} bytes)", rulesOut.getAbsolutePath(), rulesOut.length());

        File glossaryOut = new File(outDir, "cr_glossary.json");
        mapper.writeValue(glossaryOut, result.glossary);
        log.info("Saved glossary to: {} ({} bytes)", glossaryOut.getAbsolutePath(), glossaryOut.length());
    }
}
