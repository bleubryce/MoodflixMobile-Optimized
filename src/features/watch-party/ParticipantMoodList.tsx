import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMoodParty } from './MoodPartyContext';
import { ErrorHandler } from '@utils/errorHandler';

export const ParticipantMoodList: React.FC = () => {
  const { participantMoods } = useMoodParty();

  try {
    if (participantMoods.length === 0) {
      return <Text style={styles.empty}>{'No participants yet.'}</Text>;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{'Participant Moods'}</Text>
        {participantMoods.map((p) => (
          <View key={p.userId} style={styles.row}>
            <Text style={styles.username}>{p.username}</Text>
            <Text style={styles.mood}>{p.mood}</Text>
          </View>
        ))}
      </View>
    );
  } catch (error) {
    ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
      componentName: 'ParticipantMoodList',
      action: 'render',
    });
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  username: {
    fontWeight: '600',
    marginRight: 8,
  },
  mood: {
    fontSize: 20,
  },
  empty: {
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 8,
  },
}); 