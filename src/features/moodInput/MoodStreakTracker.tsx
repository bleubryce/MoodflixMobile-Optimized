import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorHandler } from '@utils/errorHandler';

export interface MoodStreakTrackerProps {
  streakCount: number;
  lastCheckIn: string; // ISO date string
}

export const MoodStreakTracker: React.FC<MoodStreakTrackerProps> = ({ streakCount, lastCheckIn }) => {
  try {
    return (
      <View style={styles.container}>
        <Text style={styles.streakLabel}>{`🔥 ${streakCount} day streak!`}</Text>
        <Text style={styles.lastCheckIn}>{`Last check-in: ${new Date(lastCheckIn).toLocaleDateString()}`}</Text>
      </View>
    );
  } catch (error) {
    ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
      componentName: 'MoodStreakTracker',
      action: 'render',
      additionalInfo: { streakCount, lastCheckIn },
    });
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9900',
  },
  lastCheckIn: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
}); 