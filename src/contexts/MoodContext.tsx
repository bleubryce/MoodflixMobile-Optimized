import React, { createContext, useContext, useState, useCallback } from 'react';
import { Mood } from '@errors/mood';
import { ErrorHandler } from '@utils/errorHandler';
import { moodService } from '@services/moodService';
import { useAuth } from '@contexts/auth/AuthContext';

interface MoodContextValue {
  mood: Mood | null;
  setMood: (mood: Mood) => void;
  streak: number;
  lastCheckIn: string | null;
  checkIn: (mood: Mood) => void;
  loading: boolean;
  error: string | null;
}

const MoodContext = createContext<MoodContextValue | undefined>(undefined);

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [mood, setMoodState] = useState<Mood | null>(null);
  const [streak, setStreak] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMood = useCallback((newMood: Mood) => {
    setMoodState(newMood);
  }, []);

  const checkIn = useCallback(async (newMood: Mood) => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (lastCheckIn === today) return;
      setMoodState(newMood);
      setLastCheckIn(today);
      setStreak((prev) => (lastCheckIn && isYesterday(lastCheckIn) ? prev + 1 : 1));
      await moodService.saveMoodPreference(0, session.user.id, newMood); // movieId 0 for daily check-in
    } catch (error) {
      setError('Failed to save mood');
      ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'MoodContext',
        action: 'checkIn',
        additionalInfo: { newMood },
      });
    } finally {
      setLoading(false);
    }
  }, [lastCheckIn, session?.user?.id]);

  function isYesterday(dateStr: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().slice(0, 10);
  }

  // Fetch mood streak on mount
  React.useEffect(() => {
    const fetchStreak = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const history = await moodService.getMoodHistory();
        if (history.length > 0) {
          let streakCount = 1;
          let last = new Date(history[history.length - 1].timestamp);
          for (let i = history.length - 2; i >= 0; i--) {
            const curr = new Date(history[i].timestamp);
            if ((last.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24) === 1) {
              streakCount++;
              last = curr;
            } else {
              break;
            }
          }
          setStreak(streakCount);
          setLastCheckIn(history[history.length - 1].timestamp.slice(0, 10));
        }
      } catch (error) {
        setError('Failed to fetch mood history');
        ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
          componentName: 'MoodContext',
          action: 'fetchStreak',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStreak();
  }, [session?.user?.id]);

  return (
    <MoodContext.Provider value={{ mood, setMood, streak, lastCheckIn, checkIn, loading, error }}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = (): MoodContextValue => {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within a MoodProvider');
  return ctx;
}; 