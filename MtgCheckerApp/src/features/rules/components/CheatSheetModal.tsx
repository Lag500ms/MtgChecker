import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CheatSheetTopic } from '../data/cheatSheets';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type CheatSheetModalProps = {
  topic: CheatSheetTopic | null;
  visible: boolean;
  onClose: () => void;
};

export function CheatSheetModal({ topic, visible, onClose }: CheatSheetModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [filterText, setFilterText] = useState('');

  const filteredSections = useMemo(() => {
    if (!topic) return [];
    if (!filterText.trim()) return topic.sections;

    const lower = filterText.toLowerCase().trim();
    return topic.sections
      .map((sec) => {
        const matchesHeading =
          sec.heading.toLowerCase().includes(lower) ||
          sec.description.toLowerCase().includes(lower);

        const matchingItems = sec.items?.filter(
          (item) =>
            item.term.toLowerCase().includes(lower) ||
            item.details.toLowerCase().includes(lower) ||
            (item.crCode && item.crCode.toLowerCase().includes(lower))
        );

        if (matchesHeading) {
          return sec;
        }

        if (matchingItems && matchingItems.length > 0) {
          return {
            ...sec,
            items: matchingItems,
          };
        }

        return null;
      })
      .filter((sec): sec is NonNullable<typeof sec> => sec !== null);
  }, [topic, filterText]);

  if (!topic) return null;

  const handleClose = () => {
    setFilterText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: theme.border }]}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]}>{topic.title}</Text>
              <View style={styles.crBadge}>
                <Text style={styles.crBadgeText}>{topic.badge}</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {topic.subtitle}
            </Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={22} color={theme.text} />
          </Pressable>
        </View>

        <View style={[styles.filterBarContainer, { borderBottomColor: theme.border }]}>
          <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textMuted} />
            <TextInput
              value={filterText}
              onChangeText={setFilterText}
              placeholder="Lọc điều luật, từ khóa, số CR..."
              placeholderTextColor={theme.textMuted}
              style={[styles.filterInput, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {filterText.length > 0 && (
              <Pressable onPress={() => setFilterText('')} hitSlop={8}>
                <Feather name="x" size={16} color={theme.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredSections.length === 0 ? (
            <View style={[styles.emptyFilterCard, { borderColor: theme.border }]}>
              <Feather name="search" size={24} color={theme.textMuted} />
              <Text style={[styles.emptyFilterTitle, { color: theme.text }]}>
                Không tìm thấy điều luật phù hợp
              </Text>
              <Text style={[styles.emptyFilterSub, { color: theme.textSecondary }]}>
                Không có mục nào trong cẩm nang này chứa từ khóa &quot;{filterText}&quot;.
              </Text>
            </View>
          ) : (
            filteredSections.map((section, idx) => (
              <View
                key={idx}
                style={[
                  styles.sectionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                  {section.description}
                </Text>

                {section.items && section.items.length > 0 && (
                  <View style={styles.itemsList}>
                    {section.items.map((item, itemIdx) => (
                      <View
                        key={itemIdx}
                        style={[styles.itemRow, { borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={[styles.itemTerm, { color: theme.text }]}>
                            {item.term}
                          </Text>
                          {item.crCode && (
                            <View style={styles.codePill}>
                              <Text style={styles.codePillText}>{item.crCode}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>
                          {item.details}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: spacing.md,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  crBadge: {
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    borderWidth: 1,
    borderColor: '#E0AD62',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  crBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.3,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  itemsList: {
    marginTop: spacing.xs,
  },
  itemRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemTerm: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: borderRadius.sm,
  },
  codePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B9C9C4',
  },
  itemDetails: {
    fontSize: 12,
    lineHeight: 18,
  },
  filterBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  emptyFilterCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyFilterTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyFilterSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
