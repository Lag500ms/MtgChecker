package com.mtgchecker.cards.service.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MtgCollectorParser {

    public static final Set<String> LANGUAGE_CODES = Set.of(
            "EN", "DE", "FR", "ES", "IT", "PT", "JP", "KO", "RU", "ZH"
    );

    private static final Map<Character, List<Character>> OCR_CONFUSIONS = Map.ofEntries(
            Map.entry('B', List.of('E', '8', 'G')),
            Map.entry('E', List.of('B', 'F')),
            Map.entry('F', List.of('E')),
            Map.entry('G', List.of('B', '6')),
            Map.entry('8', List.of('B')),
            Map.entry('6', List.of('G')),
            Map.entry('O', List.of('0', 'D')),
            Map.entry('Q', List.of('O')),
            Map.entry('D', List.of('O', '0')),
            Map.entry('0', List.of('O', 'D')),
            Map.entry('I', List.of('1', 'L')),
            Map.entry('L', List.of('1', 'I')),
            Map.entry('1', List.of('I', 'L')),
            Map.entry('S', List.of('5')),
            Map.entry('5', List.of('S')),
            Map.entry('Z', List.of('2')),
            Map.entry('2', List.of('Z'))
    );

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[A-Z0-9]+");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(?<number>\\d{1,5})(?<suffix>[A-Za-z])?(?:[\\s\\t]*(?<star>[★*]))?");
    private static final Pattern RARITY_PATTERN = Pattern.compile("\\s[CURMBLST]\\s");
    private static final Pattern CARD_NUM_PATTERN = Pattern.compile("\\b\\d{1,5}\\b");
    private static final Pattern LANG_PATTERN = Pattern.compile("\\b(EN|DE|FR|ES|IT|PT|JP|KO|RU|ZH)\\b");

    public record SetMatch(String code, int index, int length, String source) {}

    public record ParsedCollectorInfo(String setCode, String collectorNumber, String language, int score) {}

    public static String cleanOCRText(String rawText) {
        if (rawText == null || rawText.isBlank()) return "";

        String cleaned = rawText.trim().replaceAll("\\s+", " ");
        cleaned = cleaned.replaceAll("(?i)^([CUMNR])\\1+", "$1");
        cleaned = cleaned.replaceAll("(?i)([CUMNR])\\1+", "$1");
        cleaned = cleaned.replaceAll("(\\d)\\1{3,}", "$1");
        cleaned = cleaned.replaceAll("[|\\\\]", "1");
        cleaned = cleaned.replace('O', '0');
        cleaned = cleaned.replaceAll("[Il]", "1");
        cleaned = cleaned.replace('S', '5');
        cleaned = cleaned.replaceAll("[^0-9A-Za-z\\s/*★•·-]", "");
        cleaned = cleaned.trim().replaceAll("\\s+", " ");

        return cleaned.toUpperCase();
    }

    public static int scoreCollectorNumberResult(String text, Set<String> knownSetCodes) {
        if (text == null || text.isBlank()) return 0;
        int score = 0;

        SetMatch match = findSetCode(text.toUpperCase(), knownSetCodes);
        if (match != null) {
            score += switch (match.source()) {
                case "layout" -> 50;
                case "repaired" -> 45;
                case "token" -> 40;
                default -> 20;
            };
        }

        if (RARITY_PATTERN.matcher(text).find()) score += 15;
        if (CARD_NUM_PATTERN.matcher(text).find()) score += 30;
        if (LANG_PATTERN.matcher(text).find()) score += 10;
        if (text.length() > 10) score += 5;

        return score;
    }

    public static SetMatch findSetCode(String text, Set<String> knownSetCodes) {
        if (text == null || knownSetCodes == null || knownSetCodes.isEmpty()) return null;

        List<TokenInfo> tokens = new ArrayList<>();
        Matcher tm = TOKEN_PATTERN.matcher(text);
        while (tm.find()) {
            tokens.add(new TokenInfo(tm.group(), tm.start()));
        }

        List<TokenInfo> beforeLanguage = new ArrayList<>();
        for (int i = 0; i < tokens.size(); i++) {
            if (i + 1 < tokens.size() && LANGUAGE_CODES.contains(tokens.get(i + 1).value())) {
                beforeLanguage.add(tokens.get(i));
            }
        }

        for (TokenInfo t : beforeLanguage) {
            if (knownSetCodes.contains(t.value())) {
                return new SetMatch(t.value(), t.index(), t.value().length(), "layout");
            }
        }

        for (TokenInfo t : beforeLanguage) {
            if (t.value().length() < 3 || t.value().matches("^\\d+$")) continue;
            for (String variant : confusionVariants(t.value(), 2)) {
                if (knownSetCodes.contains(variant)) {
                    return new SetMatch(variant, t.index(), t.value().length(), "repaired");
                }
            }
        }

        for (TokenInfo t : tokens) {
            if (!LANGUAGE_CODES.contains(t.value()) && knownSetCodes.contains(t.value())) {
                return new SetMatch(t.value(), t.index(), t.value().length(), "token");
            }
        }

        for (String code : knownSetCodes) {
            if (code.length() >= 3 && text.contains(code)) {
                int idx = text.indexOf(code);
                return new SetMatch(code, idx, code.length(), "substring");
            }
        }

        return null;
    }

    public static List<String> confusionVariants(String token, int maxSubstitutions) {
        Set<String> seen = new LinkedHashSet<>();
        seen.add(token);
        List<String> current = List.of(token);

        for (int round = 0; round < maxSubstitutions; round++) {
            List<String> next = new ArrayList<>();
            for (String variant : current) {
                for (int i = 0; i < variant.length(); i++) {
                    char ch = variant.charAt(i);
                    List<Character> replacements = OCR_CONFUSIONS.get(ch);
                    if (replacements != null) {
                        for (char r : replacements) {
                            String candidate = variant.substring(0, i) + r + variant.substring(i + 1);
                            if (seen.add(candidate)) {
                                next.add(candidate);
                            }
                        }
                    }
                }
            }
            current = next;
        }

        List<String> variants = new ArrayList<>(seen);
        if (!variants.isEmpty()) {
            variants.remove(0);
        }
        return variants;
    }

    public static String findCollectorNumber(String text) {
        if (text == null || text.isBlank()) return null;

        Matcher m = NUMBER_PATTERN.matcher(text);
        String bestNumber = null;
        String bestSuffix = null;
        String bestStar = null;

        while (m.find()) {
            String num = m.group("number");
            if (bestNumber == null || num.length() > bestNumber.length()) {
                bestNumber = num;
                bestSuffix = m.group("suffix");
                bestStar = m.group("star");
            }
        }

        if (bestNumber == null) return null;

        String normalized = bestNumber.replaceFirst("^0+(?=\\d)", "");
        if (bestSuffix != null) {
            normalized += bestSuffix.toLowerCase();
        }
        if (bestStar != null) {
            normalized += "★";
        }
        return normalized;
    }

    public static ParsedCollectorInfo parseCollectorNumber(String collectorInfo, Set<String> knownSetCodes) {
        if (collectorInfo == null || collectorInfo.isBlank()) return null;
        String cleaned = collectorInfo.trim().toUpperCase();

        SetMatch setMatch = findSetCode(cleaned, knownSetCodes);
        String setCode = null;
        List<String> numberSearchTexts = new ArrayList<>();

        if (setMatch != null) {
            setCode = setMatch.code();
            String before = cleaned.substring(0, setMatch.index());
            String after = cleaned.substring(setMatch.index() + setMatch.length());
            numberSearchTexts.add(before);
            numberSearchTexts.add(before + "|" + after);
        } else {
            numberSearchTexts.add(cleaned);
        }

        String collectorNumber = null;
        for (String searchTarget : numberSearchTexts) {
            collectorNumber = findCollectorNumber(searchTarget);
            if (collectorNumber != null) break;
        }

        String language = null;
        Matcher lm = LANG_PATTERN.matcher(cleaned);
        if (lm.find()) {
            language = lm.group(1);
        }

        if (setCode != null && collectorNumber != null) {
            int score = scoreCollectorNumberResult(cleaned, knownSetCodes);
            return new ParsedCollectorInfo(setCode, collectorNumber, language, score);
        }

        return null;
    }

    public static String mapLanguageCode(String ocrLang) {
        if (ocrLang == null) return "en";
        return switch (ocrLang.toUpperCase()) {
            case "DE" -> "de";
            case "FR" -> "fr";
            case "ES" -> "es";
            case "IT" -> "it";
            case "PT" -> "pt";
            case "JP" -> "ja";
            case "KO" -> "ko";
            case "RU" -> "ru";
            case "ZH" -> "zhs";
            default -> "en";
        };
    }

    private record TokenInfo(String value, int index) {}
}
