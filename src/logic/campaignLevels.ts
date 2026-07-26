import { type Difficulty } from './sudokuGenerator';

export interface CampaignLevel {
  id: number;
  difficulty: Difficulty;
  xpReward: number;
  description: string;
}

export const campaignLevels: CampaignLevel[] = [
  { id: 1, difficulty: 'easy', xpReward: 100, description: 'Level 1: Easy Start' },
  { id: 2, difficulty: 'easy', xpReward: 120, description: 'Level 2: Warming Up' },
  { id: 3, difficulty: 'easy', xpReward: 150, description: 'Level 3: Quick Thinker' },
  { id: 4, difficulty: 'easy', xpReward: 180, description: 'Level 4: Getting Faster' },
  { id: 5, difficulty: 'medium', xpReward: 200, description: 'Level 5: Medium Challenge' },
  { id: 6, difficulty: 'medium', xpReward: 250, description: 'Level 6: Tricky Spots' },
  { id: 7, difficulty: 'medium', xpReward: 300, description: 'Level 7: Halfway There' },
  { id: 8, difficulty: 'medium', xpReward: 350, description: 'Level 8: Staying Focused' },
  { id: 9, difficulty: 'medium', xpReward: 400, description: 'Level 9: Almost Hard' },
  { id: 10, difficulty: 'hard', xpReward: 500, description: 'Level 10: Hard Mode' },
  { id: 11, difficulty: 'hard', xpReward: 550, description: 'Level 11: Serious Business' },
  { id: 12, difficulty: 'hard', xpReward: 600, description: 'Level 12: Expert Mind' },
  { id: 13, difficulty: 'hard', xpReward: 650, description: 'Level 13: Tough Grid' },
  { id: 14, difficulty: 'hard', xpReward: 700, description: 'Level 14: Unforgiving' },
  { id: 15, difficulty: 'hard', xpReward: 800, description: 'Level 15: Expert Tier' },
  { id: 16, difficulty: 'hard', xpReward: 900, description: 'Level 16: Master Class' },
  { id: 17, difficulty: 'hard', xpReward: 1000, description: 'Level 17: Grandmaster' },
  { id: 18, difficulty: 'hard', xpReward: 1200, description: 'Level 18: Brain Drain' },
  { id: 19, difficulty: 'hard', xpReward: 1500, description: 'Level 19: Epic Puzzle' },
  { id: 20, difficulty: 'hard', xpReward: 2000, description: 'Level 20: Sudoku God' },
];
