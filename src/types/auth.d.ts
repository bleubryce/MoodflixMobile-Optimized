export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: Date;
  preferences: UserPreferences;
  watchlist: string[];
  watchedMovies: string[];
  favoriteGenres: number[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    watchPartyInvites: boolean;
    movieRecommendations: boolean;
  };
  language: string;
  region: string;
  adultContent: boolean;
}

export interface AuthContextType {
  session: {
    user: User | null;
    accessToken: string | null;
  } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
} 