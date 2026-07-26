import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { playPop } from '../../utils/soundEffects';
import '../../styles/duolingo.css';

interface StatsModalProps {
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const { profile } = useGame();

  const totalMoves = (profile.correctMoves || 0) + (profile.incorrectMoves || 0);
  const accuracy = totalMoves > 0 
    ? Math.round(((profile.correctMoves || 0) / totalMoves) * 100) 
    : 100;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          backgroundColor: 'white',
          padding: '28px',
          borderRadius: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 0 var(--duo-gray-shadow)',
          border: '3px solid var(--duo-blue)',
          position: 'relative'
        }}
      >
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          color: 'var(--duo-blue)',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          📊 Deine Statistiken
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <StatBox icon="⚡" label="Gesamt-XP" value={`${profile.xp}`} color="var(--duo-yellow)" />
          <StatBox icon="🔥" label="Tages-Streak" value={`${profile.streak} Tage`} color="var(--duo-red)" />
          <StatBox icon="🎮" label="Spiele Gestartet" value={`${profile.totalGamesPlayed || 0}`} color="var(--duo-purple)" />
          <StatBox icon="🎯" label="Genauigkeit" value={`${accuracy}%`} color="var(--duo-green)" />
        </div>

        <div style={{
          backgroundColor: 'var(--duo-bg-light)',
          padding: '16px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '20px',
          fontWeight: 700,
          color: 'var(--duo-text-dark)'
        }}>
          <span>Richtig getippt: <b>{profile.correctMoves || 0}</b> | Fehler: <b>{profile.incorrectMoves || 0}</b></span>
        </div>

        <button
          className="btn-duo btn-duo-blue"
          onClick={() => {
            playPop();
            onClose();
          }}
          style={{ width: '100%', fontSize: '1.1rem' }}
        >
          Schließen
        </button>
      </motion.div>
    </div>
  );
};

const StatBox: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div style={{
    backgroundColor: 'white',
    border: `2px solid ${color}`,
    borderRadius: '16px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: `0 4px 0 ${color}`
  }}>
    <span style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{icon}</span>
    <span style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 700 }}>{label}</span>
    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--duo-text-dark)', marginTop: '2px' }}>{value}</span>
  </div>
);
