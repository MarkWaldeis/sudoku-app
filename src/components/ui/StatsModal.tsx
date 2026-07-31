import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { ModalShell } from './ModalShell';
import { BoltIcon, FlameIcon, TrophyIcon, CheckIcon } from './icons';
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
    <ModalShell onClose={onClose} maxWidth={400}>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--duo-blue)',
          margin: '0 0 20px 0',
          textAlign: 'center',
        }}
      >
        Deine Statistiken
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <StatBox icon={<BoltIcon size={26} />} label="Gesamt-XP" value={`${profile.xp}`} color="var(--duo-yellow)" delay={0} />
        <StatBox icon={<FlameIcon size={26} />} label="Tages-Streak" value={`${profile.streak} Tage`} color="var(--duo-red)" delay={0.05} />
        <StatBox icon={<TrophyIcon size={26} />} label="Spiele Gestartet" value={`${profile.totalGamesPlayed || 0}`} color="var(--duo-purple)" delay={0.1} />
        <StatBox icon={<CheckIcon size={26} />} label="Genauigkeit" value={`${accuracy}%`} color="var(--duo-green)" delay={0.15} />
      </div>

      <div
        style={{
          backgroundColor: 'var(--duo-bg-light)',
          padding: '16px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '20px',
          fontWeight: 700,
          color: 'var(--duo-text-dark)',
        }}
      >
        <span>
          Richtig getippt: <b>{profile.correctMoves || 0}</b> | Fehler: <b>{profile.incorrectMoves || 0}</b>
        </span>
      </div>

      <button
        className="btn-duo btn-duo-blue"
        onClick={() => {
          playPop();
          hapticTap();
          onClose();
        }}
        style={{ width: '100%', fontSize: '1.05rem' }}
      >
        Schließen
      </button>
    </ModalShell>
  );
};

const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; delay: number }> = ({
  icon,
  label,
  value,
  color,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay, ease: [0.23, 1, 0.32, 1] }}
    style={{
      backgroundColor: 'white',
      border: `2px solid ${color}`,
      borderRadius: '16px',
      padding: '14px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: `0 4px 0 ${color}`,
      color,
    }}
  >
    <span style={{ display: 'inline-flex', marginBottom: '6px' }}>{icon}</span>
    <span style={{ fontSize: '0.78rem', color: 'var(--duo-text-light)', fontWeight: 700 }}>{label}</span>
    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--duo-text-dark)', marginTop: '2px' }}>{value}</span>
  </motion.div>
);
