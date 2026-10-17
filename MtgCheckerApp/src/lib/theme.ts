import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Soft, low-intensity MTG-inspired palettes — dark bases to reduce eye strain. */
export type ThemeId = 'default' | 'sultai' | 'boros' | 'izzet';

export type AppPalette = {
  id: ThemeId;
  label: string;
  description: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  accentContrast: string;
  danger: string;
  success: string;
  tabInactive: string;
};

export const THEME_OPTIONS: AppPalette[] = [
  {
    id: 'default',
    label: 'Night Gold',
    description: 'Warm muted amber on near-black — easy on the eyes.',
    background: '#0B0B0C',
    surface: '#171718',
    surfaceElevated: '#1F1F21',
    border: '#2A2A2D',
    text: '#EDEDED',
    textSecondary: '#A8A8AD',
    textMuted: '#6F6F74',
    accent: '#C9A66B',
    accentMuted: '#8F7649',
    accentContrast: '#14120E',
    danger: '#B57A7A',
    success: '#7A9B84',
    tabInactive: '#7A7A80',
  },
  {
    id: 'sultai',
    label: 'Sultai',
    description: 'Soft teal & slate over deep forest black — not neon green/blue.',
    background: '#0A0F0E',
    surface: '#121A18',
    surfaceElevated: '#1A2421',
    border: '#24302C',
    text: '#E4ECE8',
    textSecondary: '#9BB0A8',
    textMuted: '#6A7C75',
    accent: '#6B9B8A',
    accentMuted: '#4F7467',
    accentContrast: '#0C1210',
    danger: '#A87E7E',
    success: '#7FA88F',
    tabInactive: '#6E7F78',
  },
  {
    id: 'boros',
    label: 'Boros',
    description: 'Dusty cream & brick on charcoal — never pure red.',
    background: '#100E0D',
    surface: '#1A1614',
    surfaceElevated: '#231E1B',
    border: '#322B27',
    text: '#F0E8E0',
    textSecondary: '#B5A79C',
    textMuted: '#7D726A',
    accent: '#C4A484',
    accentMuted: '#8F735C',
    accentContrast: '#14110E',
    danger: '#B88A7E',
    success: '#8FA882',
    tabInactive: '#85786E',
  },
  {
    id: 'izzet',
    label: 'Izzet',
    description: 'Steel blue & soft copper on slate — muted, not electric.',
    background: '#0C0E12',
    surface: '#141820',
    surfaceElevated: '#1B212B',
    border: '#2A3340',
    text: '#E6EAF0',
    textSecondary: '#A0AAB8',
    textMuted: '#6C7686',
    accent: '#7A8FA8',
    accentMuted: '#56687C',
    accentContrast: '#0D1015',
    danger: '#A8847A',
    success: '#7A9B8C',
    tabInactive: '#6E7888',
  },
];

export const themeById = (id: ThemeId): AppPalette =>
  THEME_OPTIONS.find((t) => t.id === id) ?? THEME_OPTIONS[0];

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, lineHeight: 34 } satisfies TextStyle,
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, lineHeight: 28 } satisfies TextStyle,
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 24 } satisfies TextStyle,
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } satisfies TextStyle,
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 } satisfies TextStyle,
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 } satisfies TextStyle,
  button: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 } satisfies TextStyle,
};

export const nativeDriver = Platform.OS !== 'web';

export function shadowStyle(color = 'rgba(0,0,0,0.35)'): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle;
}
