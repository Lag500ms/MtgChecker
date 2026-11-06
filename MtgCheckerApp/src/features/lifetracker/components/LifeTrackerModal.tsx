import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ui';
import { borderRadius, spacing } from '@/lib/theme';
import { PlayerCard } from './PlayerCard';
import { TableToolsModal } from './TableToolsModal';
import type {
  MatchHistoryEntry,
  PlayerCount,
  PlayerState,
  PlayerThemeColor,
  StartingLifeMode,
} from '../types';

interface LifeTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  initialPlayerCount?: PlayerCount;
  initialLife?: StartingLifeMode;
}

const createInitialPlayers = (
  count: PlayerCount,
  startingLife: number
): PlayerState[] => {
  const defaultColors: PlayerThemeColor[] = [
    'white',
    'blue',
    'black',
    'red',
  ];
  const list: PlayerState[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      life: startingLife,
      poison: 0,
      commanderTax: 0,
      energy: 0,
      experience: 0,
      commanderDamageReceived: {},
      themeColor: defaultColors[i] || 'colorless',
      isMonarch: false,
      hasInitiative: false,
    });
  }
  return list;
};

export function LifeTrackerModal({
  visible,
  onClose,
  initialPlayerCount = 4,
  initialLife = 40,
}: LifeTrackerModalProps) {
  const insets = useSafeAreaInsets();

  const [playerCount, setPlayerCount] = useState<PlayerCount>(initialPlayerCount);
  const [startingLife, setStartingLife] = useState<StartingLifeMode>(initialLife);
  const [players, setPlayers] = useState<PlayerState[]>(() =>
    createInitialPlayers(initialPlayerCount, initialLife)
  );
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);

  const resetGame = (newStartingLife: StartingLifeMode, newCount?: PlayerCount) => {
    const count = newCount !== undefined ? newCount : playerCount;
    setStartingLife(newStartingLife);
    setPlayerCount(count);
    setPlayers(createInitialPlayers(count, newStartingLife));
    setHistory([]);
  };

  const handleConfirmReset = () => {
    setResetConfirmVisible(true);
  };

  const logHistoryChange = (
    playerId: string,
    changeText: string,
    resultingLife: number
  ) => {
    const targetPlayer = players.find((p) => p.id === playerId);
    if (!targetPlayer) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setHistory((prev) => [
      {
        id: `h_${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        playerId,
        playerName: targetPlayer.name,
        changeText,
        resultingLife,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const handleUpdateLife = (playerId: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const newLife = p.life + delta;
        logHistoryChange(
          playerId,
          delta > 0 ? `+${delta}` : `${delta}`,
          newLife
        );
        return { ...p, life: newLife };
      })
    );
  };

  const handleUpdatePoison = (playerId: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const newPoison = Math.max(0, p.poison + delta);
        return { ...p, poison: newPoison };
      })
    );
  };

  const handleUpdateCommanderTax = (playerId: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const newTax = Math.max(0, p.commanderTax + delta);
        return { ...p, commanderTax: newTax };
      })
    );
  };

  const handleUpdateEnergy = (playerId: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const newEnergy = Math.max(0, p.energy + delta);
        return { ...p, energy: newEnergy };
      })
    );
  };

  const handleUpdateCommanderDamage = (
    targetPlayerId: string,
    fromPlayerId: string,
    delta: number
  ) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== targetPlayerId) return p;
        const currentVal = p.commanderDamageReceived[fromPlayerId] || 0;
        const newVal = Math.max(0, currentVal + delta);
        const newLife = p.life - delta;
        logHistoryChange(
          targetPlayerId,
          delta > 0
            ? `-${delta} (Tướng P${fromPlayerId.replace('p', '')})`
            : `+${Math.abs(delta)} (Tướng P${fromPlayerId.replace('p', '')})`,
          newLife
        );
        return {
          ...p,
          life: newLife,
          commanderDamageReceived: {
            ...p.commanderDamageReceived,
            [fromPlayerId]: newVal,
          },
        };
      })
    );
  };

  const handleToggleMonarch = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        isMonarch: p.id === playerId ? !p.isMonarch : false,
      }))
    );
  };

  const handleToggleInitiative = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        hasInitiative: p.id === playerId ? !p.hasInitiative : false,
      }))
    );
  };

  const handleChangeTheme = (playerId: string, color: PlayerThemeColor) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, themeColor: color } : p))
    );
  };

  const togglePlayerCount = () => {
    const nextCount = playerCount === 2 ? 4 : 2;
    resetGame(startingLife, nextCount);
  };

  /* Render 2 người chơi (nửa trên P2 xoay 180°, nửa dưới P1) */
  const renderTwoPlayers = () => {
    const p1 = players[0];
    const p2 = players[1];
    if (!p1 || !p2) return null;

    return (
      <View style={styles.boardGrid}>
        <View style={styles.halfScreen}>
          <PlayerCard
            player={p2}
            otherPlayers={[p1]}
            rotate180={true}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
        </View>
        <View style={styles.halfScreen}>
          <PlayerCard
            player={p1}
            otherPlayers={[p2]}
            rotate180={false}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
        </View>
      </View>
    );
  };

  /* Render 4 người chơi (Góc trên P2, P3 xoay 180°. Góc dưới P1, P4 xoay 0°) */
  const renderFourPlayers = () => {
    const p1 = players[0];
    const p2 = players[1];
    const p3 = players[2];
    const p4 = players[3];
    if (!p1 || !p2 || !p3 || !p4) return null;

    return (
      <View style={styles.boardGrid}>
        {/* Hàng trên xoay 180 độ đối diện */}
        <View style={styles.row}>
          <PlayerCard
            player={p3}
            otherPlayers={[p1, p2, p4]}
            rotate180={true}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
          <PlayerCard
            player={p2}
            otherPlayers={[p1, p3, p4]}
            rotate180={true}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
        </View>

        {/* Hàng dưới bình thường 0 độ */}
        <View style={styles.row}>
          <PlayerCard
            player={p1}
            otherPlayers={[p2, p3, p4]}
            rotate180={false}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
          <PlayerCard
            player={p4}
            otherPlayers={[p1, p2, p3]}
            rotate180={false}
            onUpdateLife={handleUpdateLife}
            onUpdatePoison={handleUpdatePoison}
            onUpdateCommanderTax={handleUpdateCommanderTax}
            onUpdateEnergy={handleUpdateEnergy}
            onUpdateCommanderDamage={handleUpdateCommanderDamage}
            onToggleMonarch={handleToggleMonarch}
            onToggleInitiative={handleToggleInitiative}
            onChangeTheme={handleChangeTheme}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar hidden={true} />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {playerCount === 2 ? renderTwoPlayers() : renderFourPlayers()}

        {/* Trung tâm điều khiển nổi (Floating Center Hub) */}
        <View style={styles.centerHub}>
          <Pressable
            onPress={togglePlayerCount}
            style={styles.hubBtn}
            hitSlop={6}
          >
            <Text style={styles.hubBtnText}>{playerCount}P</Text>
          </Pressable>

          <Pressable
            onPress={() => setToolsVisible(true)}
            style={styles.hubBtnAccent}
            hitSlop={6}
          >
            <Feather name="box" size={16} color="#000" />
          </Pressable>

          <Pressable
            onPress={handleConfirmReset}
            style={styles.hubBtn}
            hitSlop={6}
          >
            <Feather name="rotate-ccw" size={14} color="#FFF" />
          </Pressable>

          <Pressable
            onPress={onClose}
            style={styles.hubBtnClose}
            hitSlop={6}
          >
            <Feather name="x" size={14} color="#FFF" />
          </Pressable>
        </View>

        {/* Modal Tiện ích bàn đấu: Xúc xắc, đồng xu, chọn người đi trước */}
        <TableToolsModal
          visible={toolsVisible}
          onClose={() => setToolsVisible(false)}
          players={players}
          history={history}
        />

        <ConfirmModal
          visible={resetConfirmVisible}
          title="Bắt đầu ván đấu mới?"
          message="Toàn bộ điểm máu, sát thương tướng và bộ đếm sẽ được khôi phục về trạng thái ban đầu."
          confirmLabel={`Làm mới (${startingLife} HP)`}
          cancelLabel="Hủy"
          icon="rotate-ccw"
          isDestructive={true}
          onConfirm={() => {
            resetGame(startingLife);
            setResetConfirmVisible(false);
          }}
          onCancel={() => setResetConfirmVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
    position: 'relative',
  },
  boardGrid: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  centerHub: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -22 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    gap: 8,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  hubBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBtnAccent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBtnClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
