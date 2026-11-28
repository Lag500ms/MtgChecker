import { useUiText } from '@/lib/useUiText';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/lib/ThemeProvider';
import type { DeckCardItem } from '../types/deck';

interface ManaCurveChartProps {
  cards: DeckCardItem[];
}

export function ManaCurveChart({ cards }: ManaCurveChartProps) {
  const ui = useUiText();
  const { theme } = useAppTheme();

  const cmcData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    cards.forEach((card) => {
      const type = (card.typeLine || '').toLowerCase();
      if (type.includes('land')) {
        return;
      }
      const rawCmc = card.cmc != null ? Math.floor(card.cmc) : 0;
      const index = Math.min(Math.max(rawCmc, 0), 7);
      counts[index] += card.quantity || 1;
    });

    const maxCount = Math.max(...counts, 1);
    return counts.map((count, index) => ({
      cmc: index === 7 ? '7+' : String(index),
      count,
      heightPercentage: Math.max((count / maxCount) * 100, 8),
    }));
  }, [cards]);

  const totalNonLand = useMemo(() => {
    return cmcData.reduce((acc, curr) => acc + curr.count, 0);
  }, [cmcData]);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{ui("MANA CURVE")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{totalNonLand}{ui("Spells")}</Text>
      </View>

      <View style={styles.chartArea}>
        {cmcData.map((item) => (
          <View key={item.cmc} style={styles.barColumn}>
            <Text style={[styles.barCount, { color: item.count > 0 ? theme.accent : theme.textSecondary }]}>
              {item.count > 0 ? item.count : ''}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${item.heightPercentage}%`,
                    backgroundColor: item.count > 0 ? theme.accent : 'rgba(255,255,255,0.05)',
                  },
                ]}
              />
            </View>
            <Text style={[styles.cmcLabel, { color: theme.textSecondary }]}>{item.cmc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: 16,
    justifyContent: 'flex-end',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '700',
    height: 16,
  },
  cmcLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
});
