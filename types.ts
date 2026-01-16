
export enum GameState {
  HOME = 'HOME',
  LEARN_NUMBERS = 'LEARN_NUMBERS',
  COUNTING = 'COUNTING',
  SIMPLE_MATH = 'SIMPLE_MATH',
}

export interface Question {
  id: string;
  type: 'identify' | 'count' | 'math';
  content: string;
  options: number[];
  answer: number;
  imageUrl?: string;
  items?: string[];
}
