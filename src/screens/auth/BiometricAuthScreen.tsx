import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BiometricService } from '../../services/biometricService';
import { useAuth } from '../../contexts/auth/AuthContext';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'BiometricAuth'>;

export const BiometricAuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const { signIn } = useAuth();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const isAvailable = await BiometricService.isBiometricAvailable();
      const isEnabled = await BiometricService.isBiometricEnabled();

      if (!isAvailable || !isEnabled) {
        navigation.navigate('Login');
        return;
      }

      await handleBiometricAuth();
    } catch (error) {
      setError('Failed to check biometric status');
      console.error('Error checking biometric status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await BiometricService.authenticate();
      if (result.success) {
        const token = await BiometricService.getAuthToken();
        if (token) {
          await signIn(token, 'biometric');
        } else {
          navigation.navigate('Login');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error during biometric authentication:', error);
    }
  };

  const handleUsePassword = () => {
    navigation.navigate('Login');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.title}>Welcome to MoodFlix</Text>
      <Text style={styles.subtitle}>Use biometric authentication to sign in</Text>
      <Button
        mode="contained"
        onPress={handleBiometricAuth}
        style={styles.button}
        testID="biometric-button"
      >
        Authenticate
      </Button>
      <Button
        mode="text"
        onPress={handleUsePassword}
        style={styles.button}
        testID="password-button"
      >
        Use Password Instead
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
    minWidth: 200,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 