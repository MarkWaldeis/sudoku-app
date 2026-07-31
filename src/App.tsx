import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { SudokuBoard } from './components/ui/SudokuBoard';
import { HeaderStats } from './components/ui/HeaderStats';
import { LevelPathMap } from './components/ui/LevelPathMap';
import { MascotAssistant } from './components/ui/MascotAssistant';
import { ModalShell } from './components/ui/ModalShell';
import { MapIcon, BoltIcon, SkullIcon, CartIcon, UndoIcon, RedoIcon, CheckIcon, CloseIcon, HeartIcon, GemIcon, PartyIcon } from './components/ui/icons';
import { playPop, playVictoryFanfare, playErrorBuzz } from './utils/soundEffects';
import { hapticTap, hapticVictory, hapticError } from './utils/haptics';
import { campaignLevels } from './logic/campaignLevels';
import { BottomNav } from './components/ui/BottomNav';
import { StatsModal } from './components/ui/StatsModal';
import { LeaderboardModal } from './components/ui/LeaderboardModal';
import { ShopModal } from './components/ui/ShopModal';
import './styles/duolingo.css';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'framer-motion';

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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [playingLevel, setPlayingLevel] = useState<number | null>(null);
  const [playingDifficulty, setPlayingDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('easy');

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [victoryStats, setVictoryStats] = useState<{ xpGained: number; gemsGained: number; speedBonusGems: number } | null>(null);

  const hasActiveGame = view === 'game' && !!state && !state.isGameOver && !showVictoryModal;

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

  const handleStartLevel = (difficulty: 'easy' | 'medium' | 'hard' | 'extreme', levelId: number | null = null) => {
    playPop();
    hapticTap();
    setPlayingDifficulty(difficulty);
    setPlayingLevel(levelId);
    setTimerSeconds(0);
    setShowVictoryModal(false);
    setVictoryStats(null);
    startNewGame(difficulty);
    setView('game');
    if (difficulty === 'extreme') {
      setMascotMessage('Bist du wahnsinnig? Das ist das EXTREME Sudoku-Level! Nur 17 Vorgaben! 💀🔥');
    } else {
      setMascotMessage('Konzentriere dich! Finde alle fehlenden Zahlen.');
    }
  };

  const handleVerify = () => {
    if (checkSolution()) {
      playVictoryFanfare();
      hapticVictory();
      fireVictoryConfetti();

      const stats = completeLevel(playingLevel || 1, timerSeconds);
      setVictoryStats(stats);
      setShowVictoryModal(true);
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
        timerSeconds={view === 'game' ? timerSeconds : undefined}
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
          backgroundColor: 'white',
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
          onClick={() => {
            if (view === 'game' && !state?.isGameOver && !window.confirm('Möchtest du das aktuelle Spiel abbrechen?')) return;
            handleStartLevel('extreme', 99);
          }}
        >
          <SkullIcon size={18} /> Extrem
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
            >
              <RedoIcon size={18} /> Wiederholen
            </button>
            <button onClick={handleVerify} className="btn-duo btn-duo-green">
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

          <SudokuBoard />
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
                Level geschafft!
              </h2>

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
                      backgroundColor: '#eefbdf',
                      padding: '8px',
                      borderRadius: '10px',
                    }}
                  >
                    ⏱️ ZEIT-BONUS: +{victoryStats.speedBonusGems} Edelsteine!
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
              handleStartLevel('extreme', 99);
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
