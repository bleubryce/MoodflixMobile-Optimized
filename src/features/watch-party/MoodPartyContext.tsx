import React, { createContext, useContext, useState, useCallback } from 'react';
import { Mood } from '@errors/mood';
import { ErrorHandler } from '@utils/errorHandler';

export interface ParticipantMood {
  userId: string;
  username: string;
  mood: Mood;
}

interface MoodPartyContextValue {
  partyMood: Mood | null;
  setPartyMood: (mood: Mood) => void;
  participantMoods: ParticipantMood[];
  setParticipantMood: (userId: string, username: string, mood: Mood) => void;
}

const MoodPartyContext = createContext<MoodPartyContextValue | undefined>(undefined);

export const MoodPartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partyMood, setPartyMoodState] = useState<Mood | null>(null);
  const [participantMoods, setParticipantMoods] = useState<ParticipantMood[]>([]);

  const setPartyMood = useCallback((mood: Mood) => {
    setPartyMoodState(mood);
  }, []);

  const setParticipantMood = useCallback((userId: string, username: string, mood: Mood) => {
    setParticipantMoods((prev) => {
      const existing = prev.find((p) => p.userId === userId);
      if (existing) {
        return prev.map((p) => (p.userId === userId ? { ...p, mood } : p));
      }
      return [...prev, { userId, username, mood }];
    });
  }, []);

  return (
    <MoodPartyContext.Provider value={{ partyMood, setPartyMood, participantMoods, setParticipantMood }}>
      {children}
    </MoodPartyContext.Provider>
  );
};

export const useMoodParty = (): MoodPartyContextValue => {
  const ctx = useContext(MoodPartyContext);
  if (!ctx) throw new Error('useMoodParty must be used within a MoodPartyProvider');
  return ctx;
}; 