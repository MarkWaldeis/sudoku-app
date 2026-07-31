import React from 'react';
import { motion } from 'framer-motion';
import { playPop, playErrorBuzz } from '../../utils/soundEffects';
import { hapticTap, hapticError } from '../../utils/haptics';
import { StarIcon, LockIcon, CrownIcon } from './icons';
import '../../styles/duolingo.css';

interface LevelPathMapProps {
  currentLevel: number;
  maxLevel?: number;
  onLevelSelect?: (level: number) => void;
}

export const LevelPathMap: React.FC<LevelPathMapProps> = ({ currentLevel, maxLevel = 20, onLevelSelect }) => {
  const handleLevelClick = (level: number) => {
    if (level <= currentLevel) {
      playPop();
      hapticTap();
      onLevelSelect?.(level);
    } else {
      playErrorBuzz();
      hapticError();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px',
        gap: '40px',
      }}
    >
      {[...Array(maxLevel)].map((_, i) => {
        const level = i + 1;
        const isUnlocked = level <= currentLevel;
        const isActive = level === currentLevel;
        const offset = Math.sin(level * 0.8) * 60; // Zig-zag effect

        return (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: Math.min(i * 40, 400) }}
            style={{
              position: 'relative',
              transform: `translateX(${offset}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Chapter markers */}
            {level === 1 && <ChapterHeader title="Kapitel 1: Anfänger" />}
            {level === 5 && <ChapterHeader title="Kapitel 2: Fortgeschritten" />}
            {level === 10 && <ChapterHeader title="Kapitel 3: Meister" />}

            <button
              className={`btn-duo ${!isUnlocked ? 'btn-duo-disabled' : isActive ? 'btn-duo-blue' : ''}`}
              onClick={() => handleLevelClick(level)}
              aria-label={
                isUnlocked
                  ? `Level ${level} starten${isActive ? ' (aktuelles Level)' : ''}`
                  : `Level ${level} gesperrt`
              }
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                padding: 0,
                position: 'relative',
                color: isUnlocked ? undefined : 'var(--duo-text-light)',
              }}
            >
              {isUnlocked ? <StarIcon size={34} /> : <LockIcon size={30} />}
            </button>

            {/* Crown/Active Indicator */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  color: 'var(--duo-yellow)',
                  animation: 'float 2s ease-in-out infinite',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 2px 0 var(--duo-yellow-shadow))',
                }}
              >
                <CrownIcon size={30} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

const ChapterHeader: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      backgroundColor: 'var(--duo-purple)',
      color: 'white',
      padding: '10px 24px',
      borderRadius: '20px',
      fontWeight: 'bold',
      marginBottom: '30px',
      fontFamily: "'Nunito', sans-serif",
      boxShadow: '0 4px 0 var(--duo-purple-shadow)',
    }}
  >
    {title}
  </div>
);
