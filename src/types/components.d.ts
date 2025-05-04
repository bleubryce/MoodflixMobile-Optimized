import { Movie } from "./movie";
import { User } from "./auth";
import { NotificationPreferences } from "./notifications";
import { OfflineState } from "./offline";
import { WatchParty, WatchPartyParticipant, ChatMessage } from "./watchParty";

declare module "src/components/MovieCard" {
  interface MovieCardProps {
    movie: Movie;
    onPress: (movie: Movie) => void;
    onLongPress?: (movie: Movie) => void;
  }
  export const MovieCard: React.FC<MovieCardProps>;
}

declare module "src/components/MovieList" {
  interface MovieListProps {
    movies: Movie[];
    onMoviePress: (movie: Movie) => void;
    onEndReached?: () => void;
    ListHeaderComponent?: React.ReactNode;
    ListFooterComponent?: React.ReactNode;
    ListEmptyComponent?: React.ReactNode;
  }
  export const MovieList: React.FC<MovieListProps>;
}

declare module "src/components/MovieDetails" {
  interface MovieDetailsProps {
    movie: Movie;
    onClose: () => void;
    onWatchPartyPress?: (movie: Movie) => void;
  }
  export const MovieDetails: React.FC<MovieDetailsProps>;
}

declare module "src/components/UserProfile" {
  interface UserProfileProps {
    user: User;
    onEditProfile: () => void;
    onSignOut: () => void;
  }
  export const UserProfile: React.FC<UserProfileProps>;
}

declare module "src/components/NotificationSettings" {
  interface NotificationSettingsProps {
    preferences: NotificationPreferences;
    onPreferencesChange: (preferences: NotificationPreferences) => void;
  }
  export const NotificationSettings: React.FC<NotificationSettingsProps>;
}

declare module "src/components/OfflineIndicator" {
  interface OfflineIndicatorProps {
    offlineState: OfflineState;
    onRetry: () => void;
  }
  export const OfflineIndicator: React.FC<OfflineIndicatorProps>;
}

declare module "src/components/WatchPartyCard" {
  interface WatchPartyCardProps {
    party: WatchParty;
    onJoin: (partyId: string) => void;
    onLeave: (partyId: string) => void;
  }
  export const WatchPartyCard: React.FC<WatchPartyCardProps>;
}

export interface ChatMessageProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export interface ParticipantListProps {
  participants: WatchPartyParticipant[];
  onInvite: () => void;
  onRemove: (userId: string) => void;
}

export interface VideoPlayerProps {
  source: { uri: string };
  style?: any;
  onPlaybackStatusUpdate?: (status: any) => void;
  onLoad?: (status: any) => void;
  onError?: (error: string) => void;
  onReadyForDisplay?: () => void;
  useNativeControls?: boolean;
  shouldPlay?: boolean;
  isLooping?: boolean;
  rate?: number;
  volume?: number;
  isMuted?: boolean;
  progressUpdateIntervalMillis?: number;
  positionMillis?: number;
  posterSource?: { uri: string };
  posterStyle?: any;
  usePoster?: boolean;
  ref?: React.RefObject<any>;
}
