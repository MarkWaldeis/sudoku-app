import React, { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { ModalShell } from './ModalShell';
import { GearIcon } from './icons';
import '../../styles/duolingo.css';

interface SettingsModalProps {
  onClose: () => void;
}

/** Hübscher Switch im Duolingo-Stil (native button mit role="switch"). */
const ToggleRow: React.FC<{
  emoji: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ emoji, label, description, checked, onToggle }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => {
      playPop();
      hapticTap();
      onToggle();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px',
      borderRadius: '16px',
      border: '2px solid var(--duo-gray)',
      backgroundColor: 'var(--duo-bg-card)',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'inherit',
    }}
  >
    <span style={{ fontSize: '1.4rem', lineHeight: 1 }} aria-hidden>
      {emoji}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontWeight: 800, color: 'var(--duo-text-dark)', fontSize: '0.95rem' }}>
        {label}
      </span>
      <span style={{ display: 'block', fontWeight: 600, color: 'var(--duo-text-light)', fontSize: '0.78rem' }}>
        {description}
      </span>
    </span>
    <span
      aria-hidden
      style={{
        width: '52px',
        height: '30px',
        borderRadius: '999px',
        flexShrink: 0,
        backgroundColor: checked ? 'var(--duo-green)' : 'var(--duo-gray)',
        boxShadow: checked ? '0 3px 0 var(--duo-green-shadow)' : '0 3px 0 var(--duo-gray-shadow)',
        position: 'relative',
        transition: 'background-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
          transition: 'left 150ms var(--ease-out)',
        }}
      />
    </span>
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { profile, updateSettings, exportSyncCode, importSyncCode } = useGame();

  const [syncCode, setSyncCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleCreateCode = () => {
    playPop();
    hapticTap();
    setSyncCode(exportSyncCode());
    setFeedback({ ok: true, text: 'Code erstellt – sichere ihn an einem Ort deiner Wahl.' });
  };

  const handleCopy = async () => {
    playPop();
    hapticTap();
    try {
      await navigator.clipboard.writeText(syncCode);
      setFeedback({ ok: true, text: 'Code kopiert!' });
    } catch {
      // Fallback für Browser ohne Clipboard-API (z.B. HTTP-Kontext)
      const ta = document.createElement('textarea');
      ta.value = syncCode;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setFeedback({ ok: true, text: 'Code kopiert!' });
      } catch {
        setFeedback({ ok: false, text: 'Kopieren fehlgeschlagen – bitte manuell markieren.' });
      }
      document.body.removeChild(ta);
    }
  };

  const handleImport = () => {
    playPop();
    hapticTap();
    if (!importCode.trim()) {
      setFeedback({ ok: false, text: 'Bitte füge zuerst einen Code ein.' });
      return;
    }
    if (importSyncCode(importCode)) {
      setFeedback({ ok: true, text: 'Spielstand erfolgreich eingespielt! 🎉' });
      setImportCode('');
      setSyncCode('');
    } else {
      setFeedback({ ok: false, text: 'Dieser Code ist leider ungültig. Bitte prüfe ihn und versuche es erneut.' });
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--duo-blue)',
          margin: '0 0 20px 0',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <GearIcon size={24} /> Einstellungen
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <ToggleRow
          emoji="🌙"
          label="Dunkelmodus"
          description="Schont die Augen beim nächtlichen Rätseln"
          checked={profile.theme === 'dark'}
          onToggle={() => updateSettings({ theme: profile.theme === 'dark' ? 'light' : 'dark' })}
        />
        <ToggleRow
          emoji="🧘"
          label="Zen-Modus"
          description="Timer ausblenden – ganz entspannt spielen"
          checked={profile.zenMode}
          onToggle={() => updateSettings({ zenMode: !profile.zenMode })}
        />
        <ToggleRow
          emoji="🚨"
          label="Fehler-Markierung"
          description="Falsche Zahlen rot markieren"
          checked={profile.errorHighlight}
          onToggle={() => updateSettings({ errorHighlight: !profile.errorHighlight })}
        />
        <ToggleRow
          emoji="✏️"
          label="Auto-Notizen aufräumen"
          description="Gesetzte Zahlen aus Notizen entfernen"
          checked={profile.autoPencilCleanup}
          onToggle={() => updateSettings({ autoPencilCleanup: !profile.autoPencilCleanup })}
        />
      </div>

      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 900,
          color: 'var(--duo-text-dark)',
          margin: '0 0 10px 0',
        }}
      >
        Spielstand sichern (Sync-Code)
      </h3>
      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--duo-text-light)', margin: '0 0 12px 0' }}>
        Achtung: Ein eingespielter Code überschreibt deinen aktuellen Spielstand auf diesem Gerät.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn-duo btn-duo-blue" onClick={handleCreateCode} style={{ width: '100%' }}>
          Code erstellen
        </button>
        {syncCode && (
          <>
            <textarea
              readOnly
              value={syncCode}
              aria-label="Dein Sync-Code"
              onFocus={(e) => e.currentTarget.select()}
              style={{
                width: '100%',
                minHeight: '72px',
                resize: 'vertical',
                borderRadius: '12px',
                border: '2px solid var(--duo-gray)',
                backgroundColor: 'var(--duo-bg-light)',
                color: 'var(--duo-text-dark)',
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                padding: '10px',
              }}
            />
            <button className="btn-duo btn-duo-gray" onClick={handleCopy} style={{ width: '100%' }}>
              Kopieren
            </button>
          </>
        )}

        <input
          type="text"
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          placeholder="Sync-Code hier einfügen …"
          aria-label="Sync-Code einfügen"
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '2px solid var(--duo-gray)',
            backgroundColor: 'var(--duo-bg-light)',
            color: 'var(--duo-text-dark)',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            padding: '12px',
          }}
        />
        <button className="btn-duo btn-duo-green" onClick={handleImport} style={{ width: '100%' }}>
          Code einspielen
        </button>

        {feedback && (
          <div
            role="status"
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '10px',
              borderRadius: '12px',
              color: feedback.ok ? 'var(--duo-green)' : 'var(--duo-red)',
              backgroundColor: feedback.ok ? 'var(--duo-tint-green)' : 'var(--duo-tint-purple)',
            }}
          >
            {feedback.text}
          </div>
        )}
      </div>
    </ModalShell>
  );
};
