import { useUiText } from '@/lib/useUiText';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import type { DeckCardItem } from '../types/deck';

export type ManaBaseAnalyzerProps = {
  cards: DeckCardItem[];
};

interface ColorStat {
  color: 'W' | 'U' | 'B' | 'R' | 'G';
  name: string;
  hex: string;
  pips: number;
  pipPct: number;
  sources: number;
  sourcePct: number;
}

const COLOR_CONFIG = [
  { color: 'W' as const, name: 'White', hex: '#F8E7B9' },
  { color: 'U' as const, name: 'Blue', hex: '#0284C7' },
  { color: 'B' as const, name: 'Black', hex: '#334155' },
  { color: 'R' as const, name: 'Red', hex: '#DC2626' },
  { color: 'G' as const, name: 'Green', hex: '#16A34A' },
];

function analyzeManaBase(cards: DeckCardItem[]): {
  stats: ColorStat[];
  totalPips: number;
  totalLands: number;
  totalSpells: number;
} {
  const pipsCount: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const sourceCount: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

  let totalLands = 0;
  let totalSpells = 0;

  for (const item of cards) {
    const qty = Math.max(1, item.quantity || 1);
    const type = (item.typeLine || '').toLowerCase();
    const isLand = type.includes('land');
    const name = item.name.toLowerCase();

    if (isLand) {
      totalLands += qty;

      const isFiveColor =
        name.includes('command tower') ||
        name.includes('city of brass') ||
        name.includes('mana confluence') ||
        name.includes('exotic orchard') ||
        name.includes('reflecting pool') ||
        name.includes('path of ancestry') ||
        name.includes('the world tree');

      if (isFiveColor) {
        sourceCount.W += qty;
        sourceCount.U += qty;
        sourceCount.B += qty;
        sourceCount.R += qty;
        sourceCount.G += qty;
      } else {
        if (type.includes('plains') || name.includes('plains')) sourceCount.W += qty;
        if (type.includes('island') || name.includes('island')) sourceCount.U += qty;
        if (type.includes('swamp') || name.includes('swamp')) sourceCount.B += qty;
        if (type.includes('mountain') || name.includes('mountain')) sourceCount.R += qty;
        if (type.includes('forest') || name.includes('forest')) sourceCount.G += qty;
      }
    } else {
      totalSpells += qty;
      const cost = item.manaCost || '';
      const wCount = (cost.match(/W/g) || []).length;
      const uCount = (cost.match(/U/g) || []).length;
      const bCount = (cost.match(/B/g) || []).length;
      const rCount = (cost.match(/R/g) || []).length;
      const gCount = (cost.match(/G/g) || []).length;

      pipsCount.W += wCount * qty;
      pipsCount.U += uCount * qty;
      pipsCount.B += bCount * qty;
      pipsCount.R += rCount * qty;
      pipsCount.G += gCount * qty;
    }
  }

  const totalPips =
    pipsCount.W + pipsCount.U + pipsCount.B + pipsCount.R + pipsCount.G;
  const totalSources =
    sourceCount.W + sourceCount.U + sourceCount.B + sourceCount.R + sourceCount.G;

  const stats: ColorStat[] = COLOR_CONFIG.map((cfg) => {
    const p = pipsCount[cfg.color] || 0;
    const s = sourceCount[cfg.color] || 0;
    return {
      color: cfg.color,
      name: cfg.name,
      hex: cfg.hex,
      pips: p,
      pipPct: totalPips > 0 ? Math.round((p / totalPips) * 100) : 0,
      sources: s,
      sourcePct: totalSources > 0 ? Math.round((s / totalSources) * 100) : 0,
    };
  }).filter((st) => st.pips > 0 || st.sources > 0);

  return {
    stats,
    totalPips,
    totalLands,
    totalSpells,
  };
}

function ManaBaseAnalyzerComponent({ cards }: ManaBaseAnalyzerProps) {
  const ui = useUiText();
  const { theme } = useAppTheme();

  const analysis = useMemo(() => analyzeManaBase(cards), [cards]);

  if (analysis.stats.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{ui("Mana Base Balance")}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{ui("Compare Mana Pip Demand (Spells) vs Land Production (Lands)")}</Text>
        </View>
        <View style={styles.landBadge}>
          <Text style={[styles.landBadgeText, { color: theme.accent }]}>
            {analysis.totalLands}{ui("Lands /")}{analysis.totalSpells}{ui("Spells")}</Text>
        </View>
      </View>

      <View style={styles.statsList}>
        {analysis.stats.map((stat) => {
          const diff = stat.sourcePct - stat.pipPct;
          const isWarning = stat.pipPct > 15 && diff < -12;

          return (
            <View key={stat.color} style={styles.statRow}>
              {/* Color Pip Pill */}
              <View style={[styles.pipBadge, { backgroundColor: stat.hex }]}>
                <Text style={styles.pipBadgeText}>{stat.color}</Text>
              </View>

              {/* Progress Bars */}
              <View style={styles.barsCol}>
                {/* Needs Bar */}
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{ui("Demand:")}{stat.pips} ({stat.pipPct}%)
                  </Text>
                  <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{ui("Sources:")}{stat.sources} ({stat.sourcePct}%)
                  </Text>
                </View>

                <View style={[styles.trackBg, { backgroundColor: theme.background }]}>
                  {/* Pip progress */}
                  <View
                    style={[
                      styles.fillBar,
                      {
                        width: `${Math.min(100, Math.max(4, stat.pipPct))}%`,
                        backgroundColor: stat.hex,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.trackBg, { backgroundColor: theme.background, marginTop: 2 }]}>
                  {/* Source progress */}
                  <View
                    style={[
                      styles.fillBar,
                      {
                        width: `${Math.min(100, Math.max(4, stat.sourcePct))}%`,
                        backgroundColor: stat.hex,
                        opacity: 0.65,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Status Indicator */}
              <View style={styles.diffWrap}>
                {isWarning ? (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>{ui("Low")}</Text>
                  </View>
                ) : (
                  <Text style={[styles.diffText, { color: diff >= 0 ? '#22C55E' : theme.textMuted }]}>
                    {diff >= 0 ? `+${diff}%` : `${diff}%`}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  landBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(224, 173, 98, 0.12)',
  },
  landBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  barsCol: {
    flex: 1,
    gap: 1,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
  diffWrap: {
    width: 44,
    alignItems: 'flex-end',
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  warningBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
});

export const ManaBaseAnalyzer = memo(ManaBaseAnalyzerComponent);
