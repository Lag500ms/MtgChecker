import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/apiClient';
import type { CheatSheetTopic } from '../data/cheatSheets';
import { CHEAT_SHEETS } from '../data/cheatSheets';
import type { JudgeVerdict } from '../data/quickJudgeDisputes';
import { QUICK_DISPUTES } from '../data/quickJudgeDisputes';
import type { FormatRule } from '../data/formats';
import { FORMAT_RULES } from '../data/formats';

const STORAGE_KEY_CHEAT_SHEETS = 'mtgchecker.rules.cheat_sheets';
const STORAGE_KEY_DISPUTES = 'mtgchecker.rules.disputes';
const STORAGE_KEY_FORMATS = 'mtgchecker.rules.formats';

export async function askJudgeAi(question: string): Promise<JudgeVerdict> {
  const response = await apiClient.post<JudgeVerdict>(
    '/rules/ask',
    { question },
    { timeout: 45000 }
  );
  return response.data;
}

export async function analyzeCardInteraction(
  cardA: string,
  cardB: string,
  timing?: string,
  details?: string
): Promise<JudgeVerdict> {
  const response = await apiClient.post<JudgeVerdict>(
    '/rules/interact',
    {
      cardA,
      cardB,
      timing,
      details,
    },
    { timeout: 45000 }
  );
  return response.data;
}

export async function fetchCheatSheets(): Promise<CheatSheetTopic[]> {
  try {
    const response = await apiClient.get<CheatSheetTopic[]>('/rules/cheat-sheets');
    if (Array.isArray(response.data) && response.data.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY_CHEAT_SHEETS, JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_CHEAT_SHEETS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return CHEAT_SHEETS;
      }
    }
  }
  return CHEAT_SHEETS;
}

export async function fetchQuickDisputes(): Promise<JudgeVerdict[]> {
  try {
    const response = await apiClient.get<JudgeVerdict[]>('/rules/disputes');
    if (Array.isArray(response.data) && response.data.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_DISPUTES);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return QUICK_DISPUTES;
      }
    }
  }
  return QUICK_DISPUTES;
}

export async function fetchFormatRules(): Promise<FormatRule[]> {
  try {
    const response = await apiClient.get<FormatRule[]>('/rules/formats');
    if (Array.isArray(response.data) && response.data.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY_FORMATS, JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_FORMATS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return FORMAT_RULES;
      }
    }
  }
  return FORMAT_RULES;
}

export async function getInitialCheatSheets(): Promise<CheatSheetTopic[]> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY_CHEAT_SHEETS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return CHEAT_SHEETS;
    }
  }
  return CHEAT_SHEETS;
}

export async function getInitialQuickDisputes(): Promise<JudgeVerdict[]> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY_DISPUTES);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return QUICK_DISPUTES;
    }
  }
  return QUICK_DISPUTES;
}

export async function getInitialFormatRules(): Promise<FormatRule[]> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY_FORMATS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return FORMAT_RULES;
    }
  }
  return FORMAT_RULES;
}

export interface ComprehensiveRule {
  ruleNumber: string;
  chapterNumber: string;
  chapterTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  ruleText: string;
  examplesText?: string | null;
  crossReferences?: string[];
}

export interface RuleGlossaryTerm {
  term: string;
  definition: string;
  seeRule?: string | null;
  isObsolete?: boolean;
}

export interface ChapterSummary {
  chapterNumber: string;
  chapterTitle: string;
}

export interface SectionSummary {
  sectionNumber: number;
  sectionTitle: string;
  chapters: ChapterSummary[];
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export async function fetchCrSections(): Promise<SectionSummary[]> {
  const response = await apiClient.get<SectionSummary[]>('/rules/cr/sections');
  return response.data;
}

export async function fetchCrRulesByChapter(chapterNumber: string): Promise<ComprehensiveRule[]> {
  const response = await apiClient.get<ComprehensiveRule[]>(`/rules/cr/chapters/${encodeURIComponent(chapterNumber)}`);
  return response.data;
}

export async function fetchCrRule(ruleNumber: string): Promise<ComprehensiveRule> {
  const response = await apiClient.get<ComprehensiveRule>(`/rules/cr/rules/${encodeURIComponent(ruleNumber)}`);
  return response.data;
}

export async function searchCrRules(query: string, page = 0, size = 20): Promise<SpringPage<ComprehensiveRule>> {
  const response = await apiClient.get<SpringPage<ComprehensiveRule>>('/rules/cr/search', {
    params: { q: query, page, size },
  });
  return response.data;
}

export async function searchGlossary(query: string, page = 0, size = 30): Promise<SpringPage<RuleGlossaryTerm>> {
  const response = await apiClient.get<SpringPage<RuleGlossaryTerm>>('/rules/cr/glossary', {
    params: { q: query, page, size },
  });
  return response.data;
}
