import React, { useEffect } from 'react';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CardArt } from '@/components/CardArt';
import type { Card } from '@/features/cards/types/card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.76, 320);
const CARD_HEIGHT = CARD_WIDTH * 1.396;

const FOIL_RAINBOW_IMG = require('../../assets/images/foil_rainbow.png');
const FOIL_ETCHED_IMG = require('../../assets/images/foil_etched.png');
const FOIL_GLARE_IMG = require('../../assets/images/foil_glare.png');

export type HoloFoilCardProps = {
  card: Card;
  finish?: 'nonfoil' | 'foil' | 'etched';
  size?: 'small' | 'normal';
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
  enableInteractive?: boolean;
};

export function HoloFoilCard({
  card,
  finish = 'nonfoil',
  size = 'normal',
  style,
  contentFit = 'contain',
  enableInteractive = true,
}: HoloFoilCardProps) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const isFoil = finish === 'foil' || finish === 'etched';

  useEffect(() => {
    if (!enableInteractive || !isFoil) {
      tiltX.value = 0;
      tiltY.value = 0;
      return;
    }

    tiltX.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000 }),
        withTiming(5, { duration: 2000 })
      ),
      -1,
      true
    );
    tiltY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2400 }),
        withTiming(-6, { duration: 2400 })
      ),
      -1,
      true
    );
  }, [enableInteractive, isFoil]);

  const panGesture = Gesture.Pan()
    .enabled(enableInteractive && isFoil)
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const maxDrag = 140;
      const normalizedX = Math.max(-1, Math.min(1, event.translationX / maxDrag));
      const normalizedY = Math.max(-1, Math.min(1, event.translationY / maxDrag));

      tiltX.value = withSpring(normalizedY * 18, { damping: 16, stiffness: 160 });
      tiltY.value = withSpring(-normalizedX * 20, { damping: 16, stiffness: 160 });
    })
    .onFinalize(() => {
      isDragging.value = false;
      tiltX.value = withSpring(0, { damping: 14, stiffness: 120 });
      tiltY.value = withSpring(0, { damping: 14, stiffness: 120 });
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (!isFoil) {
      return {};
    }
    return {
      transform: [
        { perspective: 900 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${tiltY.value}deg` },
        { scale: isDragging.value ? 1.04 : 1.0 },
      ],
    };
  });

  const sheenAnimatedStyle = useAnimatedStyle(() => {
    if (!isFoil) {
      return { opacity: 0 };
    }

    const translateX = interpolate(tiltY.value, [-20, 20], [-80, 80]);
    const translateY = interpolate(tiltX.value, [-18, 18], [-70, 70]);
    const opacity = interpolate(
      Math.abs(tiltX.value) + Math.abs(tiltY.value),
      [0, 6, 25],
      [0.65, 0.9, 1.0]
    );

    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  const glareAnimatedStyle = useAnimatedStyle(() => {
    if (!isFoil) {
      return { opacity: 0 };
    }

    const translateX = interpolate(tiltY.value, [-20, 20], [65, -65]);
    const translateY = interpolate(tiltX.value, [-18, 18], [65, -65]);
    const opacity = interpolate(
      Math.abs(tiltX.value) + Math.abs(tiltY.value),
      [0, 5, 25],
      [0.35, 0.65, 0.88]
    );

    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  if (!isFoil) {
    return <CardArt card={card} size={size} style={style as StyleProp<ImageStyle>} contentFit={contentFit} />;
  }

  const textureSource = finish === 'etched' ? FOIL_ETCHED_IMG : FOIL_RAINBOW_IMG;
  const flattened = StyleSheet.flatten(style) || {};
  const cardWidth = flattened.width || CARD_WIDTH;
  const cardHeight = flattened.height || CARD_HEIGHT;
  const cardRadius = flattened.borderRadius !== undefined ? flattened.borderRadius : 14;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.rootContainer, cardAnimatedStyle, style]}>
        <View
          style={[
            styles.cardFrame,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: cardRadius,
            },
          ]}
        >
          <CardArt card={card} size={size} style={styles.baseCardArt} contentFit={contentFit} />

          <Animated.View pointerEvents="none" style={[styles.overlayLayer, sheenAnimatedStyle]}>
            <Image
              source={textureSource}
              style={styles.textureFill}
              contentFit="cover"
              cachePolicy="memory"
            />
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.overlayLayer, glareAnimatedStyle]}>
            <Image
              source={FOIL_GLARE_IMG}
              style={styles.textureFill}
              contentFit="cover"
              cachePolicy="memory"
            />
          </Animated.View>

          <View
            pointerEvents="none"
            style={[styles.rimHighlight, { borderRadius: cardRadius }]}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  baseCardArt: {
    width: '100%',
    height: '100%',
  },
  overlayLayer: {
    position: 'absolute',
    top: '-35%',
    left: '-35%',
    width: '170%',
    height: '170%',
  },
  textureFill: {
    width: '100%',
    height: '100%',
  },
  rimHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
});
