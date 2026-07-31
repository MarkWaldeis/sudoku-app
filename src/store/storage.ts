import localforage from 'localforage';

/**
 * Resilient persistence layer.
 *
 * localforage already degrades IndexedDB -> WebSQL -> localStorage. On top of
 * that we keep an in-memory fallback so the app stays fully playable when
 * every persistent driver is unavailable (e.g. iOS private browsing, blocked
 * cookies/storage, quota errors). Nothing ever throws out of this module.
 */

const storage = localforage.createInstance({
  name: 'sudoku-app',
  storeName: 'game_data',
});

const memoryFallback = new Map<string, unknown>();
let persistentAvailable = true;

const safeSet = async (key: string, value: unknown): Promise<void> => {
  memoryFallback.set(key, value); // always keep the hot copy
  if (!persistentAvailable) return;
  try {
    await storage.setItem(key, value);
  } catch {
    persistentAvailable = false; // storage blocked -> stay in-memory for this session
  }
};

const safeGet = async <T>(key: string): Promise<T | null> => {
  if (persistentAvailable) {
    try {
      const value = await storage.getItem<T>(key);
      if (value !== null && value !== undefined) return value;
    } catch {
      persistentAvailable = false;
    }
  }
  return (memoryFallback.get(key) as T) ?? null;
};

// ---------------------------------------------------------------------------
// Saved game
// ---------------------------------------------------------------------------

const isValidBoard = (board: unknown): boolean =>
  Array.isArray(board) &&
  board.length === 9 &&
  board.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 9 &&
      row.every((cell) => cell === null || (Number.isInteger(cell) && cell >= 1 && cell <= 9))
  );

/** Only accept persisted game state that matches the expected shape. */
const sanitizeGameState = (raw: unknown): unknown | null => {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (!isValidBoard(s.board) || !isValidBoard(s.initialBoard)) return null;
  if (!Array.isArray(s.obfuscatedSolution) || s.obfuscatedSolution.length !== 9) return null;
  if (typeof s.lives !== 'number' || s.lives < 0 || s.lives > 3) return null;
  return s;
};

export const saveGame = async (state: unknown): Promise<void> => {
  await safeSet('saved_game', state);
};

export const loadGame = async (): Promise<unknown | null> => {
  const raw = await safeGet<unknown>('saved_game');
  return sanitizeGameState(raw);
};

export const clearGame = async (): Promise<void> => {
  memoryFallback.delete('saved_game');
  if (!persistentAvailable) return;
  try {
    await storage.removeItem('saved_game');
  } catch {
    persistentAvailable = false;
  }
};

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

const MASCOT_SKINS = ['default', 'fox', 'king', 'ninja'] as const;

export interface UserProfile {
  xp: number;
  gems: number;
  hints: number;
  streak: number;
  streakFreeze: number;
  lastPlayedDate: string | null;
  unlockedLevels: number[];
  totalGamesPlayed: number;
  correctMoves: number;
  incorrectMoves: number;
  selectedMascotSkin: (typeof MASCOT_SKINS)[number];
  unlockedSkins: string[];
}

export const defaultProfile: UserProfile = {
  xp: 0,
  gems: 100,
  hints: 3,
  streak: 0,
  streakFreeze: 0,
  lastPlayedDate: null,
  unlockedLevels: [1],
  totalGamesPlayed: 0,
  correctMoves: 0,
  incorrectMoves: 0,
  selectedMascotSkin: 'default',
  unlockedSkins: ['default'],
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Never trust persisted data blindly: corrupted or hand-edited storage must
 * not crash the app or grant impossible values. Every field is type-checked
 * and clamped to its legal range.
 */
const sanitizeProfile = (raw: unknown): UserProfile => {
  if (!raw || typeof raw !== 'object') return defaultProfile;
  const p = raw as Partial<UserProfile>;

  const unlockedLevels = Array.isArray(p.unlockedLevels)
    ? [...new Set(p.unlockedLevels.filter((l): l is number => Number.isInteger(l) && l >= 1 && l <= 21))]
    : [1];
  if (unlockedLevels.length === 0) unlockedLevels.push(1);

  const unlockedSkins = Array.isArray(p.unlockedSkins)
    ? p.unlockedSkins.filter((s): s is string => typeof s === 'string' && (MASCOT_SKINS as readonly string[]).includes(s))
    : ['default'];
  if (!unlockedSkins.includes('default')) unlockedSkins.push('default');

  const skin = MASCOT_SKINS.includes(p.selectedMascotSkin as (typeof MASCOT_SKINS)[number])
    ? (p.selectedMascotSkin as UserProfile['selectedMascotSkin'])
    : 'default';

  return {
    xp: clampInt(p.xp, 0, 10_000_000, 0),
    gems: clampInt(p.gems, 0, 1_000_000, 100),
    hints: clampInt(p.hints, 0, 999, 3),
    streak: clampInt(p.streak, 0, 100_000, 0),
    streakFreeze: clampInt(p.streakFreeze, 0, 99, 0),
    lastPlayedDate: typeof p.lastPlayedDate === 'string' ? p.lastPlayedDate.slice(0, 64) : null,
    unlockedLevels,
    totalGamesPlayed: clampInt(p.totalGamesPlayed, 0, 1_000_000, 0),
    correctMoves: clampInt(p.correctMoves, 0, 10_000_000, 0),
    incorrectMoves: clampInt(p.incorrectMoves, 0, 10_000_000, 0),
    selectedMascotSkin: skin,
    unlockedSkins,
  };
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  await safeSet('user_profile', profile);
};

export const loadProfile = async (): Promise<UserProfile> => {
  const raw = await safeGet<unknown>('user_profile');
  return sanitizeProfile(raw);
};
