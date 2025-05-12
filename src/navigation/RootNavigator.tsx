import { useTheme } from "@contexts/ThemeContext";
import { useAuth } from "@contexts/auth/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import { ActivityFeedScreen } from "@screens/ActivityFeedScreen";
import { FriendsScreen } from "@screens/FriendsScreen";
import HomeScreen from "@screens/HomeScreen";
import { SearchScreen } from "@screens/SearchScreen";
import React from 'react';
import { ActivityIndicator, View } from "react-native";

import { AuthStack } from "./AuthStack";
import { MainStack } from "./MainStack";

import MovieDetailScreen from "@screens/MovieDetailScreen";
import { ProfileScreen } from "@screens/ProfileScreen";
import WatchPartyScreen from "@screens/WatchPartyScreen";

import { SettingsNavigator } from "./SettingsNavigator";
import { MoodPlaylistsScreen } from '@features/moodPlaylists';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MainTabs: undefined;
  MovieDetail: { movieId: number };
  WatchParty: { movieId: number };
  Settings: undefined;
  MoodPlaylists: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Social: undefined;
  Profile: undefined;
};

type MainTabsProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const SocialStack = createStackNavigator();

const SocialNavigator = () => {
  const { theme } = useTheme();

  return (
    <SocialStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <SocialStack.Screen name="Activity" component={ActivityFeedScreen} />
      <SocialStack.Screen name="Friends" component={FriendsScreen} />
    </SocialStack.Navigator>
  );
};

const MainTabs = ({ navigation }: MainTabsProps) => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Search") {
            iconName = "search";
          } else if (route.name === "Social") {
            iconName = "people";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Social"
        component={SocialNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerRight: () => (
            <MaterialIcons
              name="settings"
              size={24}
              color={theme.colors.text}
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("Settings")}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen
        name="WatchParty"
        component={WatchPartyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MoodPlaylists"
        component={MoodPlaylistsScreen}
        options={{ title: 'Mood Playlists' }}
      />
    </Stack.Navigator>
  );
};
