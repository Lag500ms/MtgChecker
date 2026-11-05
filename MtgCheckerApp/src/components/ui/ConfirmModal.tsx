import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: keyof typeof Feather.glyphMap;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  icon = 'alert-triangle',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(201, 166, 107, 0.15)',
              },
            ]}
          >
            <Feather
              name={icon}
              size={24}
              color={isDestructive ? theme.danger : theme.accent}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {title}
          </Text>

          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.btn, styles.cancelBtn, { borderColor: theme.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.btn,
                styles.confirmBtn,
                {
                  backgroundColor: isDestructive ? theme.danger : theme.accent,
                },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.confirmBtnText,
                  { color: isDestructive ? '#FFFFFF' : '#0D0E12' },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    ...typography.button,
    fontSize: 13,
  },
  confirmBtn: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    ...typography.button,
    fontSize: 13,
  },
});
