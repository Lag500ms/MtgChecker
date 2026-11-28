import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useLanguage } from '@/lib/LanguageProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ui';
import { PlayerCard } from './PlayerCard';
import { TableToolsModal } from './TableToolsModal';
import type { PlayerCount, PlayerThemeColor, StartingLifeMode } from '../types';
import { pickFirstPlayerRoll, type FirstPlayerRoll } from '../firstPlayerRoll';
import {
  MATCH_STORAGE_KEY, createNewMatch, matchReducer,
  restoreMatch, serializeMatch, type CommanderSlot,
} from '../gameState';

interface LifeTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  initialPlayerCount?: PlayerCount;
  initialLife?: StartingLifeMode;
}

const PLAYER_OPTIONS: PlayerCount[] = [2, 3, 4];
const LIFE_OPTIONS: StartingLifeMode[] = [20, 30, 40];

export function LifeTrackerModal({
  visible, onClose, initialPlayerCount = 4, initialLife = 40,
}: LifeTrackerModalProps) {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [match, dispatch] = useReducer(matchReducer, undefined,
    () => createNewMatch(initialPlayerCount, initialLife));
  const [hydrated, setHydrated] = useState(false);
  const [gameControlsVisible, setGameControlsVisible] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [pendingSettings, setPendingSettings] =
    useState<{ count: PlayerCount; life: StartingLifeMode } | null>(null);
  const [rollResult, setRollResult] = useState<FirstPlayerRoll | null>(null);
  const rollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(MATCH_STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        const saved = value ? restoreMatch(value) : null;
        if (saved) dispatch({ type: 'restore', state: saved });
      })
      .catch((error) => console.warn('Could not restore life tracker:', error))
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(MATCH_STORAGE_KEY, serializeMatch(match))
      .catch((error) => console.warn('Could not save life tracker:', error));
  }, [hydrated, match]);

  useEffect(() => () => {
    if (rollTimeout.current) clearTimeout(rollTimeout.current);
  }, []);

  useEffect(() => {
    if (!visible) return;
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
        .catch((error) => console.warn('Could not restore portrait orientation:', error));
    };
  }, [visible]);

  useEffect(() => {
    if (!hydrated || !visible) return;
    const orientation = match.playerCount === 4
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    void ScreenOrientation.lockAsync(orientation).catch((error) => {
      console.warn('Could not change table orientation:', error);
    });
  }, [hydrated, match.playerCount, visible]);

  const clearRoll = () => {
    if (rollTimeout.current) clearTimeout(rollTimeout.current);
    rollTimeout.current = null;
    setRollResult(null);
  };

  const chooseFirstPlayer = () => {
    clearRoll();
    setGameControlsVisible(false);
    const roll = pickFirstPlayerRoll(match.playerCount);
    setRollResult(roll);
    rollTimeout.current = setTimeout(() => {
      setRollResult(null);
      rollTimeout.current = null;
    }, 4400);
  };

  const requestReset = (count: PlayerCount, life: StartingLifeMode) => {
    setPendingSettings({ count, life });
    setGameControlsVisible(false);
    setResetConfirmVisible(true);
  };

  const update = (field: 'life' | 'poison' | 'commanderTax' |
    'partnerCommanderTax' | 'energy' | 'experience') =>
    (playerId: string, delta: number) => dispatch({ type: 'adjust', playerId, field, delta });

  const onCommanderDamage = (targetId: string, attackerId: string,
    slot: CommanderSlot, delta: number) =>
    dispatch({ type: 'commanderDamage', targetId, attackerId, slot, delta });

  const renderPlayer = (index: number, rotated: boolean) => {
    const player = match.players[index];
    if (!player) return null;
    const roll = rollResult?.values[index];
    const winner = rollResult?.winnerIndex === index;
    return (
      <View key={player.id} style={styles.playerSlot}>
        <PlayerCard
          player={player}
          otherPlayers={match.players.filter((p) => p.id !== player.id)}
          rotate180={rotated}
          onUpdateLife={update('life')}
          onUpdatePoison={update('poison')}
          onUpdateCommanderTax={update('commanderTax')}
          onUpdatePartnerCommanderTax={update('partnerCommanderTax')}
          onUpdateEnergy={update('energy')}
          onUpdateExperience={update('experience')}
          onUpdateCommanderDamage={onCommanderDamage}
          onToggleMonarch={(id) => dispatch({ type: 'monarch', playerId: id })}
          onToggleInitiative={(id) => dispatch({ type: 'initiative', playerId: id })}
          onTogglePartner={(id) => dispatch({ type: 'partner', playerId: id })}
          onChangeTheme={(id: string, color: PlayerThemeColor) =>
            dispatch({ type: 'theme', playerId: id, color })}
          onRename={(id, name) => dispatch({ type: 'rename', playerId: id, name })}
        />
        {roll !== undefined && (
          <View pointerEvents="none" style={[
            styles.rollOverlay, winner && styles.rollWinner,
            rotated && styles.rotated,
          ]}>
            <Text style={styles.rollCaption}>D20 · {player.name}</Text>
            <Text style={styles.rollNumber}>{roll}</Text>
            <Text style={[styles.rollStatus, winner && styles.rollFirst]}>
              {winner ? '★ ' + t('first') + ' ★' : t('rollResult')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']} onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={[styles.container, {
        paddingTop: insets.top, paddingBottom: insets.bottom,
        paddingLeft: insets.left, paddingRight: insets.right,
      }]}>
        <View style={styles.board}>
          <View style={styles.row}>
            {match.playerCount === 4 && renderPlayer(2, true)}
            {renderPlayer(1, true)}
          </View>
          <View style={styles.row}>
            {renderPlayer(0, false)}
            {match.playerCount > 2 && renderPlayer(match.playerCount - 1, false)}
          </View>
          <View pointerEvents="box-none" style={styles.centerOverlay}>
            <Pressable style={styles.centerButton} accessibilityRole="button"
              accessibilityLabel={t('gameControl')}
              onPress={() => setGameControlsVisible(true)}>
              <Feather name="hexagon" size={24} color="#201B0D" />
              <View style={styles.dieDot}><Text style={styles.dieDotText}>20</Text></View>
            </Pressable>
          </View>
        </View>

        <Modal transparent visible={gameControlsVisible} animationType="fade"
          supportedOrientations={['portrait', 'landscape']}
          onRequestClose={() => setGameControlsVisible(false)}>
          <View style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill}
              onPress={() => setGameControlsVisible(false)} />
            <ScrollView style={[styles.menu, { maxWidth: landscape ? 570 : 430,
              maxHeight: landscape ? '93%' : '86%' }]}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.menuHeader}>
                <View>
                  <Text style={styles.menuEyebrow}>MTGCHECKER</Text>
                  <Text style={styles.menuTitle}>{t('gameControl')}</Text>
                </View>
                <Pressable hitSlop={12} onPress={() => setGameControlsVisible(false)}>
                  <Feather name="x" size={22} color="#D1D5DB" />
                </Pressable>
              </View>
              <Text style={styles.sectionTitle}>{t('players')}</Text>
              <View style={styles.choiceRow}>
                {PLAYER_OPTIONS.map((count) => (
                  <Pressable key={count} style={[
                    styles.choice, match.playerCount === count && styles.choiceActive,
                  ]} onPress={() => {
                    if (count !== match.playerCount) requestReset(count, match.startingLife);
                  }}>
                    <Text style={[styles.choiceText,
                      match.playerCount === count && styles.choiceTextActive]}>{count}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.sectionTitle}>{t('startingLife')}</Text>
              <View style={styles.choiceRow}>
                {LIFE_OPTIONS.map((life) => (
                  <Pressable key={life} style={[
                    styles.choice, match.startingLife === life && styles.choiceActive,
                  ]} onPress={() => {
                    if (life !== match.startingLife) requestReset(match.playerCount, life);
                  }}>
                    <Text style={[styles.choiceText,
                      match.startingLife === life && styles.choiceTextActive]}>{life} HP</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.separator} />
              <Pressable style={styles.rollButton} onPress={chooseFirstPlayer}>
                <Feather name="award" size={23} color="#211907" />
                <View style={styles.rollButtonText}>
                  <Text style={styles.rollButtonTitle}>{t('firstPlayer')}</Text>
                  <Text style={styles.rollButtonSubtitle}>{t('firstPlayerHint')}</Text>
                </View>
                <Feather name="arrow-right" size={19} color="#211907" />
              </Pressable>
              <View style={styles.actionRow}>
                <Pressable style={styles.actionButton} onPress={() => {
                  setGameControlsVisible(false);
                  setToolsVisible(true);
                }}>
                  <Feather name="box" size={19} color="#E9DFCE" />
                  <Text style={styles.actionText}>{t('diceCoin')}</Text>
                </Pressable>
                <Pressable style={styles.actionButton} disabled={match.undoStack.length === 0}
                  onPress={() => {
                    dispatch({ type: 'undo' });
                    setGameControlsVisible(false);
                  }}>
                  <Feather name="corner-up-left" size={19} color="#E9DFCE" />
                  <Text style={styles.actionText}>{t('undo')}</Text>
                </Pressable>
                <Pressable style={styles.actionButton}
                  onPress={() => requestReset(match.playerCount, match.startingLife)}>
                  <Feather name="refresh-cw" size={19} color="#F5A5A5" />
                  <Text style={styles.actionText}>{t('restart')}</Text>
                </Pressable>
              </View>
              <View style={styles.languageRow}>
                <Text style={styles.languageTitle}>{t('language')}</Text>
                <View style={styles.languageActions}>
                  {(['en', 'vi'] as const).map((option) => (
                    <Pressable key={option} onPress={() => setLanguage(option)}
                      style={[styles.languageChoice, language === option && styles.languageSelected]}>
                      <Text style={[styles.languageText, language === option && styles.languageTextSelected]}>
                        {option === 'en' ? 'EN' : 'VI'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable style={styles.exitButton} onPress={() => {
                setGameControlsVisible(false);
                onClose();
              }}>
                <Feather name="log-out" size={15} color="#A9ACB6" />
                <Text style={styles.exitText}>{t('exitTable')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>

        <TableToolsModal visible={toolsVisible}
          onClose={() => setToolsVisible(false)}
          players={match.players} history={match.history} />

        <ConfirmModal visible={resetConfirmVisible}
          title={t('confirmReset')}
          message={t('resetDescription')}
          confirmLabel={t('startNewMatch')} cancelLabel={t('cancel')}
          icon="rotate-ccw" isDestructive
          onConfirm={() => {
            clearRoll();
            const next = pendingSettings ?? {
              count: match.playerCount, life: match.startingLife,
            };
            dispatch({ type: 'reset', count: next.count, life: next.life });
            setPendingSettings(null);
            setResetConfirmVisible(false);
          }}
          onCancel={() => {
            setPendingSettings(null);
            setResetConfirmVisible(false);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080B10' },
  board: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  playerSlot: { flex: 1, minWidth: 0, minHeight: 0, position: 'relative' },
  centerOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  centerButton: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center',
    justifyContent: 'center', borderWidth: 5, borderColor: '#080B10',
    backgroundColor: '#D9B66B', elevation: 12,
  },
  dieDot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dieDotText: { fontSize: 9, fontWeight: '900', color: '#201B0D' },
  rollOverlay: {
    position: 'absolute', left: 4, right: 4, top: 4, bottom: 4,
    borderRadius: 10, backgroundColor: 'rgba(12,20,34,0.96)',
    borderWidth: 2, borderColor: '#64748B',
    alignItems: 'center', justifyContent: 'center', zIndex: 3, gap: 4,
  },
  rollWinner: {
    backgroundColor: 'rgba(57,49,24,0.97)', borderColor: '#FACC15',
  },
  rotated: { transform: [{ rotate: '180deg' }] },
  rollCaption: { fontSize: 12, fontWeight: '700', color: '#D4D8DF' },
  rollNumber: { fontSize: 76, fontWeight: '900', color: '#FFFFFF', lineHeight: 86 },
  rollStatus: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  rollFirst: { color: '#FACC15' },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center', paddingHorizontal: 18,
  },
  menu: {
    width: '100%', alignSelf: 'center', backgroundColor: '#171C26', borderRadius: 20,
    borderWidth: 1, borderColor: '#394250',
  },
  menuContent: { padding: 15, gap: 9 },
  languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3 },
  languageTitle: { color: '#C8CDD7', fontWeight: '700', fontSize: 11 },
  languageActions: { flexDirection: 'row', backgroundColor: '#0E1520', borderRadius: 8, padding: 3 },
  languageChoice: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 6 },
  languageSelected: { backgroundColor: '#3D392D' },
  languageText: { color: '#8D9CAE', fontSize: 11, fontWeight: '800' },
  languageTextSelected: { color: '#F2D08A' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuEyebrow: { color: '#D9B66B', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  menuTitle: { fontWeight: '900', fontSize: 22, color: '#FFFFFF' },
  sectionTitle: { color: '#AAB4C3', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  choiceRow: { flexDirection: 'row', gap: 5, borderRadius: 10,
    padding: 4, backgroundColor: '#0F141E' },
  choice: { flex: 1, borderRadius: 7, paddingVertical: 10, alignItems: 'center' },
  choiceActive: { backgroundColor: '#39372D' },
  choiceText: { fontSize: 11, color: '#98A4B4', fontWeight: '900' },
  choiceTextActive: { color: '#F5D08C' },
  separator: { height: 1, backgroundColor: '#394250', marginVertical: 3 },
  rollButton: { backgroundColor: '#D9B66B', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12 },
  rollButtonText: { flex: 1 },
  rollButtonTitle: { fontWeight: '900', fontSize: 13, color: '#211907' },
  rollButtonSubtitle: { fontSize: 10, color: '#403720' },
  actionRow: { flexDirection: 'row', gap: 7 },
  actionButton: { flex: 1, borderColor: '#3D4552', borderWidth: 1,
    borderRadius: 11, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { color: '#DFE4ED', fontSize: 11, fontWeight: '700' },
  exitButton: { flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 7, alignItems: 'center' },
  exitText: { color: '#A9ACB6', fontSize: 12 },
});
