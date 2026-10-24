import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import type { Card } from '@/features/cards/types/card';
import { pickCardImageUri } from '@/features/cards/utils/cardImage';

type CardArtProps = {
  card: Card;
  size?: 'small' | 'normal';
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
};

export function CardArt({ card, size = 'normal', style, contentFit = 'cover' }: CardArtProps) {
  const [failed, setFailed] = useState(false);
  const uri = pickCardImageUri(card, size);

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, style]}>
        <Feather name="image" size={size === 'small' ? 14 : 28} color="#6B8A8C" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#0B2426',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
