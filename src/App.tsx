import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { SudokuBoard } from './components/ui/SudokuBoard';
import { HeaderStats } from './components/ui/HeaderStats';
import { LevelPathMap } from './components/ui/LevelPathMap';
import { MascotAssistant } from './components/ui/MascotAssistant';
import { playPop, playVictoryFanfare, playErrorBuzz } from './utils/soundEffects';
import './styles/duolingo.css';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const MainAppContent: React.FC = () => {
  const { state, profile, startNewGame, undo, redo, checkSolution, completeLevel } = useGame();
  const [view, setView] = useState<'campaign' | 'game'>('campaign');
  const [mascotMessage, setMascotMessage] = useState("Willkommen! Wähle ein Level auf dem Pfad.");
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  useEffect(() => {
    if (state?.isGameOver) {
      playErrorBuzz();
      setMascotMessage("Oje! Keine Herzen mehr übrig. Versuche es gleich noch einmal!");
    }
  }, [state?.isGameOver]);

  const handleStartLevel = (difficulty: 'easy' | 'medium' | 'hard') => {
    playPop();
    startNewGame(difficulty);
    setView('game');
    setMascotMessage("Konzentriere dich! Finde alle fehlenden Zahlen.");
  };

  const handleVerify = () => {
    if (checkSolution()) {
      playVictoryFanfare();
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.6 }
      });
      completeLevel(profile.unlockedLevels.length);
      setShowVictoryModal(true);
      setMascotMessage("Großartig gemacht! Du hast das Level gemeistert! 🎉");
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
      paddingBottom: '80px'
    }}>
      {/* Header Bar */}
      <HeaderStats 
        streak={profile.streak} 
        lives={state?.lives ?? 3} 
        xp={profile.xp} 
        level={profile.unlockedLevels.length} 
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
          className={`btn-duo ${view === 'game' ? 'btn-duo-green' : 'btn-duo-gray'}`}
          onClick={() => handleStartLevel('easy')}
        >
          ⚡ Schnelles Spiel
        </button>
      </div>

      {/* Main View Area */}
      {view === 'campaign' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginTop: '20px', fontWeight: 900, color: 'var(--duo-text-dark)' }}>
            Deine Sudoku-Reise
          </h2>
          <LevelPathMap currentLevel={profile.unlockedLevels.length} />
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
            <p style={{ color: 'var(--duo-text-light)', marginBottom: '24px' }}>Du hast alle 3 Herzen verloren. Keine Sorge, Übung macht den Meister!</p>
            <button 
              className="btn-duo btn-duo-green"
              onClick={() => handleStartLevel('easy')}
              style={{ width: '100%' }}
            >
              Erneut versuchen
            </button>
          </motion.div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
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
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--duo-yellow)', marginBottom: '16px' }}>+100 XP GEWONNEN!</p>
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
