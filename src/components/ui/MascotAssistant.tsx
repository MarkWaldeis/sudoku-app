import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/duolingo.css';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { useGame } from '../../store/GameContext';
import { getSkinById } from '../../logic/skins';
import { CloseIcon } from './icons';

interface MascotAssistantProps {
  message?: string;
}

export const MascotAssistant: React.FC<MascotAssistantProps> = ({
  message = 'Du schaffst das! Finde die fehlenden Zahlen.',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { profile } = useGame();

  const base = import.meta.env.BASE_URL;
  const skin = getSkinById(profile.selectedMascotSkin);
  const mascotSrc = skin.image ? `${base}${skin.image}` : `${base}mascot.jpg`;

  // Pop the mascot back in whenever a new message arrives
  useEffect(() => {
    setIsVisible(true);
  }, [message]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(84px + var(--sab, 0px))',
        left: 'calc(16px + var(--sal, 0px))',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        zIndex: 900,
        transition: 'opacity 200ms var(--ease-out)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* Mascot Image (Animated) */}
      <motion.div
        className="mascot-float mascot-img"
        onClick={() => {
          playPop();
          hapticTap();
        }}
        role="button"
        aria-label="Maskottchen"
        style={{
          cursor: 'pointer',
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid var(--duo-gray)',
          boxShadow: '0 4px 0 var(--duo-gray-shadow)',
          flexShrink: 0,
          backgroundColor: 'white',
        }}
        whileTap={{ scale: 0.9 }}
      >
        {skin.emoji ? (
          <span
            aria-label="Sudoku Maskottchen"
            role="img"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
          >
            {skin.emoji}
          </span>
        ) : (
          <img
            src={mascotSrc}
            alt="Sudoku Maskottchen"
            width={84}
            height={84}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </motion.div>

      {/* Speech Bubble – re-animates on every new message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          className="mascot-bubble"
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--duo-gray)',
            borderRadius: '16px',
            padding: '14px 44px 14px 18px',
            position: 'relative',
            boxShadow: '0 4px 0 var(--duo-gray-shadow)',
            marginBottom: '20px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 'bold',
            color: 'var(--duo-text-dark)',
            maxWidth: 'min(250px, 52vw)',
            fontSize: '0.9rem',
          }}
        >
          {/* Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: '-10px',
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderBottom: '2px solid var(--duo-gray)',
              borderLeft: '2px solid var(--duo-gray)',
              transform: 'rotate(45deg)',
              boxShadow: '-2px 2px 0 var(--duo-gray-shadow)',
            }}
          />

          {message}

          <button
            onClick={() => {
              playPop();
              hapticTap();
              setIsVisible(false);
            }}
            aria-label="Maskottchen ausblenden"
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--duo-text-light)',
            }}
          >
            <CloseIcon size={16} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
