import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, shadowStyle, spacing, typography } from '@/lib/theme';

export type ToastType = 'success' | 'error' | 'info';

export type ToastOptions = {
  type?: ToastType;
  title?: string;
  duration?: number;
};

type ToastContextType = {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  hide: () => void;
};

type ToastState = {
  visible: boolean;
  message: string;
  title?: string;
  type: ToastType;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetState = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withTiming(-100, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(resetState)();
    });
  }, [opacity, resetState, translateY]);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const type = options?.type ?? 'success';
      const duration = options?.duration ?? 2200;

      setToast({
        visible: true,
        message,
        title: options?.title,
        type,
      });

      translateY.value = -100;
      opacity.value = 0;

      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 140,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 180 });

      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [hide, opacity, translateY]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      show(message, { type: 'success', title });
    },
    [show]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      show(message, { type: 'error', title, duration: 3200 });
    },
    [show]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      show(message, { type: 'info', title });
    },
    [show]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const iconName: keyof typeof Feather.glyphMap =
    toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'alert-circle' : 'info';

  const typeAccentColor =
    toast.type === 'success'
      ? theme.success
      : toast.type === 'error'
      ? theme.danger
      : theme.accent;

  const contextValue = useMemo(
    () => ({
      show,
      success,
      error,
      info,
      hide,
    }),
    [error, hide, info, show, success]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast.visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            { top: Math.max(insets.top, spacing.md) + spacing.xs },
            animatedStyle,
          ]}
        >
          <Pressable
            onPress={hide}
            style={[
              styles.pill,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: typeAccentColor,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${typeAccentColor}22` },
              ]}
            >
              <Feather name={iconName} size={18} color={typeAccentColor} />
            </View>
            <View style={styles.textWrap}>
              {toast.title ? (
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {toast.title}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.message,
                  { color: toast.title ? theme.textSecondary : theme.text },
                ]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
            </View>
            <Feather name="x" size={14} color={theme.textMuted} style={styles.closeIcon} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 99999,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.2,
    ...shadowStyle('rgba(0,0,0,0.45)'),
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 1,
  },
  message: {
    ...typography.bodySmall,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeIcon: {
    marginLeft: spacing.xs,
  },
});
