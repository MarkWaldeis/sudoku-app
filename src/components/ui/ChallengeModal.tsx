import React, { useState } from 'react';
import { ModalShell } from './ModalShell';
import { SwordsIcon } from './icons';
import { playPop, playSuccessChime, playErrorBuzz } from '../../utils/soundEffects';
import { hapticTap, hapticSuccess, hapticError } from '../../utils/haptics';
import { encodeChallenge, decodeChallenge, generateRandomChallengeSeed } from '../../logic/dailyChallenge';
import '../../styles/duolingo.css';

type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

const DIFF_OPTIONS: { id: ChallengeDifficulty; label: string }[] = [
  { id: 'easy', label: 'Leicht' },
  { id: 'medium', label: 'Mittel' },
  { id: 'hard', label: 'Schwer' },
];

/** Clipboard mit Fallback für ältere Browser / nicht-sichere Kontexte. */
const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // weiter zum Fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

const DifficultyPicker: React.FC<{ value: ChallengeDifficulty; onChange: (d: ChallengeDifficulty) => void }> = ({
  value,
  onChange,
}) => (
  <div role="radiogroup" aria-label="Schwierigkeit wählen" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
    {DIFF_OPTIONS.map((opt) => (
      <button
        key={opt.id}
        role="radio"
        aria-checked={value === opt.id}
        className={`btn-duo ${value === opt.id ? 'btn-duo-blue' : 'btn-duo-gray'}`}
        onClick={() => {
          playPop();
          hapticTap();
          onChange(opt.id);
        }}
        style={{ padding: '10px 16px', fontSize: '0.9rem', flex: 1 }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

interface ChallengeModalProps {
  onClose: () => void;
  /** Startet das Duell mit gewählter Schwierigkeit und Seed (Verdrahtung in App.tsx). */
  onStartChallenge: (difficulty: ChallengeDifficulty, seed: number) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ onClose, onStartChallenge }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [createDiff, setCreateDiff] = useState<ChallengeDifficulty>('medium');
  const [createdSeed, setCreatedSeed] = useState<number | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [joinDiff, setJoinDiff] = useState<ChallengeDifficulty>('medium');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const createdCode = createdSeed !== null ? encodeChallenge(createdSeed) : null;
  const shareLink = createdCode
    ? `${window.location.href.split('#')[0]}#challenge=${createdCode}`
    : null;

  const handleCreate = () => {
    playPop();
    hapticTap();
    setCreatedSeed(generateRandomChallengeSeed());
    setCopied(null);
  };

  const handleCopy = async (text: string, kind: 'code' | 'link') => {
    const ok = await copyText(text);
    if (ok) {
      playSuccessChime();
      hapticSuccess();
      setCopied(kind);
    } else {
      playErrorBuzz();
      hapticError();
      setCopied(null);
    }
  };

  const handleJoin = () => {
    const seed = decodeChallenge(joinCode);
    if (seed === null) {
      playErrorBuzz();
      hapticError();
      setJoinError('Dieser Code ist ungültig. Prüfe die Schreibweise und versuche es erneut.');
      return;
    }
    setJoinError(null);
    onStartChallenge(joinDiff, seed);
  };

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    fontSize: '0.95rem',
    opacity: active ? 1 : 0.85,
  });

  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          color: 'var(--duo-purple)',
          margin: '0 0 4px 0',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <SwordsIcon size={24} /> Freund herausfordern
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
        Beide spielen dasselbe Sudoku – wer ist schneller?
      </p>

      {/* Tab-Umschalter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn-duo ${tab === 'create' ? 'btn-duo-purple' : 'btn-duo-gray'}`}
          onClick={() => {
            playPop();
            hapticTap();
            setTab('create');
          }}
          style={tabButtonStyle(tab === 'create')}
        >
          Herausfordern
        </button>
        <button
          className={`btn-duo ${tab === 'join' ? 'btn-duo-purple' : 'btn-duo-gray'}`}
          onClick={() => {
            playPop();
            hapticTap();
            setTab('join');
          }}
          style={tabButtonStyle(tab === 'join')}
        >
          Code eingeben
        </button>
      </div>

      {tab === 'create' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <DifficultyPicker value={createDiff} onChange={setCreateDiff} />

          <button className="btn-duo btn-duo-green" onClick={handleCreate} style={{ width: '100%', fontSize: '1.05rem' }}>
            ⚔️ Neues Duell erstellen
          </button>

          {createdCode && shareLink && (
            <div
              style={{
                backgroundColor: 'var(--duo-bg-light)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  color: 'var(--duo-text-dark)',
                }}
                aria-label={`Duell-Code ${createdCode}`}
              >
                {createdCode}
              </div>
              <button
                className="btn-duo btn-duo-blue"
                onClick={() => handleCopy(createdCode, 'code')}
                style={{ width: '100%' }}
              >
                {copied === 'code' ? '✅ Code kopiert!' : 'Code kopieren'}
              </button>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--duo-text-light)',
                  wordBreak: 'break-all',
                  textAlign: 'center',
                }}
              >
                {shareLink}
              </div>
              <button
                className="btn-duo btn-duo-gray"
                onClick={() => handleCopy(shareLink, 'link')}
                style={{ width: '100%' }}
              >
                {copied === 'link' ? '✅ Link kopiert!' : 'Teilen-Link kopieren'}
              </button>
              <button
                className="btn-duo btn-duo-yellow"
                onClick={() => createdSeed !== null && onStartChallenge(createDiff, createdSeed)}
                style={{ width: '100%' }}
              >
                Selbst spielen ({DIFF_OPTIONS.find((o) => o.id === createDiff)?.label})
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError(null);
            }}
            placeholder="Duell-Code eingeben …"
            aria-label="Duell-Code"
            autoCapitalize="characters"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textAlign: 'center',
              borderRadius: '14px',
              border: '2px solid var(--duo-gray)',
              backgroundColor: 'var(--duo-bg-card)',
              color: 'var(--duo-text-dark)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          {joinError && (
            <div
              role="alert"
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--duo-red)',
                backgroundColor: 'var(--duo-cell-wrong)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              {joinError}
            </div>
          )}
          <DifficultyPicker value={joinDiff} onChange={setJoinDiff} />
          <p
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--duo-text-light)',
              textAlign: 'center',
              margin: 0,
            }}
          >
            Hinweis: Für einen fairen Vergleich sollten beide Spieler dieselbe Schwierigkeit wählen.
          </p>
          <button
            className="btn-duo btn-duo-green"
            onClick={handleJoin}
            disabled={joinCode.trim().length === 0}
            style={{ width: '100%', fontSize: '1.05rem' }}
          >
            Duell starten
          </button>
        </div>
      )}
    </ModalShell>
  );
};
