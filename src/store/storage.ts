import localforage from 'localforage';

const storage = localforage.createInstance({
  name: 'sudoku-app',
  storeName: 'game_data'
});

export const saveGame = async (state: any) => {
  try {
    await storage.setItem('saved_game', state);
  } catch (err) {
    console.error('Error saving game:', err);
  }
};

export const loadGame = async () => {
  try {
    return await storage.getItem('saved_game');
  } catch (err) {
    console.error('Error loading game:', err);
    return null;
  }
};

export const clearGame = async () => {
  try {
    await storage.removeItem('saved_game');
  } catch (err) {
    console.error('Error clearing game:', err);
  }
};

export interface UserProfile {
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  unlockedLevels: number[];
  totalGamesPlayed: number;
  correctMoves: number;
  incorrectMoves: number;
}

export const defaultProfile: UserProfile = {
  xp: 0,
  streak: 0,
  lastPlayedDate: null,
  unlockedLevels: [1],
  totalGamesPlayed: 0,
  correctMoves: 0,
  incorrectMoves: 0,
};

export const saveProfile = async (profile: UserProfile) => {
  try {
    await storage.setItem('user_profile', profile);
  } catch (err) {
    console.error('Error saving profile:', err);
  }
};

export const loadProfile = async (): Promise<UserProfile> => {
  try {
    const data = await storage.getItem('user_profile');
    return (data as UserProfile) || defaultProfile;
  } catch (err) {
    console.error('Error loading profile:', err);
    return defaultProfile;
  }
};
