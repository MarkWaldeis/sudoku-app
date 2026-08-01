import React from 'react';
import { ModalShell } from './ModalShell';
import { GradCapIcon } from './icons';
import '../../styles/duolingo.css';

/**
 * Mini-Beispielgitter für eine Technik: statische Zahlen, farbige Markierung.
 * `highlight` = Zielzelle(n), `accent` = tragende Zellen der Technik.
 */
interface MiniGridProps {
  cells: (number | string | null)[];
  highlight?: number[];
  accent?: number[];
  cols?: number;
}

const MiniGrid: React.FC<MiniGridProps> = ({ cells, highlight = [], accent = [], cols = 3 }) => (
  <div
    aria-hidden
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '2px',
      backgroundColor: 'var(--duo-gray)',
      border: '2px solid var(--duo-text-dark)',
      borderRadius: '8px',
      overflow: 'hidden',
      width: cols === 3 ? '110px' : '100%',
      margin: '0 auto',
    }}
  >
    {cells.map((val, i) => {
      const isHighlight = highlight.includes(i);
      const isAccent = accent.includes(i);
      return (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: cols === 3 ? '0.85rem' : '0.7rem',
            fontWeight: 800,
            backgroundColor: isHighlight
              ? 'var(--duo-yellow)'
              : isAccent
                ? 'var(--duo-cell-same)'
                : 'var(--duo-bg-card)',
            color: 'var(--duo-text-dark)',
          }}
        >
          {val ?? ''}
        </div>
      );
    })}
  </div>
);

interface TechniqueCard {
  name: string;
  germanName: string;
  explanation: string;
  grid: MiniGridProps;
}

const TECHNIQUES: TechniqueCard[] = [
  {
    name: 'Naked Single',
    germanName: 'Der offene Single',
    explanation:
      'Wenn in einer Zelle nur noch eine einzige Zahl möglich ist (alle anderen stehen schon in Zeile, Spalte oder Block), gehört sie dort hin.',
    grid: {
      cols: 3,
      // In der Mitte ist nur noch die 5 möglich
      cells: [1, 2, 3, 4, null, 6, 7, 8, 9],
      highlight: [4],
    },
  },
  {
    name: 'Hidden Single',
    germanName: 'Der versteckte Single',
    explanation:
      'Eine Zahl kann in einer Zeile, Spalte oder einem Block nur an einer einzigen Stelle stehen – auch wenn dort mehrere Kandidaten möglich wären.',
    grid: {
      cols: 9,
      // In dieser Zeile kann die 7 nur in der markierten Zelle stehen
      cells: [null, 7, null, 7, null, null, 7, null, null],
      highlight: [5],
      accent: [1, 3, 6],
    },
  },
  {
    name: 'Naked Pair',
    germanName: 'Das offene Paar',
    explanation:
      'Zwei Zellen in einer Einheit teilen sich exakt dieselben zwei Kandidaten. Diese beiden Zahlen kannst du aus allen anderen Zellen der Einheit streichen.',
    grid: {
      cols: 9,
      // 2/8-Paar in zwei Zellen der Zeile
      cells: [null, null, 5, null, null, 4, null, null, 9],
      accent: [0, 1],
      highlight: [7],
    },
  },
  {
    name: 'X-Wing',
    germanName: 'Der X-Wing',
    explanation:
      'Steht ein Kandidat in zwei Zeilen jeweils nur in denselben zwei Spalten, bildet er ein X. Dann kann er aus allen anderen Zellen dieser Spalten gestrichen werden.',
    grid: {
      cols: 9,
      // X-Wing über die Ecken zweier Zeilen
      cells: [null, 'X', null, null, 'X', null, null, null, null],
      accent: [1, 4],
    },
  },
];

export const TechniqueSchoolModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalShell onClose={onClose} maxWidth={440}>
    <h2
      style={{
        fontSize: '1.4rem',
        fontWeight: 900,
        color: 'var(--duo-green)',
        margin: '0 0 4px 0',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <GradCapIcon size={24} /> Technik-Schule
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
      Löse Sudokus wie ein Profi – Schritt für Schritt.
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {TECHNIQUES.map((t) => (
        <div
          key={t.name}
          style={{
            backgroundColor: 'var(--duo-bg-light)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          <div style={{ flexShrink: 0, width: t.grid.cols === 3 ? '110px' : '45%' }}>
            <MiniGrid {...t.grid} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--duo-text-dark)' }}>
              {t.germanName}
              <span style={{ fontWeight: 700, color: 'var(--duo-text-light)', fontSize: '0.78rem' }}>
                {' '}· {t.name}
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--duo-text-light)',
                lineHeight: 1.35,
              }}
            >
              {t.explanation}
            </p>
          </div>
        </div>
      ))}
    </div>
  </ModalShell>
);
