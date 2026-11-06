import React, { memo, useState } from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

export type ManaPipsProps = {
  manaCost?: string;
  size?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

const MANA_FALLBACK_COLORS: Record<string, { bg: string; text: string }> = {
  W: { bg: '#F8E7B9', text: '#78350F' },
  U: { bg: '#0284C7', text: '#FFFFFF' },
  B: { bg: '#1E293B', text: '#F8FAFC' },
  R: { bg: '#DC2626', text: '#FFFFFF' },
  G: { bg: '#16A34A', text: '#FFFFFF' },
  C: { bg: '#64748B', text: '#F8FAFC' },
  T: { bg: '#475569', text: '#F8FAFC' },
  Q: { bg: '#475569', text: '#F8FAFC' },
};

function parseManaSymbols(manaCost?: string): string[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

function SingleManaPip({ symbol, size }: { symbol: string; size: number }) {
  const [hasError, setHasError] = useState(false);

  const cleanSym = symbol.replace('/', '').toUpperCase();
  const fallback = MANA_FALLBACK_COLORS[cleanSym] || { bg: '#475569', text: '#F8FAFC' };

  if (hasError) {
    return (
      <View
        style={[
          styles.circleFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fallback.bg,
          },
        ]}
      >
        <Text style={[styles.circleText, { color: fallback.text, fontSize: Math.max(8, size * 0.58) }]}>
          {symbol}
        </Text>
      </View>
    );
  }

  const svgUri = `https://svgs.scryfall.io/card-symbols/${cleanSym}.svg`;

  return (
    <Image
      source={{ uri: svgUri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="contain"
      cachePolicy="memory-disk"
      onError={() => setHasError(true)}
    />
  );
}

function ManaPipsComponent({ manaCost, size = 16, gap = 2, style }: ManaPipsProps) {
  const symbols = parseManaSymbols(manaCost);

  if (symbols.length === 0) return null;

  return (
    <View style={[styles.row, { gap }, style]}>
      {symbols.map((sym, idx) => (
        <SingleManaPip key={`${sym}-${idx}`} symbol={sym} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontWeight: '800',
    textAlign: 'center',
  },
});

export const ManaPips = memo(ManaPipsComponent);
