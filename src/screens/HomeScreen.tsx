import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export const HomeScreen: React.FC = () => {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to MoodFlix</Text>
      {session && <Text variant="bodyLarge">Logged in as: {session.user.email}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 