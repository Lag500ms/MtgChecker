import type {
  MatchHistoryEntry,
  PlayerCount,
  PlayerState,
  PlayerThemeColor,
  StartingLifeMode,
} from './types';

export const MATCH_STORAGE_KEY = 'mtgchecker.lifetracker.match.v2';

export type CommanderSlot = 'main' | 'partner';

type NumericCounter = 'life' | 'poison' | 'commanderTax' | 'partnerCommanderTax' | 'energy' | 'experience';

type UndoSnapshot = {
  players: PlayerState[];
  history: MatchHistoryEntry[];
};

export type MatchState = {
  playerCount: PlayerCount;
  startingLife: StartingLifeMode;
  players: PlayerState[];
  history: MatchHistoryEntry[];
  undoStack: UndoSnapshot[];
};

export type MatchAction =
  | { type: 'restore'; state: MatchState }
  | { type: 'reset'; count: PlayerCount; life: StartingLifeMode }
  | { type: 'undo' }
  | { type: 'adjust'; playerId: string; field: NumericCounter; delta: number }
  | { type: 'commanderDamage'; targetId: string; attackerId: string; slot: CommanderSlot; delta: number }
  | { type: 'monarch' | 'initiative' | 'partner'; playerId: string }
  | { type: 'rename'; playerId: string; name: string }
  | { type: 'theme'; playerId: string; color: PlayerThemeColor };

const MAX_HISTORY = 80;
const MAX_UNDO = 24;

export function createNewMatch(count: PlayerCount = 4, startingLife: StartingLifeMode = 40): MatchState {
  const colors: PlayerThemeColor[] = ['white', 'blue', 'black', 'red'];
  return {
    playerCount: count,
    startingLife,
    history: [],
    undoStack: [],
    players: Array.from({ length: count }, (_, i) => ({
      id: 'p' + (i + 1),
      name: 'Player ' + (i + 1),
      life: startingLife,
      poison: 0,
      commanderTax: 0,
      partnerCommanderTax: 0,
      hasPartner: false,
      energy: 0,
      experience: 0,
      commanderDamageReceived: {},
      themeColor: colors[i],
      isMonarch: false,
      hasInitiative: false,
    })),
  };
}

function record(
  state: MatchState,
  players: PlayerState[],
  playerId: string,
  changeText: string,
): MatchState {
  const target = players.find((p) => p.id === playerId);
  if (!target) return state;
  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-GB', { hour12: false });
  return {
    ...state,
    players,
    history: [{
      id: 'h_' + now.getTime() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp,
      playerId,
      playerName: target.name,
      changeText,
      resultingLife: target.life,
    }, ...state.history].slice(0, MAX_HISTORY),
    undoStack: [...state.undoStack, { players: state.players, history: state.history }].slice(-MAX_UNDO),
  };
}

