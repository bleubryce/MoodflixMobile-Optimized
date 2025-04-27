import { TMDBMovie } from './tmdb';

export interface WatchParty {
  id: string;
  movieId: number;
  movie: TMDBMovie;
  hostId: string;
  status: 'pending' | 'active' | 'ended';
  createdAt: string;
  updatedAt: string;
  participants: WatchPartyParticipant[];
  currentTime: number;
  isPlaying: boolean;
  chatMessages: ChatMessage[];
}

export interface WatchPartyParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  joinedAt: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'left';
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

export interface WatchPartyState {
  movie: TMDBMovie;
  currentTime: number;
  isPlaying: boolean;
  participants: WatchPartyParticipant[];
  chatMessages: ChatMessage[];
}

export interface WatchPartyControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  sendMessage: (content: string) => void;
  leave: () => void;
  invite: (userId: string) => void;
}

export interface WatchPartyError {
  code: string;
  message: string;
  details?: any;
} 