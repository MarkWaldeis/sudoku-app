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

## 📦 Kürzlich umgesetzt
- **Duolingo Shop System (`ShopModal.tsx`)**: Kaufen von Herzen-Auffüllungen, Tipp-Paketen, Streak-Schutz und freischaltbaren Maskottchen-Skins.
- **Edelsteine-Währung (💎)**: Belohnungssystem für gelöste Züge, geschaffte Level und Schnelligkeits-Boni.
- **💡 Tipp-System**: Interaktiver Tipp-Button in den Sudoku-Bedienelementen mit gelber Leucht-Animation (`hintedCell`) und automatischer Feldfindung.
- **⏱️ Zeit-Bonus (Speed Bonus)**: Live-Timer in der Kopfzeile und Extra-Edelsteine & XP bei schnellem Lösen.
- **🎭 Maskottchen-Skins**: 4 freischaltbare Skins (SudoBuddy 👾, Schlauer Fuchs 🦊, König Sudo 👑, Zahlen-Ninja 🥷) mit dynamischer Vorschau im Shop und Anbindung an `MascotAssistant.tsx`.
- **Git Push & Host:** Vollständiges Deployment auf GitHub `main`.

---

## 🎯 Nächste geplante Meilensteine
1. Cloud-Synchronisation (z.B. via Supabase oder Sync-Code) für spielstandübergreifendes Spielen auf PC & Handy.
2. Tägliche Sudoku-Herausforderungen ("Daily Quests").


