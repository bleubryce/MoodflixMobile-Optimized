import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Text, ActivityIndicator } from 'react-native-paper';
import { BiometricService } from '../../services/biometricService';
import { useTheme } from 'react-native-paper';

export const BiometricSettings: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      setIsLoading(true);
      const available = await BiometricService.isBiometricAvailable();
      const enabled = await BiometricService.isBiometricEnabled();
      setIsAvailable(available);
      setIsEnabled(enabled);
    } catch (error) {
      setError('Failed to check biometric status');
      console.error('Error checking biometric status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      if (isEnabled) {
        await BiometricService.disableBiometric();
        setIsEnabled(false);
      } else {
        const result = await BiometricService.authenticate();
        if (result.success) {
          await BiometricService.enableBiometric();
          setIsEnabled(true);
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      setError('Failed to update biometric settings');
      console.error('Error toggling biometric:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text>Biometric authentication is not available on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <List.Section>
        <List.Item
          title="Biometric Authentication"
          description="Use Face ID, Touch ID, or fingerprint to sign in"
          right={() => (
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              disabled={isLoading}
              testID="biometric-switch"
            />
          )}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
}); 