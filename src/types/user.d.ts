export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  preferences: UserPreferences;
  watchlist: string[];
  watchedMovies: string[];
  favoriteGenres: number[];
  createdAt: string;
  updatedAt: string;
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

export interface UserProfile extends User {
  stats: {
    totalWatchlist: number;
    totalWatched: number;
    totalReviews: number;
    averageRating: number;
  };
  recentActivity: UserActivity[];
}

export interface UserActivity {
  id: string;
  type: UserActivityType;
  movieId: string;
  movieTitle: string;
  createdAt: string;
}

export type UserActivityType = 
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'watched'
  | 'review'
  | 'rating'
  | 'watch_party_join'
  | 'watch_party_create';

export interface UserUpdateData {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'username' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
} 