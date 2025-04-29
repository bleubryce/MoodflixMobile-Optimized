import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { SvgUri } from 'react-native-svg';
import { images } from '../constants/assets';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <SvgUri width={50} height={50} uri={images.happy} />
      </View>
      <Text variant="headlineMedium">Welcome to MoodFlix</Text>
      {session && <Text variant="bodyLarge">Logged in as: {session.user.email}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
}); 