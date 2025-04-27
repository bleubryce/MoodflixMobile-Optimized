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
  original_language: string;
  original_title: string;
  adult: boolean;
  video: boolean;
}

export interface TMDBMovieDetails extends Omit<TMDBMovie, 'genre_ids'> {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
  status: string;
} 