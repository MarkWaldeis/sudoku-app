export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  league: 'Bronze' | 'Silber' | 'Gold' | 'Diamant';
  isCurrentUser?: boolean;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'SudoEule 🦉', avatar: '🦉', xp: 2450, league: 'Diamant' },
  { id: '2', name: 'ZahlenAkrobat 🔢', avatar: '🦊', xp: 1890, league: 'Gold' },
  { id: '3', name: 'SudokuMaster99 👑', avatar: '🦁', xp: 1420, league: 'Gold' },
  { id: '4', name: 'MatheProfi 📐', avatar: '🐼', xp: 980, league: 'Silber' },
  { id: '5', name: 'RätselFuchs 🧩', avatar: '🐻', xp: 620, league: 'Bronze' }
];

export const getLeaderboard = (userXp: number, username: string = 'Du'): LeaderboardEntry[] => {
  const userEntry: LeaderboardEntry = {
    id: 'user',
    name: `${username} (Du)`,
    avatar: '⚡',
    xp: userXp,
    league: userXp > 2000 ? 'Diamant' : userXp > 1200 ? 'Gold' : userXp > 500 ? 'Silber' : 'Bronze',
    isCurrentUser: true
  };

  const allEntries = [...DEFAULT_LEADERBOARD.filter(e => e.id !== 'user'), userEntry];
  allEntries.sort((a, b) => b.xp - a.xp);

  return allEntries;
};
