export type PlayerThemeColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless';

export interface PlayerTheme {
  id: PlayerThemeColor;
  label: string;
  bg: string;
  border: string;
  accent: string;
}

export const PLAYER_THEMES: Record<PlayerThemeColor, PlayerTheme> = {
  white: {
    id: 'white',
    label: 'White',
    bg: '#1E232A',
    border: '#E2E8F0',
    accent: '#F8FAFC',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    bg: '#0F2537',
    border: '#38BDF8',
    accent: '#38BDF8',
  },
  black: {
    id: 'black',
    label: 'Black',
    bg: '#18181B',
    border: '#71717A',
    accent: '#A1A1AA',
  },
  red: {
    id: 'red',
    label: 'Red',
    bg: '#2C1517',
    border: '#F87171',
    accent: '#F87171',
  },
  green: {
    id: 'green',
    label: 'Green',
    bg: '#14281E',
    border: '#4ADE80',
    accent: '#4ADE80',
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    bg: '#272010',
    border: '#EAB308',
    accent: '#FACC15',
  },
  colorless: {
    id: 'colorless',
    label: 'Colorless',
    bg: '#1E293B',
    border: '#94A3B8',
    accent: '#CBD5E1',
  },
};

export interface PlayerState {
  id: string;
  name: string;
  life: number;
  poison: number;
  commanderTax: number;
  partnerCommanderTax: number;
  hasPartner: boolean;
  energy: number;
  experience: number;
  commanderDamageReceived: Record<string, number>;
  themeColor: PlayerThemeColor;
  isMonarch: boolean;
  hasInitiative: boolean;
}

export type PlayerCount = 2 | 3 | 4;

export type StartingLifeMode = 40 | 20 | 30;

export interface MatchHistoryEntry {
  id: string;
  timestamp: string;
  playerId: string;
  playerName: string;
  changeText: string;
  resultingLife: number;
}
