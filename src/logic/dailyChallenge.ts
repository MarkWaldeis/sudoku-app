import { generateSudokuSeeded, type Board } from './sudokuGenerator';

/** Local-time date key, e.g. '2026-08-01'. */
export const getDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Stable 32-bit FNV-1a hash of a date key, used as generator seed. */
export const seedFromDateKey = (dateKey: string): number => {
  let hash = 0x811C9DC5;
  for (let i = 0; i < dateKey.length; i++) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * Deterministic difficulty rotation by weekday:
 * So/Mo easy, Di/Mi medium, Do/Fr/Sa hard.
 */
export const getDailyDifficulty = (dateKey: string): 'easy' | 'medium' | 'hard' => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, (m || 1) - 1, d || 1).getDay();
  if (weekday <= 1) return 'easy';
  if (weekday <= 3) return 'medium';
  return 'hard';
};

/** Deterministic daily puzzle for a date key ('YYYY-MM-DD'). */
export const generateDailyPuzzle = (dateKey: string): { puzzle: Board; solution: Board } =>
  generateSudokuSeeded(getDailyDifficulty(dateKey), seedFromDateKey(dateKey));

// ---------------------------------------------------------------------------
// Challenge codes
// ---------------------------------------------------------------------------

const digitValue = (ch: string): number => parseInt(ch, 36);

const checksum = (digits: string): string => {
  let sum = 0;
  for (const ch of digits) sum += digitValue(ch);
  return (sum % 36).toString(36).toUpperCase();
};

/**
 * Encode a seed as Base36 (uppercase) plus one check character
 * (sum of the digit values mod 36).
 */
export const encodeChallenge = (seed: number): string => {
  const s = Math.abs(Math.floor(seed)) >>> 0;
  const digits = s.toString(36).toUpperCase();
  return digits + checksum(digits);
};

/**
 * Decode a challenge code back to the seed. Tolerates lowercase and
 * hyphens/whitespace. Returns null for any invalid code.
 */
export const decodeChallenge = (code: string): number | null => {
  if (typeof code !== 'string') return null;
  const normalized = code.toUpperCase().replace(/[\s-]+/g, '');
  if (!/^[0-9A-Z]{2,}$/.test(normalized)) return null;
  const digits = normalized.slice(0, -1);
  const check = normalized.slice(-1);
  if (checksum(digits) !== check) return null;
  const seed = parseInt(digits, 36);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) return null;
  return seed;
};

/** Random 32-bit seed for player-created challenges. */
export const generateRandomChallengeSeed = (): number =>
  Math.floor(Math.random() * 0x100000000) >>> 0;
