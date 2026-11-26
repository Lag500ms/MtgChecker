import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '@/lib/LanguageProvider';
import { PLAYER_THEMES } from '../types';
import type { PlayerState, PlayerThemeColor } from '../types';
import type { CommanderSlot } from '../gameState';

interface PlayerCardProps {
  player: PlayerState;
  otherPlayers: PlayerState[];
  rotate180?: boolean;
  onUpdateLife: (playerId: string, delta: number) => void;
  onUpdatePoison: (playerId: string, delta: number) => void;
  onUpdateCommanderTax: (playerId: string, delta: number) => void;
  onUpdatePartnerCommanderTax: (playerId: string, delta: number) => void;
  onUpdateEnergy: (playerId: string, delta: number) => void;
  onUpdateExperience: (playerId: string, delta: number) => void;
  onUpdateCommanderDamage: (
    targetPlayerId: string, fromPlayerId: string, slot: CommanderSlot, delta: number
  ) => void;
  onToggleMonarch: (playerId: string) => void;
  onToggleInitiative: (playerId: string) => void;
  onTogglePartner: (playerId: string) => void;
  onChangeTheme: (playerId: string, color: PlayerThemeColor) => void;
  onRename: (playerId: string, name: string) => void;
}

const COLORS: PlayerThemeColor[] = ['white', 'blue', 'black', 'red', 'green', 'gold', 'colorless'];

function Stepper({
  label, value, onChange, color,
}: {
  label: string;
  value: number;
  onChange: (delta: number) => void;
  color?: string;
}) {
  return (
    <View style={styles.counterRow}>
      <Text numberOfLines={1} style={[styles.counterLabel, color ? { color } : null]}>
        {label}
      </Text>
      <View style={styles.counterControls}>
        <Pressable accessibilityRole="button"
          accessibilityLabel={'Decrease ' + label} hitSlop={5}
          onPress={() => onChange(-1)}
          onLongPress={() => onChange(-5)}
          delayLongPress={450} style={styles.counterBtn}>
          <Feather name="minus" size={18} color="#F5F5F5" />
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable accessibilityRole="button"
          accessibilityLabel={'Increase ' + label} hitSlop={5}
          onPress={() => onChange(1)}
          onLongPress={() => onChange(5)}
          delayLongPress={450} style={styles.counterBtn}>
          <Feather name="plus" size={18} color="#F5F5F5" />
        </Pressable>
      </View>
    </View>
  );
}