export function commanderDamageKey(attackerId: string, slot: CommanderSlot): string {
  return slot === 'partner' ? attackerId + ':partner' : attackerId;
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  if (action.type === 'restore') return action.state;
  if (action.type === 'reset') return createNewMatch(action.count, action.life);
  if (action.type === 'undo') {
    const last = state.undoStack[state.undoStack.length - 1];
    if (!last) return state;
    return {
      ...state,
      players: last.players,
      history: last.history,
      undoStack: state.undoStack.slice(0, -1),
    };
  }

  const playerId = action.type === 'commanderDamage' ? action.targetId : action.playerId;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  if (action.type === 'adjust') {
    if (!Number.isInteger(action.delta) || action.delta === 0) return state;
    const current = player[action.field];
    const next = action.field === 'life'
      ? current + action.delta
      : Math.max(0, current + action.delta);
    if (next === current) return state;
    const diff = next - current;
    const players = state.players.map((p) => p.id === player.id ? { ...p, [action.field]: next } : p);
    const label = action.field === 'commanderTax' ? 'Commander casts' :
      action.field === 'partnerCommanderTax' ? 'Partner casts' :
      action.field.charAt(0).toUpperCase() + action.field.slice(1);
    return record(state, players, player.id, label + ' ' + (diff > 0 ? '+' : '') + diff);
  }

  if (action.type === 'commanderDamage') {
    if (action.targetId === action.attackerId || !state.players.some((p) => p.id === action.attackerId)) {
      return state;
    }
    const key = commanderDamageKey(action.attackerId, action.slot);
    const current = player.commanderDamageReceived[key] || 0;
    const next = Math.max(0, current + action.delta);
    const actual = next - current;
    if (!actual) return state;
    const attacker = state.players.find((p) => p.id === action.attackerId);
    const players = state.players.map((p) =>
      p.id === player.id ? {
        ...p,
        life: p.life - actual,
        commanderDamageReceived: { ...p.commanderDamageReceived, [key]: next },
      } : p
    );
    const source = attacker?.name || action.attackerId;
    const label = (actual > 0 ? '-' : '+') + Math.abs(actual) +
      ' life, Commander damage from ' + source +
      (action.slot === 'partner' ? ' (Partner)' : '') +
      ' (' + (actual > 0 ? '+' : '') + actual + ' damage)';
    return record(state, players, player.id, label);
  }

  if (action.type === 'rename') {
    const name = action.name.trim().slice(0, 20);
    if (!name || name === player.name) return state;
    return record(state, state.players.map((p) => p.id === player.id ? { ...p, name } : p), player.id, 'Renamed to ' + name);
  }

  if (action.type === 'theme') {
    if (player.themeColor === action.color) return state;
    return record(state, state.players.map((p) => p.id === player.id ? { ...p, themeColor: action.color } : p),
      player.id, 'Changed player color');
  }

  if (action.type === 'partner') {
    return record(state, state.players.map((p) => p.id === player.id ? { ...p, hasPartner: !p.hasPartner } : p),
      player.id, player.hasPartner ? 'Partner disabled' : 'Partner enabled');
  }

  if (action.type === 'monarch') {
    const enable = !player.isMonarch;
    return record(state, state.players.map((p) => ({ ...p, isMonarch: p.id === player.id ? enable : false })),
      player.id, enable ? 'Became Monarch' : 'Monarch removed');
  }

  if (action.type === 'initiative') {
    const enable = !player.hasInitiative;
    return record(state, state.players.map((p) => ({ ...p, hasInitiative: p.id === player.id ? enable : false })),
      player.id, enable ? 'Took the Initiative' : 'Initiative removed');
  }

  return state;
}

export function serializeMatch(state: MatchState): string {
  return JSON.stringify({ version: 2, ...state, updatedAt: new Date().toISOString() });
}

export function restoreMatch(value: string): MatchState | null {
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== 'object') return null;
    const saved = data as Partial<MatchState> & { version?: number };
    if (saved.version !== 2 || ![2, 3, 4].includes(Number(saved.playerCount)) ||
      ![20, 30, 40].includes(Number(saved.startingLife)) ||
      !Array.isArray(saved.players) || saved.players.length !== saved.playerCount) return null;

    const cleanPlayers = saved.players.map((p, i) => {
      if (!p || p.id !== 'p' + (i + 1) || typeof p.life !== 'number' || !Number.isFinite(p.life)) {
        throw new Error('Invalid saved player');
      }
      const cleanDamage: Record<string, number> = {};
      if (p.commanderDamageReceived && typeof p.commanderDamageReceived === 'object') {
        for (const [key, amount] of Object.entries(p.commanderDamageReceived)) {
          if (/^p[1-4](:partner)?$/.test(key) && typeof amount === 'number' && Number.isFinite(amount)) {
            cleanDamage[key] = Math.max(0, amount);
          }
        }
      }
      const safeCounter = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
      return {
        ...p,
        name: typeof p.name === 'string' ? p.name.slice(0, 20) : 'Player ' + (i + 1),
        poison: safeCounter(p.poison),
        commanderTax: safeCounter(p.commanderTax),
        partnerCommanderTax: safeCounter(p.partnerCommanderTax),
        energy: safeCounter(p.energy),
        experience: safeCounter(p.experience),
        hasPartner: Boolean(p.hasPartner),
        isMonarch: Boolean(p.isMonarch),
        hasInitiative: Boolean(p.hasInitiative),
        commanderDamageReceived: cleanDamage,
      } as PlayerState;
    });
    const history = Array.isArray(saved.history) ? saved.history.slice(0, MAX_HISTORY) : [];
    return {
      playerCount: saved.playerCount,
      startingLife: saved.startingLife as StartingLifeMode,
      players: cleanPlayers,
      history,
      undoStack: [],
    };
  } catch {
    return null;
  }
}
