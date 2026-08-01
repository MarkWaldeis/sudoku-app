import React from 'react';
import { useGame } from '../../store/GameContext';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { ModalShell } from './ModalShell';
import { CalendarIcon, TrophyIcon } from './icons';
import { getDateKey, getDailyDifficulty } from '../../logic/dailyChallenge';
import '../../styles/duolingo.css';

interface DailyChallengeModalProps {
  onClose: () => void;
  /** Startet das Daily-Puzzle für heute (Verdrahtung in App.tsx). */
  onPlayDaily: () => void;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const DIFF_LABEL: Record<string, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ onClose, onPlayDaily }) => {
  const { profile } = useGame();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-basiert
  const todayKey = getDateKey(now);
  const todayDifficulty = getDailyDifficulty(todayKey);
  const todayDone = profile.dailyCompleted.includes(todayKey);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Montag = 0 ... Sonntag = 6
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const completedSet = new Set(profile.dailyCompleted);
  const dayKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Fortschritt: erledigte Tage von allen Tagen des Monats bis heute
  const elapsedDays = now.getDate();
  let completedThisMonth = 0;
  for (let d = 1; d <= elapsedDays; d++) {
    if (completedSet.has(dayKey(d))) completedThisMonth++;
  }
  const trophyEarned = completedThisMonth === elapsedDays;

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ModalShell onClose={onClose} maxWidth={400}>
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          color: 'var(--duo-blue)',
          margin: '0 0 4px 0',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <CalendarIcon size={24} /> Tägliche Challenge
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontWeight: 700,
          color: 'var(--duo-text-light)',
          fontSize: '0.88rem',
          margin: '0 0 16px 0',
        }}
      >
        {MONTH_NAMES[month]} {year} · Heute: <b style={{ color: 'var(--duo-text-dark)' }}>{DIFF_LABEL[todayDifficulty]}</b>
      </p>

      {/* Kalender-Grid Mo–So */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--duo-text-light)',
              paddingBottom: '2px',
            }}
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const key = dayKey(day);
          const isToday = key === todayKey;
          const isFuture = key > todayKey; // 'YYYY-MM-DD' ist lexikografisch vergleichbar
          const isDone = completedSet.has(key);
          return (
            <div
              key={key}
              aria-label={`${day}. ${MONTH_NAMES[month]}${isDone ? ', abgeschlossen' : ''}${isToday ? ', heute' : ''}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: isFuture
                  ? 'var(--duo-gray)'
                  : isDone
                    ? '#ffffff'
                    : 'var(--duo-text-dark)',
                backgroundColor: isDone
                  ? 'var(--duo-green)'
                  : isToday
                    ? 'var(--duo-tint-blue)'
                    : 'transparent',
                boxShadow: isDone ? '0 2px 0 var(--duo-green-shadow)' : 'none',
                border: isToday ? '2px solid var(--duo-blue)' : '2px solid transparent',
                opacity: isFuture ? 0.55 : 1,
              }}
            >
              {day}
              {isDone && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    fontSize: '0.65rem',
                    lineHeight: 1,
                  }}
                >
                  ✅
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Fortschrittszeile */}
      <div
        style={{
          backgroundColor: 'var(--duo-bg-light)',
          borderRadius: '14px',
          padding: '12px 14px',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: '0.9rem',
          color: 'var(--duo-text-dark)',
          marginBottom: '16px',
        }}
      >
        {completedThisMonth} von {elapsedDays} Tagen geschafft
        {trophyEarned && (
          <div
            style={{
              marginTop: '6px',
              color: 'var(--duo-yellow-shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <TrophyIcon size={18} /> Monats-Trophäe ergattert! 🏆
          </div>
        )}
      </div>

      <button
        className="btn-duo btn-duo-green"
        onClick={() => {
          playPop();
          hapticTap();
          onPlayDaily();
        }}
        style={{ width: '100%', fontSize: '1.05rem' }}
      >
        {todayDone ? 'Nochmal spielen' : 'Heute spielen'}
      </button>
    </ModalShell>
  );
};
