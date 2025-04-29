import { Movie } from './movie';
import { User } from './auth';
import { WatchParty } from './watchParty';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieResponse extends ApiResponse<Movie> {}
export interface MoviesResponse extends PaginatedResponse<Movie> {}

export interface UserResponse extends ApiResponse<User> {}

export interface WatchPartyResponse extends ApiResponse<WatchParty> {}
export interface WatchPartiesResponse extends PaginatedResponse<WatchParty> {}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  video: boolean;
  adult: boolean;
  original_language: string;
  original_title: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieResponse extends TMDBResponse<TMDBMovie> {} 