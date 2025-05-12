import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mood } from '@errors/mood';
import { ErrorHandler } from '@utils/errorHandler';
import { useMoodParty } from './MoodPartyContext';

const MOODS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: 'happy', emoji: '😄', label: 'Happy' },
  { mood: 'sad', emoji: '😢', label: 'Sad' },
  { mood: 'excited', emoji: '🤩', label: 'Excited' },
  { mood: 'relaxed', emoji: '🧘', label: 'Relaxed' },
  { mood: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
];

export const MoodPartySelector: React.FC = () => {
  const { partyMood, setPartyMood } = useMoodParty();

  const handleSelect = (mood: Mood) => {
    try {
      setPartyMood(mood);
    } catch (error) {
      ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'MoodPartySelector',
        action: 'setPartyMood',
        additionalInfo: { mood },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{'Select a mood for your watch party:'}</Text>
      <View style={styles.moodRow}>
        {MOODS.map(({ mood, emoji, label }) => (
          <Text
            key={mood}
            style={[styles.emoji, partyMood === mood && styles.selected]}
            onPress={() => handleSelect(mood)}
            accessibilityLabel={label}
          >
            {emoji}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selected: {
    backgroundColor: '#ffe066',
  },
}); 