import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { ModalShell } from './ModalShell';
import { BoltIcon, FlameIcon, TrophyIcon, CheckIcon, StarIcon } from './icons';
import '../../styles/duolingo.css';

interface StatsModalProps {
  onClose: () => void;
}

const DIFF_LABEL: Record<string, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
  extreme: 'Extrem',
};

const formatTime = (seconds: number): string =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

const formatDate = (dateKey: string): string => {
  const [y, m, d] = dateKey.split('-');
  return `${d}.${m}.${y}`;
};

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const { profile } = useGame();

  const totalMoves = (profile.correctMoves || 0) + (profile.incorrectMoves || 0);
  const accuracy = totalMoves > 0
    ? Math.round(((profile.correctMoves || 0) / totalMoves) * 100)
    : 100;

  // --- Erweiterte Statistiken aus der Spiel-Historie (gameHistory) ---
  const history = profile.gameHistory || [];
  const bestTimes = (['easy', 'medium', 'hard', 'extreme'] as const).map((diff) => {
    const times = history.filter((h) => h.difficulty === diff).map((h) => h.timeSeconds);
    return { diff, best: times.length > 0 ? Math.min(...times) : null };
  });
  const last10 = history.slice(-10);
  const avgLast10 = last10.length > 0
    ? Math.round(last10.reduce((sum, h) => sum + h.timeSeconds, 0) / last10.length)
    : null;
  const last5 = history.slice(-5).reverse();

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
        <div style={{ gridColumn: '1 / -1' }}>
          <StatBox icon={<StarIcon size={26} />} label="Level geschafft" value={`${profile.levelsCompleted || 0}`} color="var(--duo-blue)" delay={0.2} />
        </div>
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

      {history.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--duo-bg-light)',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 700,
            color: 'var(--duo-text-light)',
            fontSize: '0.9rem',
          }}
        >
          Noch keine abgeschlossenen Spiele – löse dein erstes Sudoku, dann siehst du hier Bestzeiten &amp; Co.! 🌱
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--duo-text-dark)', margin: '0 0 10px 0' }}>
            Bestzeiten
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {bestTimes.map(({ diff, best }) => (
              <div
                key={diff}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--duo-bg-light)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: 'var(--duo-text-dark)',
                }}
              >
                <span>{DIFF_LABEL[diff]}</span>
                <span style={{ color: best !== null ? 'var(--duo-blue)' : 'var(--duo-text-light)' }}>
                  {best !== null ? formatTime(best) : '–'}
                </span>
              </div>
            ))}
          </div>

          {avgLast10 !== null && (
            <div
              style={{
                backgroundColor: 'var(--duo-bg-light)',
                padding: '12px 14px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '20px',
                fontWeight: 800,
                fontSize: '0.88rem',
                color: 'var(--duo-text-dark)',
              }}
            >
              ⏱️ Durchschnittszeit (letzte {last10.length} Spiele):{' '}
              <b style={{ color: 'var(--duo-blue)' }}>{formatTime(avgLast10)}</b>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--duo-text-dark)', margin: '0 0 10px 0' }}>
            Letzte Spiele
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            {last5.map((entry, i) => (
              <div
                key={`${entry.date}-${i}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--duo-bg-light)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--duo-text-light)',
                }}
              >
                <span>{formatDate(entry.date)}</span>
                <span style={{ color: 'var(--duo-text-dark)', fontWeight: 800 }}>
                  {DIFF_LABEL[entry.difficulty] ?? entry.difficulty}
                </span>
                <span>{formatTime(entry.timeSeconds)}</span>
                <span>{entry.mistakes} Fehler</span>
                <span style={{ color: 'var(--duo-blue)', fontWeight: 800 }}>+{entry.xpGained} XP</span>
              </div>
            ))}
          </div>
        </>
      )}

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
      backgroundColor: 'var(--duo-bg-card)',
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
