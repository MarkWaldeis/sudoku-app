/**
 * Central mascot skin definitions, shared by the shop and the mascot
 * assistant. Skins either reference an image in `public/` or render a
 * plain emoji – emoji skins need no assets at all.
 */
export interface MascotSkinDef {
  id: string;
  name: string;
  cost: number;
  desc: string;
  /** File name inside `public/` (rendered via BASE_URL). */
  image?: string;
  /** Emoji rendered instead of an image. */
  emoji?: string;
}

export const MASCOT_SKINS: MascotSkinDef[] = [
  { id: 'default', name: 'SudoBuddy', cost: 0, desc: 'Klassisches Maskottchen', image: 'mascot.jpg' },
  { id: 'fox', name: 'Schlauer Fuchs', cost: 300, desc: 'Mit scharfer Brille für Mathe-Genies', image: 'mascot_fox.jpg' },
  { id: 'robot', name: 'Sudo-Bot', cost: 400, desc: 'Rechnet in Lichtgeschwindigkeit', emoji: '🤖' },
  { id: 'king', name: 'König Sudo', cost: 500, desc: 'Königlicher Look mit goldener Krone', image: 'mascot_king.jpg' },
  { id: 'unicorn', name: 'Einhorn Glitzi', cost: 600, desc: 'Magische Zahlen-Power', emoji: '🦄' },
  { id: 'ninja', name: 'Zahlen Ninja', cost: 750, desc: 'Lautlos & blitzschnell beim Lösen', image: 'mascot_ninja.jpg' },
  { id: 'panda', name: 'Zen-Panda', cost: 800, desc: 'Bleibt immer ruhig & fokussiert', emoji: '🐼' },
  { id: 'alien', name: 'Alien Zork', cost: 1000, desc: 'Löst Sudokus in 9 Dimensionen', emoji: '👽' },
];

export const MASCOT_SKIN_IDS: readonly string[] = MASCOT_SKINS.map((s) => s.id);

export const getSkinById = (id: string): MascotSkinDef =>
  MASCOT_SKINS.find((s) => s.id === id) ?? MASCOT_SKINS[0];
