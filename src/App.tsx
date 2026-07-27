import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { SudokuBoard } from './components/ui/SudokuBoard';
import { HeaderStats } from './components/ui/HeaderStats';
import { LevelPathMap } from './components/ui/LevelPathMap';
import { MascotAssistant } from './components/ui/MascotAssistant';
import { playPop, playVictoryFanfare, playErrorBuzz } from './utils/soundEffects';
import { campaignLevels } from './logic/campaignLevels';
import { BottomNav } from './components/ui/BottomNav';
import { StatsModal } from './components/ui/StatsModal';
import { LeaderboardModal } from './components/ui/LeaderboardModal';
import { ShopModal } from './components/ui/ShopModal';
import './styles/duolingo.css';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const MainAppContent: React.FC = () => {
  const { state, profile, startNewGame, undo, redo, checkSolution, completeLevel } = useGame();
  const [view, setView] = useState<'campaign' | 'game'>('campaign');
  const [mascotMessage, setMascotMessage] = useState("Willkommen! Wähle ein Level auf dem Pfad.");
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [playingLevel, setPlayingLevel] = useState<number | null>(null);
  const [playingDifficulty, setPlayingDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('easy');
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [victoryStats, setVictoryStats] = useState<{ xpGained: number; gemsGained: number; speedBonusGems: number } | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (view === 'game' && state && !state.isGameOver && !showVictoryModal) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, state?.isGameOver, showVictoryModal, state]);

  useEffect(() => {
    if (state?.isGameOver) {
      playErrorBuzz();
      setMascotMessage("Oje! Keine Herzen mehr übrig. Versuche es gleich noch einmal!");
    }
  }, [state?.isGameOver]);

  const handleStartLevel = (difficulty: 'easy' | 'medium' | 'hard' | 'extreme', levelId: number | null = null) => {
    playPop();
    setPlayingDifficulty(difficulty);
    setPlayingLevel(levelId);
    setTimerSeconds(0);
    startNewGame(difficulty);
    setView('game');
    if (difficulty === 'extreme') {
      setMascotMessage("Bist du wahnsinnig? Das ist das EXTREME Sudoku-Level! Nur 17 Vorgaben! 💀🔥");
    } else {
      setMascotMessage("Konzentriere dich! Finde alle fehlenden Zahlen.");
    }
  };

  const handleVerify = () => {
    if (checkSolution()) {
      playVictoryFanfare();
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      const stats = completeLevel(playingLevel || 1, timerSeconds);
      setVictoryStats(stats);
      setShowVictoryModal(true);
      setMascotMessage(stats.speedBonusGems > 0 
        ? "Unglaublich schnell gelöst! Du hast den Zeit-Bonus eingestreift! ⚡💎" 
        : "Großartig gemacht! Du hast das Level gemeistert! 🎉");
    } else {
      playErrorBuzz();
      setMascotMessage("Da sind noch Fehler oder unvollständige Felder. Gib nicht auf!");
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--duo-bg-light)', 
      fontFamily: "'Nunito', sans-serif",
      color: 'var(--duo-text-dark)',
      position: 'relative',
      paddingBottom: '100px'
    }}>
      {/* Header Bar */}
      <HeaderStats 
        streak={profile.streak} 
        lives={state?.lives ?? 3} 
        xp={profile.xp} 
        gems={profile.gems}
        timerSeconds={view === 'game' ? timerSeconds : undefined}
        level={view === 'game' && playingLevel ? playingLevel : profile.unlockedLevels.length} 
        onOpenShop={() => { playPop(); setIsShopOpen(true); }}
      />

      {/* Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: 'white',
        borderBottom: '2px solid var(--duo-gray)'
      }}>
        <button 
          className={`btn-duo ${view === 'campaign' ? 'btn-duo-green' : 'btn-duo-gray'}`}
          onClick={() => { playPop(); setView('campaign'); }}
        >
          🗺️ Pfad
        </button>
        <button 
          className={`btn-duo ${view === 'game' && playingDifficulty !== 'extreme' ? 'btn-duo-green' : 'btn-duo-gray'}`}
          onClick={() => {
            if (view === 'game' && !state?.isGameOver && !window.confirm("Möchtest du das aktuelle Spiel wirklich abbrechen?")) return;
            handleStartLevel('easy', null);
          }}
        >
          ⚡ Schnelles Spiel
        </button>
        <button 
          className={`btn-duo ${view === 'game' && playingDifficulty === 'extreme' ? 'btn-duo-red' : 'btn-duo-purple'}`}
          onClick={() => {
            if (view === 'game' && !state?.isGameOver && !window.confirm("Möchtest du das aktuelle Spiel abbrechen?")) return;
            handleStartLevel('extreme', 99);
          }}
        >
          💀 Extrem-Level
        </button>
        <button 
          className="btn-duo btn-duo-yellow"
          onClick={() => { playPop(); setIsShopOpen(true); }}
        >
          🛒 Shop
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
              const levelData = campaignLevels.find(l => l.id === level);
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => { playPop(); undo(); }} className="btn-duo btn-duo-gray">Zurück</button>
            <button onClick={() => { playPop(); redo(); }} className="btn-duo btn-duo-gray">Wiederholen</button>
            <button onClick={handleVerify} className="btn-duo btn-duo-green">Prüfen & Abschließen</button>
            <button onClick={() => { playPop(); setView('campaign'); }} className="btn-duo btn-duo-red">Beenden</button>
          </div>

          <SudokuBoard />
        </div>
      )}

      {/* Mascot Assistant */}
      <MascotAssistant message={mascotMessage} />

      {/* Game Over Modal */}
      {state?.isGameOver && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: 'white', padding: '32px', borderRadius: '24px',
              textAlign: 'center', maxWidth: '360px', width: '90%',
              border: '3px solid var(--duo-red)', boxShadow: '0 8px 0 var(--duo-red-shadow)'
            }}
          >
            <h2 style={{ fontSize: '2rem', color: 'var(--duo-red)', marginBottom: '16px' }}>💔 Keine Leben mehr!</h2>
            <p style={{ color: 'var(--duo-text-light)', marginBottom: '16px' }}>Du hast alle 3 Herzen verloren.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn-duo btn-duo-yellow"
                onClick={() => {
                  playPop();
                  setIsShopOpen(true);
                }}
                style={{ width: '100%' }}
              >
                ❤️ Im Shop auffüllen
              </button>
              <button 
                className="btn-duo btn-duo-gray"
                onClick={() => handleStartLevel(playingDifficulty, playingLevel)}
                style={{ width: '100%' }}
              >
                Erneut versuchen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && victoryStats && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: 'white', padding: '32px', borderRadius: '24px',
              textAlign: 'center', maxWidth: '380px', width: '90%',
              border: '3px solid var(--duo-green)', boxShadow: '0 8px 0 var(--duo-green-shadow)'
            }}
          >
            <h2 style={{ fontSize: '2.2rem', color: 'var(--duo-green)', marginBottom: '8px' }}>🎉 Level Geschafft!</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', backgroundColor: 'var(--duo-bg-light)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--duo-blue)' }}>
                + {victoryStats.xpGained} XP
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d48800' }}>
                + {victoryStats.gemsGained} 💎 Edelsteine
              </div>
              {victoryStats.speedBonusGems > 0 && (
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--duo-green)', backgroundColor: '#eefbdf', padding: '6px', borderRadius: '10px' }}>
                  ⏱️ ZEIT-BONUS: +{victoryStats.speedBonusGems} 💎!
                </div>
              )}
            </div>

            <button 
              className="btn-duo btn-duo-green"
              onClick={() => {
                playPop();
                setShowVictoryModal(false);
                setView('campaign');
              }}
              style={{ width: '100%', fontSize: '1.2rem' }}
            >
              Weiter zum Pfad
            </button>
          </motion.div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={isShopOpen ? 'shop' : view === 'game' && playingDifficulty === 'extreme' ? 'extreme' : view === 'game' ? 'game' : 'campaign'}
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

      {/* Modals */}
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
      {showLeaderboardModal && <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />}
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
