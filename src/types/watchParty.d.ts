export interface WatchParty {
  id: string;
  movieId: string;
  movieTitle: string;
  hostId: string;
  hostUsername: string;
  startTime: string;
  status: WatchPartyStatus;
  participants: WatchPartyParticipant[];
  chatMessages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type WatchPartyStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface WatchPartyParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: string;
  status: ParticipantStatus;
}

export type ParticipantStatus = 'invited' | 'joined' | 'left';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

export interface WatchPartyCreateData {
  movieId: string;
  startTime: string;
  participantIds: string[];
}

export interface WatchPartyUpdateData {
  startTime?: string;
  status?: WatchPartyStatus;
}

export interface WatchPartySearchParams {
  movieId?: string;
  hostId?: string;
  status?: WatchPartyStatus;
  startTimeFrom?: string;
  startTimeTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'startTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
} 