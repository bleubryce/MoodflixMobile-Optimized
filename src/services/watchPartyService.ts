import { supabase } from "@config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TMDBMovie } from "../types/tmdb";
import { WatchPartyState, ChatMessage } from "../types/watch-party";
import { AuthenticationError, DatabaseError, NetworkError, CacheError, SubscriptionError } from "@errors/errors";
import { ErrorHandler } from "../utils/errorHandler";
import { getMovieDetails } from "./movieService";
import NotificationService from "./notificationService";
import { OfflineService } from "./offlineService";
import { User } from "../types/user";
import { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

const MAX_PARTICIPANTS = 20;
const CHAT_HISTORY_LIMIT = 100;
const SYNC_INTERVAL = 1000; // 1 second
const WATCH_PARTY_CACHE_KEY = "@watch_parties_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second

export type WatchPartyStatus = "pending" | "active" | "ended";
export type ParticipantStatus = "active" | "inactive" | "left";

export interface WatchParty {
  id: string;
  movieId: number;
  movie: TMDBMovie;
  hostId: string;
  status: WatchPartyStatus;
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
  status: ParticipantStatus;
  mood?: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface BlockedUser {
  blocked_id: string;
  blocked: User;
}

interface DatabaseParticipant {
  user_id: string;
  username: string;
  avatar_url?: string;
  joined_at: string;
  last_seen: string;
  status: string;
  mood?: string;
}

interface DatabaseWatchParty {
  id: string;
  movie_id: number;
  host_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_time: number;
  is_playing: boolean;
  chat_messages: ChatMessage[];
  participants: DatabaseParticipant[];
}

interface WatchPartyError {
  code: string;
  message: string;
  details?: unknown;
}

interface PresenceUser {
  username: string;
  userId: string;
  avatarUrl?: string;
}

interface PresencePayload {
  username?: string;
  user_id?: string;
  avatar_url?: string;
}

interface ParticipantUpdateParams {
  status: ParticipantStatus;
  last_seen: string;
}

interface PlaybackUpdateParams {
  is_playing: boolean;
  current_time: number;
  updated_at: string;
}

class WatchPartyServiceImpl {
  private static instance: WatchPartyServiceImpl | null = null;
  private currentParty: WatchParty | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private subscription: RealtimeChannel | null = null;
  private stateUpdateCallbacks: ((party: WatchParty) => void)[] = [];
  private readonly errorHandler: ErrorHandler;
  private readonly notificationService: NotificationService;
  private readonly offlineService: typeof OfflineService;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.offlineService = OfflineService;
  }

  static getInstance(): WatchPartyServiceImpl {
    if (!WatchPartyServiceImpl.instance) {
      WatchPartyServiceImpl.instance = new WatchPartyServiceImpl();
    }
    return WatchPartyServiceImpl.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        throw new AuthenticationError("No active session", "auth", "getSession");
      }
      return session.user.id;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "WatchPartyService",
          action: "getCurrentUserId"
        });
      }
      throw error;
    }
  }

  private async getCurrentUserEmail(): Promise<string> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user || !user.email) {
        throw new AuthenticationError("User email not found", "auth", "getUser");
      }
      return user.email;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "WatchPartyService",
          action: "getCurrentUserEmail"
        });
      }
      throw error;
    }
  }

  async createWatchParty(
    movieId: number,
    startTime: Date,
    invitedUserIds: string[],
  ): Promise<WatchParty> {
    try {
      const userId = await this.getCurrentUserId();

      // Start a transaction
      const { data: party, error: partyError } = await supabase
        .from("watch_party")
        .insert({
          host_id: userId,
          movie_id: movieId,
          start_time: startTime.toISOString(),
          status: "scheduled",
        })
        .select()
        .single();

      if (partyError) {
        throw new DatabaseError(
          "Failed to create watch party",
          "create",
          "watch_party",
          partyError
        );
      }

      // Invite participants
      const participants = invitedUserIds.map((userId) => ({
        party_id: party.id,
        user_id: userId,
        status: "invited",
      }));

      const { error: participantError } = await supabase
        .from("watch_party_participants")
        .insert(participants);

      if (participantError) {
        // Rollback by deleting the party
        await supabase.from("watch_party").delete().eq("id", party.id);
        throw new DatabaseError(
          "Failed to add participants",
          "create",
          "watch_party_participants",
          participantError
        );
      }

      // Update local cache
      await this.addToLocalCache(party);

      return party;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "WatchPartyService",
          action: "createWatchParty",
          additionalInfo: { movieId, startTime, invitedUserIds }
        });
      }
      throw error;
    }
  }

  private async addToLocalCache(party: WatchParty): Promise<void> {
    try {
      const cacheData: CacheItem<WatchParty> = {
        data: party,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(
        `${WATCH_PARTY_CACHE_KEY}_${party.id}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      throw new CacheError(
        "Failed to cache watch party",
        WATCH_PARTY_CACHE_KEY,
        "write"
      );
    }
  }

  private async getFromLocalCache(partyId: string): Promise<WatchParty | null> {
    try {
      const cachedData = await AsyncStorage.getItem(`${WATCH_PARTY_CACHE_KEY}_${partyId}`);
      if (!cachedData) return null;

      const cache: CacheItem<WatchParty> = JSON.parse(cachedData);
      
      if (Date.now() - cache.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`${WATCH_PARTY_CACHE_KEY}_${partyId}`);
        return null;
      }

      return cache.data;
    } catch (error) {
      throw new CacheError(
        "Failed to read watch party from cache",
        WATCH_PARTY_CACHE_KEY,
        "read"
      );
    }
  }

  async getWatchParties(status?: WatchPartyStatus): Promise<WatchParty[]> {
    try {
      const userId = await this.getCurrentUserId();

      // Try cache first for all parties
      try {
        const cached = await AsyncStorage.getItem(WATCH_PARTY_CACHE_KEY);
        if (cached) {
          const { data: parties, timestamp }: CacheItem<WatchParty[]> = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            return status 
              ? parties.filter((party) => party.status === status) 
              : parties;
          }
        }
      } catch (error) {
        const cacheError = new CacheError(
          "Failed to read watch party cache",
          WATCH_PARTY_CACHE_KEY,
          "read"
        );
        await this.errorHandler.handleError(cacheError, {
          componentName: "WatchPartyService",
          action: "getWatchParties",
          severity: "warning"
        });
      }

      // Fetch from server
      let query = supabase
        .from("watch_party")
        .select(
          `
          *,
          participants:watch_party_participants(
            user_id,
            username,
            avatar_url,
            joined_at,
            last_seen,
            status
          )
        `,
        )
        .or(`host_id.eq.${userId},participants.user_id.eq.${userId}`);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) {
        throw new DatabaseError(
          "Failed to fetch watch parties",
          "read",
          "watch_party",
          error
        );
      }

      // Fetch movie details for each party
      const partiesWithMovies = await Promise.all(
        (data as DatabaseWatchParty[]).map(async (party) => {
          const { data: movieDetails } = await getMovieDetails(party.movie_id);
          if (!movieDetails) {
            throw new DatabaseError(
              "Failed to fetch movie details",
              "read",
              "movies",
              { movieId: party.movie_id }
            );
          }

          return {
            id: party.id,
            movieId: party.movie_id,
            movie: {
              id: movieDetails.id,
              title: movieDetails.title,
              overview: movieDetails.overview,
              poster_path: movieDetails.poster_path,
              backdrop_path: movieDetails.backdrop_path,
              release_date: movieDetails.release_date,
              vote_average: movieDetails.vote_average,
              vote_count: movieDetails.vote_count,
              genre_ids: movieDetails.genres?.map(g => g.id) || [],
              popularity: movieDetails.popularity,
              original_language: movieDetails.original_language,
              original_title: movieDetails.original_title,
              adult: movieDetails.adult,
              video: movieDetails.video
            },
            hostId: party.host_id,
            status: party.status as WatchPartyStatus,
            createdAt: party.created_at,
            updatedAt: party.updated_at,
            participants: party.participants.map((participant: DatabaseParticipant) => ({
              userId: participant.user_id,
              username: participant.username,
              avatarUrl: participant.avatar_url,
              joinedAt: participant.joined_at,
              lastSeen: participant.last_seen,
              status: participant.status as ParticipantStatus,
              mood: participant.mood,
            })),
            currentTime: party.current_time || 0,
            isPlaying: party.is_playing || false,
            chatMessages: party.chat_messages || [],
          };
        }),
      );

      // Update cache
      await AsyncStorage.setItem(
        WATCH_PARTY_CACHE_KEY,
        JSON.stringify({
          data: partiesWithMovies,
          timestamp: Date.now()
        })
      );

      return partiesWithMovies;
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "WatchPartyService",
          action: "getWatchParties",
          additionalInfo: { status }
        });
      }
      throw error;
    }
  }

  async updatePartyStatus(
    partyId: string,
    status: WatchPartyStatus,
  ): Promise<WatchParty> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("watch_party")
      .update({ status })
      .eq("id", partyId)
      .eq("host_id", user.id) // Only host can update status
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateParticipantStatus(
    partyId: string,
    status: ParticipantStatus,
  ): Promise<WatchPartyParticipant> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("watch_party_participants")
      .update({ status })
      .eq("party_id", partyId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPartyParticipants(
    partyId: string,
  ): Promise<WatchPartyParticipant[]> {
    const { data, error } = await supabase
      .from("watch_party_participants")
      .select(
        `
        *,
        user:profiles(*)
      `,
      )
      .eq("party_id", partyId);

    if (error) throw error;
    return data;
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(WATCH_PARTY_CACHE_KEY);
  }

  async joinWatchParty(partyId: string): Promise<WatchParty> {
    try {
      const { data: party, error } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();

      if (error) throw error;
      if (!party) throw new Error("Watch party not found");

      if (party.participants && party.participants.length >= MAX_PARTICIPANTS) {
        throw new Error("Watch party is full");
      }

      const userId = await this.getCurrentUserId();
      const userEmail = await this.getCurrentUserEmail();

      // Check if user is already a participant
      const existingParticipant = party.participants?.find(
        (participant: WatchPartyParticipant) => participant.userId === userId,
      );

      if (existingParticipant) {
        // Update existing participant
        const updatedParticipants = party.participants.map((participant: WatchPartyParticipant) =>
          participant.userId === userId
            ? { ...participant, status: "active", lastSeen: new Date().toISOString() }
            : participant,
        );

        const { data: updatedParty, error: updateError } = await supabase
          .from("watch_parties")
          .update({
            participants: updatedParticipants,
            updated_at: new Date().toISOString(),
          })
          .eq("id", partyId)
          .select("*")
          .single();

        if (updateError) throw updateError;

        // Add system message about rejoining
        await this.addSystemMessage(`${userEmail} rejoined the watch party`);

        this.currentParty = updatedParty;
        this.setupRealtimeSubscription();
        return updatedParty;
      } else {
        // Add new participant
        const newParticipant: WatchPartyParticipant = {
          userId,
          username: userEmail,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: "active",
        };

        const updatedParticipants = [
          ...(party.participants || []),
          newParticipant,
        ];

        const { data: updatedParty, error: updateError } = await supabase
          .from("watch_parties")
          .update({
            participants: updatedParticipants,
            updated_at: new Date().toISOString(),
          })
          .eq("id", partyId)
          .select("*")
          .single();

        if (updateError) throw updateError;

        // Add system message about joining
        await this.addSystemMessage(`${userEmail} joined the watch party`);

        this.currentParty = updatedParty;
        this.setupRealtimeSubscription();
        return updatedParty;
      }
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "joinWatchParty",
        additionalInfo: { partyId }
      });
      throw error;
    }
  }

  async updatePlaybackState(
    isPlaying: boolean,
    currentTime: number,
  ): Promise<void> {
    if (!this.currentParty) {
      throw new Error("No active watch party");
    }

    try {
      const { error } = await supabase
        .from("watch_parties")
        .update({
          is_playing: isPlaying,
          current_time: currentTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "updatePlaybackState",
        additionalInfo: { isPlaying, currentTime }
      });
    }
  }

  async sendChatMessage(content: string): Promise<void> {
    if (!this.currentParty) {
      throw new Error("No active watch party");
    }

    try {
      const userId = await this.getCurrentUserId();
      const userEmail = await this.getCurrentUserEmail();

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        username: userEmail,
        content,
        timestamp: new Date().toISOString(),
        type: "message",
      };

      const currentMessages = this.currentParty.chatMessages || [];
      const updatedMessages = [...currentMessages, message].slice(
        -CHAT_HISTORY_LIMIT,
      );

      const { error } = await supabase
        .from("watch_parties")
        .update({
          chat_messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "sendChatMessage",
        additionalInfo: { content }
      });
    }
  }

  private async addSystemMessage(content: string): Promise<void> {
    if (!this.currentParty) {
      return;
    }

    try {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId: "system",
        username: "System",
        content,
        timestamp: new Date().toISOString(),
        type: "system",
      };

      const currentMessages = this.currentParty.chatMessages || [];
      const updatedMessages = [...currentMessages, message].slice(
        -CHAT_HISTORY_LIMIT,
      );

      const { error } = await supabase
        .from("watch_parties")
        .update({
          chat_messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "addSystemMessage",
        additionalInfo: { content }
      });
    }
  }

  async leaveWatchParty(): Promise<void> {
    if (!this.currentParty) {
      return;
    }

    try {
      const userId = await this.getCurrentUserId();
      const userEmail = await this.getCurrentUserEmail();

      // Update participant status
      const updatedParticipants = this.currentParty.participants.map((p) =>
        p.userId === userId
          ? { ...p, status: "left", lastSeen: new Date().toISOString() }
          : p,
      );

      const { error } = await supabase
        .from("watch_parties")
        .update({
          participants: updatedParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.currentParty.id);

      if (error) throw error;

      // Add system message about leaving
      await this.addSystemMessage(`${userEmail} left the watch party`);

      this.cleanup();
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "leaveWatchParty"
      });
      this.cleanup();
    }
  }

  async inviteToWatchParty(partyId: string, friendId: string): Promise<void> {
    if (!this.currentParty) {
      throw new Error("No active watch party");
    }

    try {
      const userId = await this.getCurrentUserId();

      // Send notification to the friend
      await this.notificationService.sendNotification(
        friendId,
        "Watch Party Invitation",
        "You have been invited to a watch party",
        { type: "watch_party_invite", partyId, senderId: userId }
      );

      // Add system message about invitation
      await this.addSystemMessage(`Invitation sent to a friend`);
    } catch (error) {
      if (error instanceof Error) {
        await this.errorHandler.handleError(error, {
          componentName: "WatchPartyService",
          action: "inviteToWatchParty",
          additionalInfo: { partyId, friendId }
        });
      }
      throw error;
    }
  }

  subscribeToUpdates(callback: (party: WatchParty) => void): () => void {
    this.stateUpdateCallbacks.push(callback);

    // If we already have party data, call the callback immediately
    if (this.currentParty) {
      callback(this.currentParty);
    }

    // Return unsubscribe function
    return () => {
      this.stateUpdateCallbacks = this.stateUpdateCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private setupRealtimeSubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!this.currentParty) {
      throw new SubscriptionError(
        "No active watch party to subscribe to",
        "watchParty",
        "subscribe"
      );
    }

    try {
      this.subscription = supabase
        .channel(`watch_party_${this.currentParty.id}`)
        .on("presence", { event: "sync" }, () => {
          void this.syncState();
        })
        .on(
          "presence", 
          { event: "join" }, 
          ({ newPresences }: { newPresences: PresencePayload[] }) => {
            void this.handlePresenceJoin(this.mapPresenceToUsers(newPresences));
          }
        )
        .on(
          "presence", 
          { event: "leave" }, 
          ({ leftPresences }: { leftPresences: PresencePayload[] }) => {
            void this.handlePresenceLeave(this.mapPresenceToUsers(leftPresences));
          }
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            this.reconnectAttempts = 0;
            await this.syncState();
          } else if (status === "CLOSED") {
            await this.handleSubscriptionClosed();
          } else if (status === "CHANNEL_ERROR") {
            await this.handleSubscriptionError();
          }
        });
    } catch (error) {
      throw new SubscriptionError(
        "Failed to setup realtime subscription",
        "watchParty",
        "subscribe"
      );
    }
  }

  private mapPresenceToUsers(presences: PresencePayload[]): PresenceUser[] {
    return presences.map(presence => ({
      username: presence.username || "Unknown User",
      userId: presence.user_id || "",
      avatarUrl: presence.avatar_url
    }));
  }

  private async handleSubscriptionClosed(): Promise<void> {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      this.setupRealtimeSubscription();
    } else {
      await this.errorHandler.handleError(
        new SubscriptionError(
          "Watch party subscription closed after max reconnection attempts",
          "watchParty",
          "subscribe"
        ),
        {
          componentName: "WatchPartyService",
          action: "handleSubscriptionClosed",
          severity: "error"
        }
      );
    }
  }

  private async handleSubscriptionError(): Promise<void> {
    await this.errorHandler.handleError(
      new SubscriptionError(
        "Watch party subscription error",
        "watchParty",
        "subscribe"
      ),
      {
        componentName: "WatchPartyService",
        action: "handleSubscriptionError",
        severity: "error"
      }
    );
  }

  private async handlePresenceJoin(newPresences: PresenceUser[]): Promise<void> {
    try {
      if (!this.currentParty) return;

      const systemMessage = `${newPresences[0]?.username || "A user"} joined the watch party`;
      await this.addSystemMessage(systemMessage);
      
      await this.syncState();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: "WatchPartyService",
          action: "handlePresenceJoin",
          additionalInfo: { newPresences }
        }
      );
    }
  }

  private async handlePresenceLeave(leftPresences: PresenceUser[]): Promise<void> {
    try {
      if (!this.currentParty) return;

      const systemMessage = `${leftPresences[0]?.username || "A user"} left the watch party`;
      await this.addSystemMessage(systemMessage);
      
      await this.syncState();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: "WatchPartyService",
          action: "handlePresenceLeave",
          additionalInfo: { leftPresences }
        }
      );
    }
  }

  private async syncState(): Promise<void> {
    if (!this.currentParty) return;

    try {
      const { data: party, error } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", this.currentParty.id)
        .single();

      if (error) throw error;

      // Update current user's last seen timestamp
      if (party) {
        const userId = await this.getCurrentUserId();
        const updatedParticipants = party.participants.map((participant: WatchPartyParticipant) =>
          participant.userId === userId
            ? { ...participant, lastSeen: new Date().toISOString() }
            : participant,
        );

        await supabase
          .from("watch_parties")
          .update({
            participants: updatedParticipants,
          })
          .eq("id", this.currentParty.id);
      }

      this.currentParty = party;
      await this.emitStateChange();
    } catch (error) {
      await this.handleSyncError(error);
    }
  }

  private async handleSyncError(error: Error | unknown): Promise<void> {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.cleanup();
      await this.errorHandler.handleError(
        new Error("Failed to sync watch party state after multiple attempts"),
        {
          componentName: "WatchPartyService",
          action: "handleSyncError",
          severity: "error"
        }
      );
    }
  }

  private cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentParty = null;
    this.reconnectAttempts = 0;
    this.stateUpdateCallbacks = [];
  }

  private async emitStateChange(): Promise<void> {
    if (!this.currentParty) return;

    for (const callback of this.stateUpdateCallbacks) {
      try {
        await callback(this.currentParty!);
      } catch (error) {
        await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
          componentName: "WatchPartyService",
          action: "emitStateChange"
        });
      }
    }
  }

  private handleError(error: any): WatchPartyError {
    return {
      code: error.code || "UNKNOWN_ERROR",
      message: error.message || "An unknown error occurred",
      details: error.details,
    };
  }

  private async handleParticipantUpdate(participant: WatchPartyParticipant): Promise<void> {
    try {
      if (!this.currentParty) return;

      const updateParams: ParticipantUpdateParams = {
        status: participant.status,
        last_seen: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("watch_party_participants")
        .update(updateParams)
        .eq("party_id", this.currentParty.id)
        .eq("user_id", participant.userId)
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to update participant status",
          "update",
          "watch_party_participants",
          error
        );
      }

      await this.syncState();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: "WatchPartyService",
          action: "handleParticipantUpdate",
          additionalInfo: { participant }
        }
      );
    }
  }

  private async handlePlaybackUpdate(isPlaying: boolean, currentTime: number): Promise<void> {
    try {
      if (!this.currentParty) return;

      const updateParams: PlaybackUpdateParams = {
        is_playing: isPlaying,
        current_time: currentTime,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("watch_parties")
        .update(updateParams)
        .eq("id", this.currentParty.id)
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to update playback state",
          "update",
          "watch_parties",
          error
        );
      }

      await this.syncState();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: "WatchPartyService",
          action: "handlePlaybackUpdate",
          additionalInfo: { isPlaying, currentTime }
        }
      );
    }
  }

  private async handleStateUpdate(state: Partial<WatchPartyState>): Promise<void> {
    try {
      if (!this.currentParty) return;

      const { data, error } = await supabase
        .from("watch_parties")
        .update(state)
        .eq("id", this.currentParty.id)
        .single();

      if (error) {
        throw new DatabaseError(
          "Failed to update watch party state",
          "update",
          "watch_parties",
          error
        );
      }

      await this.syncState();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: "WatchPartyService",
          action: "handleStateUpdate",
          additionalInfo: { state }
        }
      );
    }
  }

  async setParticipantMood(partyId: string, mood: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    try {
      const { error } = await supabase
        .from("watch_party_participants")
        .update({ mood })
        .eq("party_id", partyId)
        .eq("user_id", user.id);
      if (error) throw error;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "setParticipantMood",
        additionalInfo: { partyId, mood }
      });
      throw error;
    }
  }

  async getParticipantMoods(partyId: string): Promise<{ userId: string; mood: string }[]> {
    try {
      const { data, error } = await supabase
        .from("watch_party_participants")
        .select("user_id, mood")
        .eq("party_id", partyId);
      if (error) throw error;
      return (data || []).map((row: any) => ({ userId: row.user_id, mood: row.mood }));
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "WatchPartyService",
        action: "getParticipantMoods",
        additionalInfo: { partyId }
      });
      throw error;
    }
  }
}

// Export a singleton instance
const watchPartyService = WatchPartyServiceImpl.getInstance();
export default watchPartyService;
