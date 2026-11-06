import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { borderRadius, spacing } from '@/lib/theme';
import { PLAYER_THEMES } from '../types';
import type { PlayerState, PlayerThemeColor } from '../types';

interface PlayerCardProps {
  player: PlayerState;
  otherPlayers: PlayerState[];
  rotate180?: boolean;
  onUpdateLife: (playerId: string, delta: number) => void;
  onUpdatePoison: (playerId: string, delta: number) => void;
  onUpdateCommanderTax: (playerId: string, delta: number) => void;
  onUpdateEnergy: (playerId: string, delta: number) => void;
  onUpdateCommanderDamage: (
    targetPlayerId: string,
    fromPlayerId: string,
    delta: number
  ) => void;
  onToggleMonarch: (playerId: string) => void;
  onToggleInitiative: (playerId: string) => void;
  onChangeTheme: (playerId: string, color: PlayerThemeColor) => void;
}

export function PlayerCard({
  player,
  otherPlayers,
  rotate180 = false,
  onUpdateLife,
  onUpdatePoison,
  onUpdateCommanderTax,
  onUpdateEnergy,
  onUpdateCommanderDamage,
  onToggleMonarch,
  onToggleInitiative,
  onChangeTheme,
}: PlayerCardProps) {
  const [viewMode, setViewMode] = useState<'life' | 'counters' | 'commanderDmg'>('life');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const themeConfig = PLAYER_THEMES[player.themeColor] || PLAYER_THEMES.colorless;

  /* Kiểm tra các điều kiện thua trận theo luật Comprehensive Rules */
  const isDeadByLife = player.life <= 0;
  const isDeadByPoison = player.poison >= 10;
  const lethalCommanderDamageSource = Object.entries(player.commanderDamageReceived).find(
    ([, dmg]) => dmg >= 21
  );
  const isDeadByCommander = Boolean(lethalCommanderDamageSource);
  const isDefeated = isDeadByLife || isDeadByPoison || isDeadByCommander;

  const colorOptions: PlayerThemeColor[] = [
    'white',
    'blue',
    'black',
    'red',
    'green',
    'gold',
    'colorless',
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeConfig.bg,
          borderColor: isDefeated ? '#EF4444' : themeConfig.border,
          transform: rotate180 ? [{ rotate: '180deg' }] : [],
        },
      ]}
    >
      {/* Top Header bar của từng người chơi */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => setShowColorPicker(!showColorPicker)}
          style={[styles.colorIndicator, { backgroundColor: themeConfig.accent }]}
        />
        <Text style={[styles.playerName, { color: themeConfig.accent }]} numberOfLines={1}>
          {player.name}
        </Text>
        <View style={styles.topBadgesRow}>
          {player.isMonarch && (
            <View style={styles.monarchBadge}>
              <Text style={styles.monarchText}>👑 MONARCH</Text>
            </View>
          )}
          {player.hasInitiative && (
            <View style={styles.initiativeBadge}>
              <Text style={styles.initiativeText}>⚔️ INITIATIVE</Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              if (viewMode === 'life') setViewMode('counters');
              else if (viewMode === 'counters') setViewMode('commanderDmg');
              else setViewMode('life');
            }}
            hitSlop={8}
            style={styles.modeSwitchBtn}
          >
            <Feather
              name={
                viewMode === 'life'
                  ? 'sliders'
                  : viewMode === 'counters'
                  ? 'shield'
                  : 'heart'
              }
              size={18}
              color={themeConfig.accent}
            />
          </Pressable>
        </View>
      </View>

      {/* Bộ chọn màu nếu người chơi nhấn vào chấm màu */}
      {showColorPicker && (
        <View style={styles.colorPaletteRow}>
          {colorOptions.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                onChangeTheme(player.id, c);
                setShowColorPicker(false);
              }}
              style={[
                styles.colorDot,
                { backgroundColor: PLAYER_THEMES[c].accent },
                player.themeColor === c && styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Chế độ 1: LIFE DISPLAY CHÍNH VỚI VÙNG CHẠM TÀNG HÌNH CHIA ĐÔI */}
      {viewMode === 'life' && (
        <View style={styles.mainLifeArea}>
          {isDefeated && (
            <View style={styles.defeatedBadge}>
              <Text style={styles.defeatedText}>
                {isDeadByPoison
                  ? '💀 THUA BỞI POISON (10+)'
                  : isDeadByCommander
                  ? '💀 THUA BỞI COMMANDER DMG (21+)'
                  : '💀 THUA TRẬN (0 HP)'}
              </Text>
            </View>
          )}

          <View style={styles.splitTouchArea}>
            {/* Nửa bên trái: Nhấp là -1, giữ lâu là -5 */}
            <Pressable
              onPress={() => onUpdateLife(player.id, -1)}
              onLongPress={() => onUpdateLife(player.id, -5)}
              style={({ pressed }) => [
                styles.splitHalf,
                styles.splitHalfLeft,
                pressed && { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
              ]}
            >
              <Feather
                name="minus"
                size={28}
                color={themeConfig.accent}
                style={styles.splitIconHint}
              />
            </Pressable>

            {/* Nửa bên phải: Nhấp là +1, giữ lâu là +5 */}
            <Pressable
              onPress={() => onUpdateLife(player.id, 1)}
              onLongPress={() => onUpdateLife(player.id, 5)}
              style={({ pressed }) => [
                styles.splitHalf,
                styles.splitHalfRight,
                pressed && { backgroundColor: 'rgba(34, 197, 94, 0.16)' },
              ]}
            >
              <Feather
                name="plus"
                size={28}
                color={themeConfig.accent}
                style={styles.splitIconHint}
              />
            </Pressable>

            {/* Số máu to hiển thị trung tâm, pointerEvents="none" để chạm xuyên thấu */}
            <View style={styles.lifeCenterOverlay} pointerEvents="none">
              <Text
                style={[
                  styles.lifeNumber,
                  { color: isDefeated ? '#EF4444' : themeConfig.accent },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {player.life}
              </Text>
              <Text style={[styles.lifeTapHint, { color: themeConfig.accent }]}>
                - Chạm Trái  |  Chạm Phải +
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Chế độ 2: BỘ ĐẾM PHỤ (Poison, Commander Tax, Energy, Monarch) */}
      {viewMode === 'counters' && (
        <View style={styles.countersArea}>
          {/* Poison */}
          <View style={styles.counterRow}>
            <View style={styles.counterLabelWrap}>
              <Text style={styles.counterIcon}>🧪</Text>
              <Text style={[styles.counterLabel, { color: themeConfig.accent }]}>
                Poison ({player.poison}/10)
              </Text>
            </View>
            <View style={styles.counterControls}>
              <Pressable
                onPress={() => onUpdatePoison(player.id, -1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="minus" size={14} color="#FFF" />
              </Pressable>
              <Text style={[styles.counterValue, { color: player.poison >= 10 ? '#EF4444' : '#FFF' }]}>
                {player.poison}
              </Text>
              <Pressable
                onPress={() => onUpdatePoison(player.id, 1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="plus" size={14} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Commander Tax */}
          <View style={styles.counterRow}>
            <View style={styles.counterLabelWrap}>
              <Text style={styles.counterIcon}>🪙</Text>
              <Text style={[styles.counterLabel, { color: themeConfig.accent }]}>
                Tax (+{player.commanderTax * 2})
              </Text>
            </View>
            <View style={styles.counterControls}>
              <Pressable
                onPress={() => onUpdateCommanderTax(player.id, -1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="minus" size={14} color="#FFF" />
              </Pressable>
              <Text style={[styles.counterValue, { color: '#FFF' }]}>
                {player.commanderTax}
              </Text>
              <Pressable
                onPress={() => onUpdateCommanderTax(player.id, 1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="plus" size={14} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Energy */}
          <View style={styles.counterRow}>
            <View style={styles.counterLabelWrap}>
              <Text style={styles.counterIcon}>⚡</Text>
              <Text style={[styles.counterLabel, { color: themeConfig.accent }]}>Energy</Text>
            </View>
            <View style={styles.counterControls}>
              <Pressable
                onPress={() => onUpdateEnergy(player.id, -1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="minus" size={14} color="#FFF" />
              </Pressable>
              <Text style={[styles.counterValue, { color: '#FFF' }]}>
                {player.energy}
              </Text>
              <Pressable
                onPress={() => onUpdateEnergy(player.id, 1)}
                style={styles.counterMiniBtn}
              >
                <Feather name="plus" size={14} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Nút bật Monarch & Initiative */}
          <View style={styles.statusToggleRow}>
            <Pressable
              onPress={() => onToggleMonarch(player.id)}
              style={[
                styles.statusBtn,
                player.isMonarch && styles.statusBtnActiveMonarch,
              ]}
            >
              <Text style={styles.statusBtnText}>👑 Monarch</Text>
            </Pressable>
            <Pressable
              onPress={() => onToggleInitiative(player.id)}
              style={[
                styles.statusBtn,
                player.hasInitiative && styles.statusBtnActiveInitiative,
              ]}
            >
              <Text style={styles.statusBtnText}>⚔️ Initiative</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Chế độ 3: COMMANDER DAMAGE MATRIX (CR 903.10a) */}
      {viewMode === 'commanderDmg' && (
        <View style={styles.commanderDmgArea}>
          <Text style={[styles.cmdDmgTitle, { color: themeConfig.accent }]}>
            Sát Thương Tướng Nhận (Ngưỡng 21)
          </Text>
          {otherPlayers.map((other) => {
            const dmg = player.commanderDamageReceived[other.id] || 0;
            const isLethal = dmg >= 21;
            return (
              <View key={other.id} style={styles.cmdDmgRow}>
                <Text style={[styles.cmdDmgAttackerName, { color: other.themeColor ? PLAYER_THEMES[other.themeColor].accent : '#FFF' }]} numberOfLines={1}>
                  Tướng của {other.name}:
                </Text>
                <View style={styles.counterControls}>
                  <Pressable
                    onPress={() => onUpdateCommanderDamage(player.id, other.id, -1)}
                    style={styles.counterMiniBtn}
                  >
                    <Feather name="minus" size={14} color="#FFF" />
                  </Pressable>
                  <Text
                    style={[
                      styles.counterValue,
                      { color: isLethal ? '#EF4444' : '#FFF', fontWeight: isLethal ? '900' : '700' },
                    ]}
                  >
                    {dmg}
                  </Text>
                  <Pressable
                    onPress={() => onUpdateCommanderDamage(player.id, other.id, 1)}
                    style={styles.counterMiniBtn}
                  >
                    <Feather name="plus" size={14} color="#FFF" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer Mini bar: Đổi nhanh sang các view khác */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => setViewMode('life')}
          style={[styles.bottomTab, viewMode === 'life' && styles.bottomTabActive]}
        >
          <Text style={[styles.bottomTabText, viewMode === 'life' && { color: themeConfig.accent }]}>
            Máu
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('counters')}
          style={[styles.bottomTab, viewMode === 'counters' && styles.bottomTabActive]}
        >
          <Text style={[styles.bottomTabText, viewMode === 'counters' && { color: themeConfig.accent }]}>
            Counters
          </Text>
        </Pressable>
        {otherPlayers.length > 0 && (
          <Pressable
            onPress={() => setViewMode('commanderDmg')}
            style={[styles.bottomTab, viewMode === 'commanderDmg' && styles.bottomTabActive]}
          >
            <Text style={[styles.bottomTabText, viewMode === 'commanderDmg' && { color: themeConfig.accent }]}>
              Cmd Dmg
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    margin: 4,
    padding: spacing.xs,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monarchBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  monarchText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
  },
  initiativeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  initiativeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
  modeSwitchBtn: {
    padding: 4,
    marginLeft: 4,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: borderRadius.xs,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  mainLifeArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  defeatedBadge: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    zIndex: 10,
  },
  defeatedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  splitTouchArea: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  splitHalf: {
    flex: 1,
    justifyContent: 'center',
  },
  splitHalfLeft: {
    alignItems: 'flex-start',
    paddingLeft: spacing.md,
  },
  splitHalfRight: {
    alignItems: 'flex-end',
    paddingRight: spacing.md,
  },
  splitIconHint: {
    opacity: 0.3,
  },
  lifeCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeNumber: {
    fontSize: 58,
    fontWeight: '900',
    textAlign: 'center',
  },
  lifeTapHint: {
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.45,
    marginTop: -2,
    letterSpacing: 0.5,
  },
  countersArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  counterIcon: {
    fontSize: 13,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xs,
    alignItems: 'center',
  },
  statusBtnActiveMonarch: {
    backgroundColor: '#F59E0B',
  },
  statusBtnActiveInitiative: {
    backgroundColor: '#3B82F6',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  commanderDmgArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  cmdDmgTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  cmdDmgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cmdDmgAttackerName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 3,
  },
  bottomTab: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bottomTabActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFF',
  },
  bottomTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
