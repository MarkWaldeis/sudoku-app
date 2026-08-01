import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { SudokuBoard } from './components/ui/SudokuBoard';
import { HeaderStats } from './components/ui/HeaderStats';
import { LevelPathMap } from './components/ui/LevelPathMap';
import { MascotAssistant } from './components/ui/MascotAssistant';
import { ModalShell } from './components/ui/ModalShell';
import { MapIcon, BoltIcon, SkullIcon, CartIcon, UndoIcon, RedoIcon, CheckIcon, CloseIcon, HeartIcon, GemIcon, PartyIcon, GearIcon, CalendarIcon, PauseIcon, PlayIcon, SwordsIcon, GradCapIcon } from './components/ui/icons';
import { playPop, playVictoryFanfare, playErrorBuzz, playWhoosh } from './utils/soundEffects';
import { hapticTap, hapticVictory, hapticError } from './utils/haptics';
import { campaignLevels } from './logic/campaignLevels';
import { getDateKey, seedFromDateKey, getDailyDifficulty, encodeChallenge, decodeChallenge } from './logic/dailyChallenge';
import { BottomNav } from './components/ui/BottomNav';
import { StatsModal } from './components/ui/StatsModal';
import { LeaderboardModal } from './components/ui/LeaderboardModal';
import { ShopModal } from './components/ui/ShopModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { DailyChallengeModal } from './components/ui/DailyChallengeModal';
import { ChallengeModal } from './components/ui/ChallengeModal';
import { TechniqueSchoolModal } from './components/ui/TechniqueSchoolModal';
import type { UserProfile } from './store/storage';
import './styles/duolingo.css';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';

const COMBO_MESSAGES = [
  'Combo x{combo}! Du bist auf einem Lauf! 🔥',
  'x{combo} Combo – unaufhaltsam! Weiter so!',
  'Wow, x{combo} in Folge! Du bist eine Sudoku-Maschine!',
];

const MISTAKE_MESSAGES = [
  'Autsch! Das war leider falsch. Atme tief durch – du schaffst das!',
  'Nicht ganz richtig. Schau dir Zeile, Spalte und Block nochmal genau an!',
  'Fehler passieren! Tipp: Nutze Notizen, um Kandidaten zu merken.',
];

const pickMessage = (list: string[], seed: number, combo?: number): string => {
  const msg = list[Math.abs(seed) % list.length];
  return combo !== undefined ? msg.replace('{combo}', String(combo)) : msg;
};

// --- UI-Teil 2: Adaptive Maskottchen-Empfehlung aus der Spiel-Historie ---
const DIFF_INDEX: Record<string, number> = { easy: 0, medium: 1, hard: 2, extreme: 3 };
const DIFF_LABELS = ['Leicht', 'Mittel', 'Schwer', 'Extrem'];
// Richtwerte (Sekunden), ab denen ein Spiel als "schnell" gilt
const FAST_TIME: Record<string, number> = { easy: 240, medium: 360, hard: 600, extreme: 900 };

/** Gibt eine Empfehlung basierend auf den letzten ~5 Spielen zurück, sonst null. */
const getAdaptiveTip = (profile: UserProfile): string | null => {
  const recent = profile.gameHistory.slice(-5);
  if (recent.length === 0) return null;
  const avgMistakes = recent.reduce((sum, e) => sum + e.mistakes, 0) / recent.length;
  const lastDiff = recent[recent.length - 1].difficulty;
  const idx = DIFF_INDEX[lastDiff] ?? 0;

  if (avgMistakes > 3) {
    const easier = idx > 0 ? ` Starte ruhig ein ${DIFF_LABELS[idx - 1]}-Level zum Aufwärmen!` : '';
    return `Versuch es mit Notizen (Taste N), um Kandidaten festzuhalten – das reduziert Fehler enorm!${easier} 📝`;
  }
  const avgTime = recent.reduce((sum, e) => sum + e.timeSeconds, 0) / recent.length;
  if (avgMistakes <= 1 && avgTime > 0 && avgTime <= (FAST_TIME[lastDiff] ?? 300)) {
    const harder = idx < 2 ? `Wage dich an ${DIFF_LABELS[idx + 1]}!` : 'Der Extrem-Boss wartet auf dich! 💀';
    return `Wow, schnell und fehlerfrei! Zeit für mehr Herausforderung: ${harder} 🚀`;
  }
  return null;
};

