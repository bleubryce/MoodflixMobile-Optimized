import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  MovieDetails: { movieId: number };
};

const Stack = createStackNavigator<MainStackParamList>();

// Placeholder component until we implement the actual screens
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{title}</Text>
  </View>
);

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={() => <PlaceholderScreen title="Home Screen" />}
        options={{ title: 'MoodFlix' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={() => <PlaceholderScreen title="Profile Screen" />}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="MovieDetails" 
        component={() => <PlaceholderScreen title="Movie Details" />}
        options={{ title: 'Movie Details' }}
      />
    </Stack.Navigator>
  );
}; 