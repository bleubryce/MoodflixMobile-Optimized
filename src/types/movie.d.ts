export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  runtime: number;
  status: MovieStatus;
  tagline?: string;
  budget?: number;
  revenue?: number;
  popularity: number;
  imdbId?: string;
  originalLanguage: string;
  originalTitle: string;
  video: boolean;
  adult: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: number;
  name: string;
}

export type MovieStatus = 
  | 'Rumored'
  | 'Planned'
  | 'In Production'
  | 'Post Production'
  | 'Released'
  | 'Canceled';

export interface MovieSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'popularity' | 'vote_average' | 'release_date';
  sortOrder?: 'asc' | 'desc';
  genreIds?: number[];
  year?: number;
  rating?: number;
}

export interface MovieRecommendationParams {
  movieId: string;
  limit?: number;
  excludeWatched?: boolean;
}

export interface MovieReview {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
} 