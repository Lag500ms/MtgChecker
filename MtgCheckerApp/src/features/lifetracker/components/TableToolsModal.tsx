import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import type { MatchHistoryEntry, PlayerState } from '../types';

interface TableToolsModalProps {
  visible: boolean;
  onClose: () => void;
  players: PlayerState[];
  history: MatchHistoryEntry[];
}

export function TableToolsModal({
  visible,
  onClose,
  players,
  history,
}: TableToolsModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'dice' | 'coin' | 'picker' | 'history'>('dice');
  const [d20Result, setD20Result] = useState<number | null>(null);
  const [d6Result, setD6Result] = useState<number | null>(null);
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [pickedPlayer, setPickedPlayer] = useState<PlayerState | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollD20 = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setD20Result(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const rollD6 = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setD6Result(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const flipCoin = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setCoinResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 70);
  };

  const pickFirstPlayer = () => {
    if (players.length === 0) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * players.length);
      setPickedPlayer(players[idx]);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.dragHandleBar}>
            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
          </View>
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.border },
            ]}
          >
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.title, { color: theme.text }]}>Công Cụ Bàn Đấu</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Xúc xắc, đồng xu & chọn lượt chơi
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

        <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => setActiveTab('dice')}
            style={[
              styles.tabBtn,
              activeTab === 'dice' && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
            ]}
          >
            <Feather
              name="box"
              size={15}
              color={activeTab === 'dice' ? theme.accent : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'dice' ? theme.accent : theme.textMuted },
              ]}
            >
              Xúc xắc
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('coin')}
            style={[
              styles.tabBtn,
              activeTab === 'coin' && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
            ]}
          >
            <Feather
              name="disc"
              size={15}
              color={activeTab === 'coin' ? theme.accent : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'coin' ? theme.accent : theme.textMuted },
              ]}
            >
              Đồng xu
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('picker')}
            style={[
              styles.tabBtn,
              activeTab === 'picker' && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
            ]}
          >
            <Feather
              name="user-check"
              size={15}
              color={activeTab === 'picker' ? theme.accent : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'picker' ? theme.accent : theme.textMuted },
              ]}
            >
              Ai đi trước?
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('history')}
            style={[
              styles.tabBtn,
              activeTab === 'history' && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
            ]}
          >
            <Feather
              name="clock"
              size={15}
              color={activeTab === 'history' ? theme.accent : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'history' ? theme.accent : theme.textMuted },
              ]}
            >
              Nhật ký
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'dice' && (
            <View style={styles.diceSection}>
              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.boxTitle, { color: theme.text }]}>Xúc xắc 20 mặt (D20)</Text>
                <Text style={[styles.boxDesc, { color: theme.textSecondary }]}>
                  Dùng để xác định thứ tự đi trước hoặc các hiệu ứng xúc xắc MTG.
                </Text>
                <View style={styles.resultCircle}>
                  <Text style={[styles.resultNumber, { color: d20Result === 20 ? '#22C55E' : d20Result === 1 ? '#EF4444' : theme.text }]}>
                    {d20Result !== null ? d20Result : '-'}
                  </Text>
                  {d20Result === 20 && <Text style={styles.natBadge}>NATURAL 20! 🎯</Text>}
                  {d20Result === 1 && <Text style={styles.fumbleBadge}>CRITICAL 1! 💀</Text>}
                </View>
                <Pressable
                  onPress={rollD20}
                  disabled={isRolling}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: theme.accent, opacity: pressed || isRolling ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="refresh-cw" size={16} color="#000" />
                  <Text style={styles.actionBtnText}>Đổ D20</Text>
                </Pressable>
              </View>

              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.boxTitle, { color: theme.text }]}>Xúc xắc 6 mặt (D6)</Text>
                <Text style={[styles.boxDesc, { color: theme.textSecondary }]}>
                  Đếm counter, token hoặc các lá bài xúc xắc 6 mặt.
                </Text>
                <View style={styles.resultSquare}>
                  <Text style={[styles.resultNumberSmall, { color: theme.text }]}>
                    {d6Result !== null ? d6Result : '-'}
                  </Text>
                </View>
                <Pressable
                  onPress={rollD6}
                  disabled={isRolling}
                  style={({ pressed }) => [
                    styles.actionBtnOutline,
                    { borderColor: theme.accent, opacity: pressed || isRolling ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="refresh-cw" size={16} color={theme.accent} />
                  <Text style={[styles.actionBtnOutlineText, { color: theme.accent }]}>Đổ D6</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === 'coin' && (
            <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.boxTitle, { color: theme.text }]}>Tung Đồng Xu (Coin Flip)</Text>
              <Text style={[styles.boxDesc, { color: theme.textSecondary }]}>
                Chuẩn luật MTG: Heads (Mặt ngửa) hoặc Tails (Mặt úp).
              </Text>
              <View style={styles.coinCircle}>
                <Text style={styles.coinEmoji}>
                  {coinResult === 'HEADS' ? '🪙 NGỬA' : coinResult === 'TAILS' ? '🪙 ÚP' : '🪙'}
                </Text>
                <Text style={[styles.coinText, { color: theme.text }]}>
                  {coinResult ? (coinResult === 'HEADS' ? 'HEADS (Ngửa)' : 'TAILS (Úp)') : 'Chưa tung'}
                </Text>
              </View>
              <Pressable
                onPress={flipCoin}
                disabled={isRolling}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.accent, opacity: pressed || isRolling ? 0.7 : 1 },
                ]}
              >
                <Feather name="disc" size={16} color="#000" />
                <Text style={styles.actionBtnText}>Tung đồng xu</Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'picker' && (
            <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.boxTitle, { color: theme.text }]}>Chọn Người Đi Trước Ngẫu Nhiên</Text>
              <Text style={[styles.boxDesc, { color: theme.textSecondary }]}>
                Hệ thống quay ngẫu nhiên 1 trong {players.length} người chơi trên bàn.
              </Text>
              <View style={[styles.pickedPlayerBox, { borderColor: theme.accent }]}>
                <Feather name="award" size={24} color={theme.accent} />
                <Text style={[styles.pickedPlayerName, { color: theme.text }]}>
                  {pickedPlayer ? pickedPlayer.name : 'Nhấn nút để chọn'}
                </Text>
              </View>
              <Pressable
                onPress={pickFirstPlayer}
                disabled={isRolling}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.accent, opacity: pressed || isRolling ? 0.7 : 1 },
                ]}
              >
                <Feather name="shuffle" size={16} color="#000" />
                <Text style={styles.actionBtnText}>Quay người đi trước</Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'history' && (
            <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.boxTitle, { color: theme.text }]}>Nhật Ký Thay Đổi Máu</Text>
              {history.length === 0 ? (
                <Text style={[styles.emptyHistoryText, { color: theme.textMuted }]}>
                  Chưa có biến động máu nào được ghi nhận trong ván này.
                </Text>
              ) : (
                history.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.historyRow, { borderBottomColor: theme.border }]}
                  >
                    <View style={styles.historyLeft}>
                      <Text style={[styles.historyTime, { color: theme.textMuted }]}>
                        {item.timestamp}
                      </Text>
                      <Text style={[styles.historyPlayer, { color: theme.text }]}>
                        {item.playerName}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text
                        style={[
                          styles.historyDelta,
                          {
                            color: item.changeText.startsWith('+')
                              ? '#22C55E'
                              : '#EF4444',
                          },
                        ]}
                      >
                        {item.changeText}
                      </Text>
                      <Text style={[styles.historyResult, { color: theme.textSecondary }]}>
                        = {item.resultingLife} HP
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    height: '84%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  dragHandleBar: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  diceSection: {
    gap: spacing.lg,
  },
  cardBox: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  boxDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resultCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  resultNumber: {
    fontSize: 42,
    fontWeight: '900',
  },
  natBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#22C55E',
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  fumbleBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#EF4444',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  resultSquare: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  resultNumberSmall: {
    fontSize: 34,
    fontWeight: '900',
  },
  coinCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  coinEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickedPlayerBox: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    gap: spacing.xs,
    width: '100%',
  },
  pickedPlayerName: {
    fontSize: 20,
    fontWeight: '800',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    width: '100%',
    marginTop: spacing.sm,
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHistoryText: {
    fontSize: 13,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyLeft: {
    flex: 1,
  },
  historyTime: {
    fontSize: 11,
  },
  historyPlayer: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDelta: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyResult: {
    fontSize: 11,
  },
});