export function PlayerCard({
  player, otherPlayers, rotate180 = false,
  onUpdateLife, onUpdatePoison, onUpdateCommanderTax,
  onUpdatePartnerCommanderTax, onUpdateEnergy, onUpdateExperience,
  onUpdateCommanderDamage, onToggleMonarch, onToggleInitiative,
  onTogglePartner, onChangeTheme, onRename,
}: PlayerCardProps) {
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [menuVisible, setMenuVisible] = useState(false);
  const [draftName, setDraftName] = useState(player.name);
  const [section, setSection] = useState<'main' | 'damage' | 'settings'>('main');

  const palette = PLAYER_THEMES[player.themeColor] || PLAYER_THEMES.colorless;
  const maxDamage = Math.max(0, ...Object.values(player.commanderDamageReceived));
  const poisonLoss = player.poison >= 10;
  const commanderLoss = maxDamage >= 21;
  const lost = player.life <= 0 || poisonLoss || commanderLoss;
  const lossReason = player.life <= 0 ? t('lifeLoss') :
    poisonLoss ? t('poisonLoss') : commanderLoss ? t('commanderLoss') : '';
  const openMenu = () => {
    setDraftName(player.name);
    setSection('main');
    setMenuVisible(true);
  };
  const damageSources = otherPlayers.flatMap((opponent) => {
    const main = [{ id: opponent.id, attacker: opponent, slot: 'main' as CommanderSlot,
      label: opponent.name + ' · ' + t('mainCommander') }];
    if (opponent.hasPartner) main.push({
      id: opponent.id + ':partner', attacker: opponent, slot: 'partner',
      label: opponent.name + ' · ' + t('partner'),
    });
    return main;
  });

  return (
    <View style={[styles.root, {
      backgroundColor: palette.bg,
      borderColor: lost ? '#F87171' : palette.border,
      transform: rotate180 ? [{ rotate: '180deg' }] : [],
    }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: palette.accent }]} />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View style={[styles.colorMark, { backgroundColor: palette.accent }]} />
          <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
          {lost && <Text style={styles.eliminated}>{t('defeated')}</Text>}
        </View>
        <Pressable accessibilityRole="button"
          accessibilityLabel={player.name + ' ' + t('more')}
          onPress={openMenu} hitSlop={8} style={styles.menuTrigger}>
          <Feather name="more-vertical" size={22} color="#F2F4F8" />
        </Pressable>
      </View>

      <View style={styles.lifeArea}>
        <Pressable
          style={({ pressed }) => [styles.lifeTap, pressed && styles.tapMinus]}
          accessibilityLabel={player.name + ' -1 ' + t('life')}
          onPress={() => onUpdateLife(player.id, -1)}
          onLongPress={() => onUpdateLife(player.id, -5)}
          delayLongPress={450}
        >
          <Feather name="minus" color={palette.accent} size={landscape ? 26 : 22} />
        </Pressable>
        <View style={styles.lifeTextBox} pointerEvents="none">
          <Text style={[styles.lifeText, {
            color: lost ? '#FF9D9D' : '#FDFDFE',
            fontSize: landscape ? 67 : 65,
          }]} adjustsFontSizeToFit numberOfLines={1}>{player.life}</Text>
          {lost && <Text style={styles.lossText} numberOfLines={1}>{lossReason}</Text>}
        </View>
        <Pressable
          style={({ pressed }) => [styles.lifeTap, pressed && styles.tapPlus]}
          accessibilityLabel={player.name + ' +1 ' + t('life')}
          onPress={() => onUpdateLife(player.id, 1)}
          onLongPress={() => onUpdateLife(player.id, 5)}
          delayLongPress={450}
        >
          <Feather name="plus" color={palette.accent} size={landscape ? 26 : 22} />
        </Pressable>
      </View>

      <View style={styles.badges}>
        <View style={[styles.statBadge, player.poison >= 8 && styles.dangerBadge]}>
          <Feather name="alert-triangle" size={11} color={player.poison >= 8 ? '#FCA5A5' : '#D2D7DF'} />
          <Text style={styles.statText}>{player.poison}/10</Text>
        </View>
        <View style={[styles.statBadge, maxDamage >= 18 && styles.dangerBadge]}>
          <Feather name="shield" size={11} color={maxDamage >= 18 ? '#FCA5A5' : '#D2D7DF'} />
          <Text style={styles.statText}>{maxDamage}/21</Text>
        </View>
        {player.isMonarch && <View style={styles.goldBadge}><Text style={styles.goldText}>♛ {t('monarch')}</Text></View>}
        {player.hasInitiative && <View style={styles.goldBadge}><Text style={styles.goldText}>⚔ {t('initiative')}</Text></View>}
      </View>

      <Modal visible={menuVisible} animationType="fade" transparent
        onRequestClose={() => setMenuVisible(false)} supportedOrientations={['portrait', 'landscape']}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <View style={[styles.sheet,
            { maxWidth: landscape ? 620 : 420, maxHeight: landscape ? '96%' : '85%' },
            rotate180 ? styles.flip : null]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleWrap}>
                <Text style={[styles.sheetTitle, { color: palette.accent }]}>{player.name}</Text>
                <Text style={styles.sheetSubtitle}>{player.life} {t('life')}</Text>
              </View>
              <Pressable onPress={() => setMenuVisible(false)} hitSlop={10}>
                <Feather name="x" size={23} color="#F5F5F5" />
              </Pressable>
            </View>
            <View style={styles.tabs}>
              {([
                ['main', t('counters')],
                ['damage', t('commanderDamage')],
                ['settings', t('settings')],
              ] as const).map(([id, label]) => (
                <Pressable key={id}
                  accessibilityRole="tab" accessibilityState={{ selected: section === id }}
                  onPress={() => setSection(id)}
                  style={[styles.tab, section === id && styles.activeTab]}>
                  <Text numberOfLines={1} style={[styles.tabText, section === id && styles.activeTabText]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView contentContainerStyle={styles.sheetScroll}
              showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {section === 'main' && (
                <View style={styles.section}>
                  <Stepper label={'☠ ' + t('poison')} value={player.poison}
                    onChange={(n) => onUpdatePoison(player.id, n)} />
                  <Stepper label={'⚡ ' + t('energy')} value={player.energy}
                    onChange={(n) => onUpdateEnergy(player.id, n)} />
                  <Stepper label={'✦ ' + t('experience')} value={player.experience}
                    onChange={(n) => onUpdateExperience(player.id, n)} />
                  <Stepper label={'◆ ' + t('commanderTax') + ' (+' + (player.commanderTax * 2) + ')'}
                    value={player.commanderTax}
                    onChange={(n) => onUpdateCommanderTax(player.id, n)} />
                  {player.hasPartner && (
                    <Stepper label={'◆ ' + t('partnerTax') + ' (+' + (player.partnerCommanderTax * 2) + ')'}
                      value={player.partnerCommanderTax}
                      onChange={(n) => onUpdatePartnerCommanderTax(player.id, n)} />
                  )}
                  <Pressable style={styles.toggleRow} onPress={() => onToggleMonarch(player.id)}>
                    <Text style={styles.toggleText}>♛ {t('monarch')}</Text>
                    <Feather name={player.isMonarch ? 'check-circle' : 'circle'}
                      size={23} color={player.isMonarch ? '#EABF70' : '#8893A3'} />
                  </Pressable>
                  <Pressable style={styles.toggleRow} onPress={() => onToggleInitiative(player.id)}>
                    <Text style={styles.toggleText}>⚔ {t('initiative')}</Text>
                    <Feather name={player.hasInitiative ? 'check-circle' : 'circle'}
                      size={23} color={player.hasInitiative ? '#EABF70' : '#8893A3'} />
                  </Pressable>
                </View>
              )}
              {section === 'damage' && (
                <View style={styles.section}>
                  <Text style={styles.helpText}>{t('commanderDamage')} · 21</Text>
                  {damageSources.map((source) => (
                    <Stepper key={source.id} label={source.label}
                      value={player.commanderDamageReceived[source.id] || 0}
                      color={PLAYER_THEMES[source.attacker.themeColor].accent}
                      onChange={(n) => onUpdateCommanderDamage(
                        player.id, source.attacker.id, source.slot, n)} />
                  ))}
                </View>
              )}
              {section === 'settings' && (
                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>{t('name')}</Text>
                  <TextInput value={draftName} onChangeText={setDraftName}
                    maxLength={20} selectTextOnFocus
                    style={styles.nameInput}
                    placeholder={t('name')} placeholderTextColor="#8993A3" />
                  <Text style={styles.fieldLabel}>{t('color')}</Text>
                  <View style={styles.colors}>
                    {COLORS.map((color) => (
                      <Pressable key={color}
                        onPress={() => onChangeTheme(player.id, color)}
                        accessibilityLabel={color}
                        style={[styles.colorOption, {
                          backgroundColor: PLAYER_THEMES[color].accent,
                          borderColor: player.themeColor === color ? '#FFF' : 'transparent',
                        }]} />
                    ))}
                  </View>
                  <Pressable style={styles.toggleRow} onPress={() => onTogglePartner(player.id)}>
                    <Text style={styles.toggleText}>{t('twoCommanders')}</Text>
                    <Feather name={player.hasPartner ? 'check-circle' : 'circle'}
                      size={23} color={player.hasPartner ? '#EABF70' : '#8893A3'} />
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={() => {
                    onRename(player.id, draftName);
                    setMenuVisible(false);
                  }}>
                    <Text style={styles.saveText}>{t('save')}</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0, minHeight: 0,
    borderWidth: 1.2, borderRadius: 11, margin: 3, paddingHorizontal: 9, paddingVertical: 5,
  },
  glow: { position: 'absolute', left: 0, top: 0, right: 0, height: 4, opacity: 0.35 },
  header: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6, minWidth: 0 },
  colorMark: { width: 7, height: 7, borderRadius: 4 },
  playerName: { color: '#F5F6F8', fontSize: 13, fontWeight: '800', flexShrink: 1 },
  eliminated: { color: '#FCA5A5', fontSize: 9, fontWeight: '900' },
  menuTrigger: { width: 37, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
  lifeArea: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center' },
  lifeTap: {
    flex: 1, height: '100%', borderRadius: 6,
    justifyContent: 'center', alignItems: 'center', minWidth: 35,
  },
  tapMinus: { backgroundColor: 'rgba(239,68,68,0.20)' },
  tapPlus: { backgroundColor: 'rgba(34,197,94,0.20)' },
  lifeTextBox: { flex: 1.6, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  lifeText: { fontWeight: '900', textAlign: 'center', letterSpacing: -3, includeFontPadding: false },
  lossText: { color: '#FDA4AF', fontSize: 9, fontWeight: '900' },
  badges: {
    minHeight: 28, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
  },
  statBadge: {
    minWidth: 56, paddingHorizontal: 7, paddingVertical: 5,
    borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  dangerBadge: { borderColor: '#F87171' },
  statText: { color: '#EEF0F3', fontSize: 11, fontWeight: '800' },
  goldBadge: { paddingHorizontal: 6, paddingVertical: 5, borderRadius: 7,
    backgroundColor: 'rgba(238,179,72,0.18)', borderColor: '#8C6B31', borderWidth: 1 },
  goldText: { color: '#F9D483', fontSize: 10, fontWeight: '800' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.76)', padding: 12 },
  sheet: { width: '100%', backgroundColor: '#161D2A', borderRadius: 16,
    borderWidth: 1, borderColor: '#394557', padding: 13, gap: 9 },
  flip: { transform: [{ rotate: '180deg' }] },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitleWrap: { flex: 1 },
  sheetTitle: { fontSize: 19, fontWeight: '900' },
  sheetSubtitle: { color: '#CDD5DF', fontSize: 12 },
  tabs: { flexDirection: 'row', borderRadius: 9, backgroundColor: '#0A101A', padding: 3, gap: 3 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 7 },
  activeTab: { backgroundColor: '#394052' },
  tabText: { color: '#A4ADBB', fontSize: 10, fontWeight: '800' },
  activeTabText: { color: '#F5D08C' },
  sheetScroll: { paddingBottom: 5 },
  section: { gap: 7 },
  counterRow: { flexDirection: 'row', alignItems: 'center', minHeight: 43, gap: 5 },
  counterLabel: { flex: 1, fontSize: 12, fontWeight: '800', color: '#E6EAF0' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  counterBtn: { height: 38, width: 38, backgroundColor: '#313B4D',
    borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  counterValue: { color: '#FFFFFF', minWidth: 29, fontSize: 18,
    fontVariant: ['tabular-nums'], fontWeight: '900', textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 9, backgroundColor: '#242E40', paddingHorizontal: 12, paddingVertical: 12 },
  toggleText: { color: '#F5F5F5', fontWeight: '800', fontSize: 12, flexShrink: 1 },
  helpText: { fontSize: 12, color: '#C5CED9', marginBottom: 5 },
  fieldLabel: { color: '#D1D8E1', fontSize: 11, fontWeight: '800', paddingTop: 4 },
  nameInput: { backgroundColor: '#0B101A', borderRadius: 9, color: '#FFFFFF',
    padding: 10, fontSize: 16 },
  colors: { flexDirection: 'row', justifyContent: 'space-around', gap: 5, paddingVertical: 5 },
  colorOption: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
  saveButton: { backgroundColor: '#E4C078', borderRadius: 9, padding: 11, alignItems: 'center' },
  saveText: { color: '#10141B', fontSize: 14, fontWeight: '900' },
});
