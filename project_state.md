# Project State: Gamified Duolingo Sudoku PWA

**Letztes Update:** 1. August 2026  
**Technologie-Stack:** Vite, React, TypeScript, Framer Motion, Web Audio API, localforage (IndexedDB), GitHub Pages.

---

## 💡 Projektübersicht
Eine produktionsreife, spielerische Sudoku-PWA im ikonischen **Duolingo 3D-Look** mit:
- Kampagnen-Pfad mit 20 Leveln & 3 Kapiteln (Anfänger, Fortgeschritten, Meister).
- Web Audio API Sound-Synthesizer (keine MP3s notwendig).
- Leben-System (3 Herzen), Streak-Tageszähler, XP & Combos.
- Responsive mobile Bottom-Navigation, Stats-Modal & Leaderboard.
- Dark Mode, Daily Challenge, Duell-Codes, Technik-Schule und Pause/Zen.

---

## 🏗️ Architektur & Daten-Flow
- `src/store/GameContext.tsx`: Haupt-State-Provider für Board, PencilMarks, Anti-Cheat Obfuscation, Leben & Profil; Settings, Sync-Codes, seeded Games.
- `src/store/storage.ts`: Persistenz via `localforage` (Profil inkl. Theme/Zen/History/Daily-Completion).
- `src/logic/sudokuGenerator.ts`: Backtracking-Generator + deterministische Seeds (`generateSudokuSeeded`).
- `src/logic/dailyChallenge.ts`: Tages-Key, Seed, Difficulty-Rotation, Challenge-Code Encode/Decode.
- `src/logic/sudokuTechniques.ts`: Naked/Hidden Single, Naked Pair → erklärende Hints.
- `src/logic/campaignLevels.ts`: 20 vordefinierte Level-Konfigurationen.
- `src/services/leaderboardService.ts`: Ranking & Highscore Management.

---

## 📦 Kürzlich umgesetzt

### Phase 2 — UI Teil 1
- **Dark Mode**: `profile.theme` → `<html data-theme="dark|light">`, CSS-Variablen in `duolingo.css`.
- **Settings-Modal** (`SettingsModal.tsx`): Theme, Zen-Modus, Fehler-Highlight, Auto-Pencil-Cleanup, Sync-Code Export/Import.
- **Daily Challenge** (`DailyChallengeModal.tsx` + `dailyChallenge.ts`): Kalender-UI, deterministisches Puzzle pro Tag, `dailyCompleted` im Profil.
- **Stats-Erweiterung** (`StatsModal.tsx`): Spielhistorie, Fehlerquote, mehr KPIs.

### Phase 3 — UI Teil 2
- **Pause / Zen**: Pause-Overlay (Anti-Peek, Timer gestoppt); Zen blendet den Timer aus.
- **Fehler-Highlight**: Optionales Rot-Markieren falscher Einträge (`errorHighlight` + Board-Zellen).
- **Technik-Tipps**: `findTechniqueHint` im Hint-Flow mit Maskottchen-Erklärung.
- **Challenge-Codes / Duell** (`ChallengeModal.tsx`): Code erzeugen/teilen, beitreten, `#challenge=CODE` Deep-Link.
- **Boss-Intro**: Extrem startet über dramatisches Intro-Modal vor dem 17-Clue-Boss.
- **Technik-Schule** (`TechniqueSchoolModal.tsx`): Lerninhalte zu Sudoku-Techniken.
- **Adaptive Empfehlung**: Maskottchen-Tipps aus den letzten ~5 Spielen (Fehler/Zeit/Schwierigkeit).

### Bereits etabliert
- Shop, Gems, Hints, Speed-Bonus, Maskottchen-Skins, Extrem-Level, Victory-Wave, PWA Service Worker.

---

## ✅ Qualität (Stand 01.08.2026)
- `npm run build` (`tsc -b && vite build`): **PASS**
- `npm run lint` (`oxlint`): **0 Errors** (1 Fast-Refresh-Hinweis in `GameContext`)

---

## 🎯 Nächste geplante Meilensteine
1. Echte Cloud-Sync (Supabase o.ä.) zusätzlich zum lokalen Sync-Code.
2. Mehr Techniken in der Schule (Pointing Pairs, X-Wing, …).
3. Optional: Freunde-Leaderboard für Daily/Duell-Zeiten.
