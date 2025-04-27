import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../contexts/auth/AuthContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  email: {
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});

export const ProfileScreen: React.FC = () => {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{session?.user?.email}</Text>
      <Button mode="contained" onPress={signOut} style={styles.button}>
        Sign Out
      </Button>
    </View>
  );
}; 