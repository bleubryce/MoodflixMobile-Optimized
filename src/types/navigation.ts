import { IconButton } from 'react-native-paper';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MovieDetail: { movieId: number };
  Search: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  WatchParty: undefined;
  Friends: undefined;
  Activity: undefined;
};

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  route: {
    name: keyof MainTabParamList;
  };
}

export type IconName = Parameters<typeof IconButton>[0]['icon']; 