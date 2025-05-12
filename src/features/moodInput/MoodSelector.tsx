import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mood } from '@errors/mood';
import { ErrorHandler } from '@utils/errorHandler';

const MOODS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: 'happy', emoji: '😄', label: 'Happy' },
  { mood: 'sad', emoji: '😢', label: 'Sad' },
  { mood: 'excited', emoji: '🤩', label: 'Excited' },
  { mood: 'relaxed', emoji: '🧘', label: 'Relaxed' },
  { mood: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
];

export interface MoodSelectorProps {
  value?: Mood;
  onChange: (mood: Mood) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange }) => {
  const handleSelect = (mood: Mood) => {
    try {
      onChange(mood);
    } catch (error) {
      ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'MoodSelector',
        action: 'onChange',
        additionalInfo: { mood },
      });
    }
  };

  return (
    <View style={styles.container}>
      {MOODS.map(({ mood, emoji, label }) => (
        <TouchableOpacity
          key={mood}
          style={[styles.moodButton, value === mood && styles.selected]}
          onPress={() => handleSelect(mood)}
          accessibilityLabel={label}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  selected: {
    backgroundColor: '#ffe066',
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    fontSize: 14,
    marginTop: 4,
  },
}); 