const fireVictoryConfetti = () => {
  // Center burst
  confetti({ particleCount: 160, spread: 75, origin: { y: 0.6 }, zIndex: 3000 });
  // Side cannons, staggered for a premium feel
  setTimeout(() => {
    confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, zIndex: 3000 });
    confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, zIndex: 3000 });
  }, 250);
};

const MainAppContent: React.FC = () => {
  const { state, profile, startNewGame, undo, redo, checkSolution, completeLevel } = useGame();
  const [view, setView] = useState<'campaign' | 'game'>('campaign');
  const [mascotMessage, setMascotMessage] = useState('Willkommen! Wähle ein Level auf dem Pfad.');
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryWave, setVictoryWave] = useState(false);
  const victoryWaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [playingLevel, setPlayingLevel] = useState<number | null>(null);
  const [playingDifficulty, setPlayingDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('easy');

  // --- UI-Teil 1: Settings-/Daily-Modals + Mistakes-Tracking ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  // Fehlerzähler pro Spiel (Dedup über lastMoveResult.at, siehe Effekt unten)
  const mistakesRef = useRef(0);
  const lastWrongAtRef = useRef<number | null>(null);

  // --- UI-Teil 2: Pause, Duell, Schule, Boss-Intro ---
  const [isPaused, setIsPaused] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showBossIntro, setShowBossIntro] = useState(false);

  // Dark/Light-Theme auf <html> spiegeln (Variable-Sets in duolingo.css)
  useEffect(() => {
    document.documentElement.dataset.theme = profile.theme;
  }, [profile.theme]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [victoryStats, setVictoryStats] = useState<{ xpGained: number; gemsGained: number; speedBonusGems: number; xpBoosted: boolean; streakFreezeUsed: boolean } | null>(null);

  const hasActiveGame = view === 'game' && !!state && !state.isGameOver && !showVictoryModal && !victoryWave && !isPaused;

  // Pause automatisch beenden bei View-Wechsel oder Spielende
  useEffect(() => {
    if (view !== 'game' || state?.isGameOver) setIsPaused(false);
  }, [view, state?.isGameOver]);

  // Clear the pending victory-wave timeout on unmount
  useEffect(() => {
    return () => {
      if (victoryWaveTimeoutRef.current) clearTimeout(victoryWaveTimeoutRef.current);
    };
  }, []);

  // Timer interval – depends on *whether* a game runs, not on every move
  useEffect(() => {
    if (!hasActiveGame) return;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveGame]);

  // Game over feedback
  useEffect(() => {
    if (state?.isGameOver) {
      playErrorBuzz();
      hapticError();
      setMascotMessage('Oje! Keine Herzen mehr übrig. Versuche es gleich noch einmal!');
    }
  }, [state?.isGameOver]);

  // Dynamic mascot commentary: combos and mistakes during play
  const lastMoveResult = state?.lastMoveResult;
  const comboCount = state?.comboCount ?? 0;
  const isGameOverNow = state?.isGameOver ?? false;
  useEffect(() => {
    if (!lastMoveResult || isGameOverNow || showVictoryModal) return;
    if (lastMoveResult.kind === 'wrong') {
      setMascotMessage(pickMessage(MISTAKE_MESSAGES, lastMoveResult.at));
    } else if (comboCount >= 3) {
      setMascotMessage(pickMessage(COMBO_MESSAGES, lastMoveResult.at, comboCount));
    }
  }, [lastMoveResult, comboCount, isGameOverNow, showVictoryModal]);

  // Falsche Züge pro Spiel zählen – 'at' als Dedup-Key, damit derselbe
  // wrong-Zug bei Re-Renders nicht doppelt zählt.
  useEffect(() => {
    if (lastMoveResult?.kind === 'wrong' && lastMoveResult.at !== lastWrongAtRef.current) {
      lastWrongAtRef.current = lastMoveResult.at;
      mistakesRef.current += 1;
    }
  }, [lastMoveResult]);

  const handleStartLevel = (
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme',
    levelId: number | null = null,
    // UI-Teil 1: optionaler meta-Parameter (daily/challenge Seeds etc.)
    meta?: { mode?: 'campaign' | 'quick' | 'extreme' | 'daily' | 'challenge'; seed?: number; dailyKey?: string }
  ) => {
    playPop();
    hapticTap();
    setPlayingDifficulty(difficulty);
    setPlayingLevel(levelId);
    setTimerSeconds(0);
    setShowVictoryModal(false);
    setVictoryWave(false);
    if (victoryWaveTimeoutRef.current) clearTimeout(victoryWaveTimeoutRef.current);
    setVictoryStats(null);
    setIsPaused(false);
    setShowBossIntro(false);
    mistakesRef.current = 0;
    lastWrongAtRef.current = null;
    startNewGame(difficulty, meta);
    setView('game');
    if (difficulty === 'extreme') {
      setMascotMessage('Bist du wahnsinnig? Das ist das EXTREME Sudoku-Level! Nur 17 Vorgaben! 💀🔥');
    } else {
      setMascotMessage('Konzentriere dich! Finde alle fehlenden Zahlen.');
    }
  };

  // Daily Challenge: deterministisches Puzzle aus dem heutigen Datum (Seed)
  const DAILY_DIFF_LABEL: Record<string, string> = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' };
  const handleStartDaily = () => {
    if (view === 'game' && !state?.isGameOver && !showVictoryModal && !window.confirm('Möchtest du das aktuelle Spiel wirklich abbrechen?')) return;
    const key = getDateKey();
    const difficulty = getDailyDifficulty(key);
    handleStartLevel(difficulty, null, { mode: 'daily', seed: seedFromDateKey(key), dailyKey: key });
    setMascotMessage(`Tägliche Challenge – heute: ${DAILY_DIFF_LABEL[difficulty]}. Viel Erfolg! 📅`);
  };

  // Duell (Challenge-Code): gleicher Seed = dasselbe Sudoku für beide Spieler
  const startChallenge = useCallback(
    (difficulty: 'easy' | 'medium' | 'hard', seed: number) => {
      if (view === 'game' && !state?.isGameOver && !showVictoryModal && !window.confirm('Möchtest du das aktuelle Spiel wirklich abbrechen?')) return;
      setShowChallengeModal(false);
      handleStartLevel(difficulty, null, { mode: 'challenge', seed });
      setMascotMessage(`Duell gestartet! Code ${encodeChallenge(seed)} – gib deinem Freund Bescheid und vergleicht eure Zeiten! ⚔️`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, state?.isGameOver, showVictoryModal]
  );

  // Challenge-Links (#challenge=CODE): beim Mount und bei hashchange direkt starten
  useEffect(() => {
    const tryStartFromHash = () => {
      const match = window.location.hash.match(/^#challenge=(.+)$/);
      if (!match) return;
      const seed = decodeChallenge(match[1]);
      // Hash immer entfernen, damit ein Reload das Duell nicht erneut startet
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (seed !== null) {
        startChallenge('medium', seed);
      } else {
        setMascotMessage('Dieser Duell-Link ist leider ungültig. Lass dir einen neuen Code geben! ⚔️');
      }
    };
    tryStartFromHash();
    window.addEventListener('hashchange', tryStartFromHash);
    return () => window.removeEventListener('hashchange', tryStartFromHash);
  }, [startChallenge]);

  // Boss-Inszenierung: Extrem startet nur über das Intro
  const requestExtremeStart = () => {
    if (view === 'game' && !state?.isGameOver && !showVictoryModal && !window.confirm('Möchtest du das aktuelle Spiel abbrechen?')) return;
    playPop();
    hapticTap();
    setShowBossIntro(true);
    setMascotMessage('Der Boss fordert dich heraus! Zeig ihm, was in dir steckt! 💀🔥');
  };

  // Adaptive Empfehlung beim Wechsel auf die Kampagnen-Ansicht
  useEffect(() => {
    if (view !== 'campaign' || hasActiveGame) return;
    const tip = getAdaptiveTip(profile);
    if (tip) setMascotMessage(tip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, profile.gameHistory]);

  const handleVerify = () => {
    // Guard: while the wave/modal is showing, a second tap on "Prüfen"
    // must not grant the level rewards twice.
    if (victoryWave || showVictoryModal) return;
    if (checkSolution()) {
      playVictoryFanfare();
      playWhoosh();
      hapticVictory();
      fireVictoryConfetti();

      // Lock in the rewards immediately, but celebrate on the board first:
      // the victory wave lets all numbers jump diagonally from bottom-left
      // to top-right (16 diagonals * 45ms stagger + 620ms jump ≈ 1.35s).
      const stats = completeLevel(playingLevel || 1, timerSeconds, playingDifficulty, {
        mistakes: mistakesRef.current,
        dailyKey: state?.dailyKey,
        challengeSeed: state?.challengeSeed,
      });
      setVictoryStats(stats);
      setVictoryWave(true);
      if (victoryWaveTimeoutRef.current) clearTimeout(victoryWaveTimeoutRef.current);
      victoryWaveTimeoutRef.current = setTimeout(() => {
        setVictoryWave(false);
        setShowVictoryModal(true);
      }, 1500);
      setMascotMessage(
        stats.speedBonusGems > 0
          ? 'Unglaublich schnell gelöst! Du hast den Zeit-Bonus eingestreift! ⚡💎'
          : 'Großartig gemacht! Du hast das Level gemeistert! 🎉'
      );
    } else {
      playErrorBuzz();
      hapticError();
      setMascotMessage('Da sind noch Fehler oder unvollständige Felder. Gib nicht auf!');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--duo-bg-light)',
        fontFamily: "'Nunito', sans-serif",
        color: 'var(--duo-text-dark)',
        position: 'relative',
        /* Room for the bottom nav incl. iOS home indicator */
        paddingBottom: 'calc(96px + var(--sab, 0px))',
      }}
    >
      {/* Header Bar */}
      <HeaderStats
        streak={profile.streak}
        lives={state?.lives ?? 3}
        xp={profile.xp}
        gems={profile.gems}
        timerSeconds={view === 'game' && !profile.zenMode ? timerSeconds : undefined}
        level={view === 'game' && playingLevel ? playingLevel : profile.unlockedLevels.length}
        onOpenShop={() => {
          playPop();
          hapticTap();
          setIsShopOpen(true);
        }}
      />

      {/* Navigation Bar */}
      <div
        className="top-nav"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'var(--duo-bg-card)',
          borderBottom: '2px solid var(--duo-gray)',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`btn-duo ${view === 'campaign' ? 'btn-duo-green' : 'btn-duo-gray'}`}
          onClick={() => {
            playPop();
            hapticTap();
            setView('campaign');
          }}
        >
          <MapIcon size={18} /> Pfad
        </button>
        <button
          className={`btn-duo ${view === 'game' && playingDifficulty !== 'extreme' ? 'btn-duo-green' : 'btn-duo-gray'}`}
          onClick={() => {
            if (view === 'game' && !state?.isGameOver && !window.confirm('Möchtest du das aktuelle Spiel wirklich abbrechen?')) return;
            handleStartLevel('easy', null);
          }}
        >
          <BoltIcon size={18} /> Spiel
        </button>
        <button
          className={`btn-duo ${view === 'game' && playingDifficulty === 'extreme' ? 'btn-duo-red' : 'btn-duo-purple'}`}
          onClick={requestExtremeStart}
        >
          <SkullIcon size={18} /> Extrem
        </button>
        <button
          className={`btn-duo ${view === 'game' && state?.gameMode === 'daily' ? 'btn-duo-green' : 'btn-duo-blue'}`}
          onClick={() => {
            playPop();
            hapticTap();
            setShowDailyModal(true);
          }}
        >
          <CalendarIcon size={18} /> Täglich
        </button>
        <button
          className={`btn-duo ${view === 'game' && state?.gameMode === 'challenge' ? 'btn-duo-green' : 'btn-duo-purple'}`}
          onClick={() => {
            playPop();
            hapticTap();
            setShowChallengeModal(true);
          }}
        >
          <SwordsIcon size={18} /> Duell
        </button>
        <button
          className="btn-duo btn-duo-gray"
          onClick={() => {
            playPop();
            hapticTap();
            setShowSchoolModal(true);
          }}
        >
          <GradCapIcon size={18} /> Schule
        </button>
        <button
          className="btn-duo btn-duo-yellow"
          onClick={() => {
            playPop();
            hapticTap();
            setIsShopOpen(true);
          }}
        >
          <CartIcon size={18} /> Shop
        </button>
        <button
          className="btn-duo btn-duo-gray"
          onClick={() => {
            playPop();
            hapticTap();
            setShowSettingsModal(true);
          }}
          aria-label="Einstellungen öffnen"
        >
          <GearIcon size={18} />
        </button>
      </div>

      {/* Main View Area */}
      {view === 'campaign' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginTop: '20px', fontWeight: 900, color: 'var(--duo-text-dark)' }}>
            Deine Sudoku-Reise
          </h2>
          <LevelPathMap
            currentLevel={profile.unlockedLevels.length}
            onLevelSelect={(level) => {
              const levelData = campaignLevels.find((l) => l.id === level);
              if (levelData) {
                handleStartLevel(levelData.difficulty as 'easy' | 'medium' | 'hard', level);
                setMascotMessage(`Starte Level ${level}: ${levelData.description}`);
              } else {
                handleStartLevel('easy', level);
              }
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center', padding: '0 12px' }}>
            <button
              onClick={() => {
                playPop();
                hapticTap();
                undo();
              }}
              className="btn-duo btn-duo-gray"
              aria-label="Zug rückgängig machen"
              disabled={isPaused}
            >
              <UndoIcon size={18} /> Zurück
            </button>
            <button
              onClick={() => {
                playPop();
                hapticTap();
                redo();
              }}
              className="btn-duo btn-duo-gray"
              aria-label="Zug wiederholen"
              disabled={isPaused}
            >
              <RedoIcon size={18} /> Wiederholen
            </button>
            {state && !state.isGameOver && (
              <button
                onClick={() => {
                  playPop();
                  hapticTap();
                  setIsPaused((prev) => !prev);
                }}
                className={`btn-duo ${isPaused ? 'btn-duo-green' : 'btn-duo-blue'}`}
                aria-label={isPaused ? 'Spiel fortsetzen' : 'Spiel pausieren'}
                aria-pressed={isPaused}
              >
                {isPaused ? <PlayIcon size={18} /> : <PauseIcon size={18} />} {isPaused ? 'Weiter' : 'Pause'}
              </button>
            )}
            <button onClick={handleVerify} className="btn-duo btn-duo-green" disabled={isPaused}>
              <CheckIcon size={18} /> Prüfen
            </button>
            <button
              onClick={() => {
                playPop();
                hapticTap();
                setView('campaign');
              }}
              className="btn-duo btn-duo-red"
            >
              <CloseIcon size={18} /> Beenden
            </button>
          </div>

          {isPaused ? (
            /* Pausiert: Board ersetzt (Anti-Peek), Timer & Eingaben gestoppt */
            <button
              onClick={() => {
                playPop();
                hapticTap();
                setIsPaused(false);
              }}
              aria-label="Spiel fortsetzen"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: 'min(90vw, 480px)',
                minHeight: '320px',
                margin: '20px auto',
                padding: '32px',
                borderRadius: '24px',
                border: '2px solid var(--duo-gray)',
                backgroundColor: 'var(--duo-bg-card)',
                boxShadow: '0 8px 0 var(--duo-gray-shadow)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ display: 'inline-flex', color: 'var(--duo-blue)' }}>
                <PauseIcon size={48} />
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--duo-text-dark)' }}>
                Pausiert
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--duo-text-light)' }}>
                Tippe auf „Weiter", um weiterzuspielen
              </span>
              <span className="btn-duo btn-duo-green" style={{ pointerEvents: 'none' }}>
                <PlayIcon size={18} /> Weiter
              </span>
            </button>
          ) : (
            <SudokuBoard victoryWave={victoryWave} onHintExplanation={setMascotMessage} />
          )}
        </div>
      )}

      {/* Mascot Assistant */}
      <MascotAssistant message={mascotMessage} />

      {/* Game Over Modal */}
      <AnimatePresence>
        {state?.isGameOver && (
          <ModalShell onClose={() => handleStartLevel(playingDifficulty, playingLevel)} maxWidth={360}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', color: 'var(--duo-red)', marginBottom: '8px' }}>
                <HeartIcon size={44} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--duo-red)', margin: '0 0 8px 0', fontWeight: 900 }}>
                Keine Leben mehr!
              </h2>
              <p style={{ color: 'var(--duo-text-light)', margin: '0 0 20px 0', fontWeight: 600 }}>
                Du hast alle 3 Herzen verloren.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-duo btn-duo-yellow"
                  onClick={() => {
                    playPop();
                    hapticTap();
                    setIsShopOpen(true);
                  }}
                  style={{ width: '100%' }}
                >
                  <HeartIcon size={18} /> Im Shop auffüllen
                </button>
                <button
                  className="btn-duo btn-duo-gray"
                  onClick={() => handleStartLevel(playingDifficulty, playingLevel)}
                  style={{ width: '100%' }}
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Victory Modal */}
      <AnimatePresence>
        {showVictoryModal && victoryStats && (
          <ModalShell
            onClose={() => {
              setShowVictoryModal(false);
              setView('campaign');
            }}
            maxWidth={380}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', color: 'var(--duo-green)', marginBottom: '8px' }}>
                <PartyIcon size={44} />
              </div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--duo-green)', margin: '0 0 12px 0', fontWeight: 900 }}>
                {playingDifficulty === 'extreme' ? 'BOSS BESIEGT! 👑' : 'Level geschafft!'}
              </h2>

              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--duo-text-light)', margin: '0 0 4px 0' }}>
                ⏱️ Gelöst in {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>

              {state?.dailyKey && (
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--duo-green)', margin: '0 0 4px 0' }}>
                  📅 Tägliche Challenge abgeschlossen!
                </div>
              )}

              {state?.gameMode === 'challenge' && state.challengeSeed != null && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: 'var(--duo-purple)',
                    backgroundColor: 'var(--duo-tint-purple)',
                    padding: '8px',
                    borderRadius: '10px',
                    margin: '0 0 4px 0',
                  }}
                >
                  ⚔️ Duell-Code: {encodeChallenge(state.challengeSeed)} – vergleiche deine Zeit{' '}
                  {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')} mit deinem Freund!
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  margin: '16px 0',
                  backgroundColor: 'var(--duo-bg-light)',
                  padding: '16px',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--duo-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <BoltIcon size={20} /> +{victoryStats.xpGained} XP
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d48800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <GemIcon size={20} /> +{victoryStats.gemsGained} Edelsteine
                </div>
                {victoryStats.speedBonusGems > 0 && (
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--duo-green)',
                      backgroundColor: 'var(--duo-tint-green)',
                      padding: '8px',
                      borderRadius: '10px',
                    }}
                  >
                    ⏱️ ZEIT-BONUS: +{victoryStats.speedBonusGems} Edelsteine!
                  </div>
                )}
                {victoryStats.xpBoosted && (
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--duo-purple)',
                      backgroundColor: 'var(--duo-tint-purple)',
                      padding: '8px',
                      borderRadius: '10px',
                    }}
                  >
                    ⚡ XP-BOOST: Doppelte XP kassiert!
                  </div>
                )}
                {victoryStats.streakFreezeUsed && (
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--duo-blue)',
                      backgroundColor: 'var(--duo-tint-blue)',
                      padding: '8px',
                      borderRadius: '10px',
                    }}
                  >
                    🛡️ Streak-Schutz hat deine Serie gerettet!
                  </div>
                )}
              </div>

              <button
                className="btn-duo btn-duo-green"
                onClick={() => {
                  playPop();
                  hapticTap();
                  setShowVictoryModal(false);
                  setView('campaign');
                }}
                style={{ width: '100%', fontSize: '1.1rem' }}
              >
                Weiter zum Pfad
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={
          isShopOpen
            ? 'shop'
            : view === 'game' && playingDifficulty === 'extreme'
              ? 'extreme'
              : view === 'game'
                ? 'game'
                : 'campaign'
        }
        onSelectTab={(tab) => {
          if (tab === 'campaign') {
            setIsShopOpen(false);
            setView('campaign');
          } else if (tab === 'game') {
            setIsShopOpen(false);
            if (view !== 'game' || playingDifficulty === 'extreme') {
              handleStartLevel('easy', null);
            }
          } else if (tab === 'extreme') {
            setIsShopOpen(false);
            if (view !== 'game' || playingDifficulty !== 'extreme') {
              requestExtremeStart();
            }
          } else if (tab === 'shop') {
            setIsShopOpen(true);
          } else if (tab === 'stats') {
            setIsShopOpen(false);
            setShowStatsModal(true);
          } else if (tab === 'leaderboard') {
            setIsShopOpen(false);
            setShowLeaderboardModal(true);
          }
        }}
      />

      {/* Modals – only one interruptive overlay mounted at a time */}
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      <AnimatePresence>
        {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showLeaderboardModal && <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />}
      </AnimatePresence>
      {/* UI-Teil 1: Einstellungen (Dark Mode, Zen, Sync-Codes) + Daily-Kalender */}
      <AnimatePresence>
        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showDailyModal && (
          <DailyChallengeModal
            onClose={() => setShowDailyModal(false)}
            onPlayDaily={() => {
              setShowDailyModal(false);
              handleStartDaily();
            }}
          />
        )}
      </AnimatePresence>
      {/* UI-Teil 2: Duell (Challenge-Codes) + Technik-Schule */}
      <AnimatePresence>
        {showChallengeModal && (
          <ChallengeModal
            onClose={() => setShowChallengeModal(false)}
            onStartChallenge={startChallenge}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSchoolModal && <TechniqueSchoolModal onClose={() => setShowSchoolModal(false)} />}
      </AnimatePresence>

      {/* Boss-Intro vor jedem Extrem-Start */}
      <AnimatePresence>
        {showBossIntro && (
          <motion.div
            className="duo-backdrop"
            style={{ zIndex: 2100, backgroundColor: 'rgba(20, 10, 10, 0.82)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Boss-Kampf Extrem-Sudoku"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              style={{
                backgroundColor: 'var(--duo-bg-card)',
                borderRadius: '24px',
                border: '3px solid var(--duo-red)',
                boxShadow: '0 8px 0 var(--duo-red-shadow)',
                padding: '32px 28px',
                maxWidth: '400px',
                width: 'calc(100vw - 48px)',
                textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3.6rem', lineHeight: 1, marginBottom: '10px' }}
                aria-hidden
              >
                💀
              </motion.div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--duo-red)', margin: '0 0 8px 0' }}>
                BOSS-KAMPF: Das Extrem-Sudoku
              </h2>
              <p style={{ fontWeight: 700, color: 'var(--duo-text-light)', margin: '0 0 20px 0', fontSize: '0.95rem' }}>
                Nur 17 Vorgaben. Keine Gnade. +2500 XP
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-duo btn-duo-red"
                  onClick={() => handleStartLevel('extreme', 99)}
                  style={{ width: '100%', fontSize: '1.1rem' }}
                >
                  <SkullIcon size={18} /> Kampf aufnehmen
                </button>
                <button
                  className="btn-duo btn-duo-gray"
                  onClick={() => {
                    playPop();
                    hapticTap();
                    setShowBossIntro(false);
                  }}
                  style={{ width: '100%' }}
                >
                  Doch nicht
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}

export default App;
