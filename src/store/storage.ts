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
  gems: number;
  hints: number;
  streak: number;
  streakFreeze: number;
  lastPlayedDate: string | null;
  unlockedLevels: number[];
  totalGamesPlayed: number;
  correctMoves: number;
  incorrectMoves: number;
  selectedMascotSkin: 'default' | 'fox' | 'king' | 'ninja';
  unlockedSkins: string[];
}

export const defaultProfile: UserProfile = {
  xp: 0,
  gems: 100,
  hints: 3,
  streak: 0,
  streakFreeze: 0,
  lastPlayedDate: null,
  unlockedLevels: [1],
  totalGamesPlayed: 0,
  correctMoves: 0,
  incorrectMoves: 0,
  selectedMascotSkin: 'default',
  unlockedSkins: ['default'],
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
    const data = await storage.getItem<UserProfile>('user_profile');
    if (!data) return defaultProfile;
    return {
      ...defaultProfile,
      ...data,
      gems: data.gems ?? 100,
      hints: data.hints ?? 3,
      streakFreeze: data.streakFreeze ?? 0,
      selectedMascotSkin: data.selectedMascotSkin || 'default',
      unlockedSkins: data.unlockedSkins || ['default'],
    };
  } catch (err) {
    console.error('Error loading profile:', err);
    return defaultProfile;
  }
};
