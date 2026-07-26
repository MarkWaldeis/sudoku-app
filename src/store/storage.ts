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
