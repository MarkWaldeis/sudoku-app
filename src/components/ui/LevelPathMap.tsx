import React from 'react';
import '../../styles/duolingo.css';
import { playPop, playErrorBuzz } from '../../utils/soundEffects';

interface LevelPathMapProps {
  currentLevel: number;
  maxLevel?: number;
  onLevelSelect?: (level: number) => void;
}

export const LevelPathMap: React.FC<LevelPathMapProps> = ({ currentLevel, maxLevel = 20, onLevelSelect }) => {
  const handleLevelClick = (level: number) => {
    if (level <= currentLevel) {
      playPop();
      if (onLevelSelect) {
        onLevelSelect(level);
      }
    } else {
      playErrorBuzz();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      gap: '40px',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 80px)'
    }}>
      {[...Array(maxLevel)].map((_, i) => {
        const level = i + 1; // Top down mapping from 1 to maxLevel
        const isUnlocked = level <= currentLevel;
        const isActive = level === currentLevel;
        const offset = Math.sin(level * 0.8) * 60; // Zig-zag effect

        return (
          <div key={level} style={{
            position: 'relative',
            transform: `translateX(${offset}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Chapter markers */}
            {level === 1 && <ChapterHeader title="Kapitel 1: Anfänger" />}
            {level === 5 && <ChapterHeader title="Kapitel 2: Fortgeschritten" />}
            {level === 10 && <ChapterHeader title="Kapitel 3: Meister" />}

            <button
              className={`btn-duo ${!isUnlocked ? 'btn-duo-disabled' : isActive ? 'btn-duo-blue' : ''}`}
              onClick={() => handleLevelClick(level)}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                padding: 0,
                fontSize: '1.8rem',
                position: 'relative'
              }}
            >
              {isUnlocked ? (
                <span>★</span>
              ) : (
                <span>🔒</span>
              )}
            </button>
            
            {/* Crown/Active Indicator */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '-20px',
                fontSize: '2rem',
                animation: 'float 2s ease-in-out infinite',
                pointerEvents: 'none'
              }}>
                👑
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ChapterHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    backgroundColor: 'var(--duo-purple)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '20px',
    fontWeight: 'bold',
    marginBottom: '30px',
    fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 4px 0 rgba(160, 80, 220, 1)'
  }}>
    {title}
  </div>
);
