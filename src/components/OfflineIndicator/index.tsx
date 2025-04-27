import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { OfflineService } from '../../services/offlineService';
import { useTheme } from 'react-native-paper';

export const OfflineIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = OfflineService.subscribeToNetworkChanges(setIsConnected);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isConnected, opacity]);

  if (isConnected) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>You are offline</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff4444',
    left: 0,
    padding: 8,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
}); 