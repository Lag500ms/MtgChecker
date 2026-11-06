import React, { memo, useState } from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

export type SetRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus' | string;

export const SET_RARITY_COLORS: Record<string, string> = {
  common: '#94A3B8',
  uncommon: '#38BDF8',
  rare: '#FACC15',
  mythic: '#FB923C',
  special: '#C084FC',
  bonus: '#C084FC',
};

export type SetSymbolProps = {
  setCode?: string;
  rarity?: SetRarity;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showFallbackText?: boolean;
};

function SetSymbolComponent({
  setCode,
  rarity = 'common',
  size = 16,
  style,
  showFallbackText = true,
}: SetSymbolProps) {
  const [hasError, setHasError] = useState(false);

  if (!setCode) return null;

  const cleanCode = setCode.trim().toLowerCase();
  const rarityKey = (rarity || 'common').toLowerCase();
  const tintColor = SET_RARITY_COLORS[rarityKey] || SET_RARITY_COLORS.common;

  if (hasError) {
    if (!showFallbackText) return null;
    return (
      <View
        style={[
          styles.fallbackBadge,
          {
            minWidth: size * 1.4,
            height: size,
            borderColor: tintColor,
            backgroundColor: tintColor + '18',
          },
          style,
        ]}
      >
        <Text style={[styles.fallbackText, { color: tintColor, fontSize: Math.max(9, size * 0.6) }]}>
          {cleanCode.toUpperCase()}
        </Text>
      </View>
    );
  }

  const svgUri = `https://svgs.scryfall.io/sets/${cleanCode}.svg`;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: svgUri }}
        style={{ width: size, height: size }}
        contentFit="contain"
        tintColor={tintColor}
        cachePolicy="memory-disk"
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackBadge: {
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export const SetSymbol = memo(SetSymbolComponent);
