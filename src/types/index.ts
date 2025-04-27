export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
  genres: { id: number; name: string }[];
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Mood {
  id: string;
  name: string;
  emoji: string;
}

export interface WatchHistory {
  id: string;
  movie_id: number;
  user_id: string;
  watched_at: string;
  mood: string;
}

export interface Favorite {
  id: string;
  movie_id: number;
  user_id: string;
  added_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}
