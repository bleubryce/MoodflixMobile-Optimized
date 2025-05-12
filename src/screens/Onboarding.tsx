import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { MoodSelector } from '@features/moodInput';
import { PlaylistEditor } from '@features/moodPlaylists';
import { ErrorHandler } from '@utils/errorHandler';
import { Mood } from '@errors/mood';

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [playlistCreated, setPlaylistCreated] = useState(false);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const handlePlaylistSave = () => {
    setPlaylistCreated(true);
  };

  try {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{'Welcome to MoodFlix!'}</Text>
        {step === 0 && (
          <>
            <Text style={styles.subheader}>{'Set your initial mood preference:'}</Text>
            <MoodSelector value={selectedMood ?? undefined} onChange={handleMoodSelect} />
            <Button
              title={'Next'}
              onPress={() => setStep(1)}
              disabled={!selectedMood}
            />
          </>
        )}
        {step === 1 && (
          <>
            <Text style={styles.subheader}>{'Create your first Mood Playlist:'}</Text>
            <PlaylistEditor onSave={handlePlaylistSave} onCancel={() => setStep(0)} />
            {playlistCreated && (
              <Button title={'Finish'} onPress={() => setStep(2)} />
            )}
          </>
        )}
        {step === 2 && (
          <Text style={styles.subheader}>{'You're all set! Enjoy MoodFlix.'}</Text>
        )}
      </View>
    );
  } catch (error) {
    ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
      componentName: 'OnboardingScreen',
      action: 'render',
    });
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
}); 