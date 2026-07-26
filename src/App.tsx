import React, { useState } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { SudokuBoard } from './components/ui/SudokuBoard';
import { GlassModal } from './components/ui/GlassModal';
import { MenuButton } from './components/ui/MenuButton';
import './styles/variables.css';
import confetti from 'canvas-confetti';

const MainScreen: React.FC = () => {
  const { state, startNewGame, undo, redo, checkSolution } = useGame();
  const [showDifficulty, setShowDifficulty] = useState(false);
  
  const handleStartGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    startNewGame(difficulty);
    setShowDifficulty(false);
  };

  const handleVerify = () => {
    if (checkSolution()) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      alert('Congratulations! You solved the puzzle!');
    } else {
      alert('There are still errors or the puzzle is incomplete.');
    }
  };

  if (!state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-main)', marginBottom: '40px' }}>Sudoku Pro</h1>
        <MenuButton onClick={() => setShowDifficulty(true)}>Neues Spiel</MenuButton>
        <MenuButton onClick={() => alert('Stats not implemented yet')}>Statistiken</MenuButton>
        
        {showDifficulty && (
          <GlassModal isOpen={showDifficulty} onClose={() => setShowDifficulty(false)} title="Schwierigkeitsgrad wählen">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <MenuButton onClick={() => handleStartGame('easy')}>Leicht</MenuButton>
              <MenuButton onClick={() => handleStartGame('medium')}>Mittel</MenuButton>
              <MenuButton onClick={() => handleStartGame('hard')}>Schwer</MenuButton>
            </div>
          </GlassModal>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', minHeight: '100vh' }}>
      <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Sudoku Pro</h2>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button onClick={undo} className="btn-interactive" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Undo</button>
        <button onClick={redo} className="btn-interactive" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Redo</button>
        <button onClick={handleVerify} className="btn-interactive" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}>Verify</button>
        <button onClick={() => window.location.reload()} className="btn-interactive" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Quit</button>
      </div>
      
      <SudokuBoard />
    </div>
  );
};

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      fontFamily: '"Inter", "Outfit", sans-serif'
    }}>
      <GameProvider>
        <MainScreen />
      </GameProvider>
    </div>
  );
}

export default App;
