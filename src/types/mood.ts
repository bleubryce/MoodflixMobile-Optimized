export type Mood = 'happy' | 'sad' | 'excited' | 'relaxed' | 'thoughtful';

export interface MoodPreferences {
  genres: number[];
  keywords: string[];
  minRating: number;
}

export interface MoodHistory {
  movieId: number;
  mood: Mood;
  timestamp: string;
}

export interface MoodAnalysis {
  primaryMood: Mood;
  frequency: Record<Mood, number>;
  lastUpdated: string;
} 