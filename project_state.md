# Project State: Gamified Duolingo Sudoku PWA

**Letztes Update:** 26. Juli 2026  
**Technologie-Stack:** Vite, React, TypeScript, Framer Motion, Web Audio API, localforage (IndexedDB), GitHub Pages.

---

## 💡 Projektübersicht
Eine produktionsreife, spielerische Sudoku-PWA im ikonischen **Duolingo 3D-Look** mit:
- Kampagnen-Pfad mit 20 Leveln & 3 Kapiteln (Anfänger, Fortgeschritten, Meister).
- Web Audio API Sound-Synthesizer (keine MP3s notwendig).
- Leben-System (3 Herzen), Streak-Tageszähler, XP & Combos.
- Responsive mobile Bottom-Navigation, Stats-Modal & Leaderboard.

---

## 🏗️ Architektur & Daten-Flow
- `src/store/GameContext.tsx`: Haupt-State-Provider für Board, PencilMarks, Anti-Cheat Obfuscation, Leben & Profil.
- `src/store/storage.ts`: Persistenz via `localforage` für flüssige Offline-Nutzung.
- `src/logic/sudokuGenerator.ts`: Backtracking-Generator für eindeutig lösbare Sudokus.
- `src/logic/campaignLevels.ts`: 20 vordefinierte Level-Konfigurationen.
- `src/services/leaderboardService.ts`: Ranking & Highscore Management.

---

## 🎯 Nächste geplante Meilensteine
1. Erweiterung der Supabase Cloud-Anbindung für Multiplayer-Duelle.
2. Tägliche Sudoku-Herausforderungen ("Daily Quest").
3. Zusätzliche Sounds & Duo-Mascot Skins.
