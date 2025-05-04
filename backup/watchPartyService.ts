import { supabase } from '../config/supabase';
import { WatchParty, WatchPartyState, WatchPartyError, ChatMessage, WatchPartyParticipant } from '../types/watch-party';
import { TMDBMovie } from '../types/tmdb';
import { getMovieDetails } from './movieService';
import { NotificationService } from './notificationService';
import { OfflineService } from './offlineService';

const MAX_PARTICIPANTS = 20;
const CHAT_HISTORY_LIMIT = 100;
const SYNC_INTERVAL = 1000; // 1 second

export class WatchPartyService {
  private static instance: WatchPartyService;
  private currentParty: WatchParty | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscription: any = null;

  private constructor() {}

  static getInstance(): WatchPartyService {
    if (!WatchPartyService.instance) {
      WatchPartyService.instance = new WatchPartyService();
    }
    return WatchPartyService.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('No active session');
    }
    return session.user.id;
  }

  private async getCurrentUserEmail(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || !user.email) {
      throw new Error('User email not found');
    }
    return user.email;
  }

  async createWatchParty(movieId: number): Promise<WatchParty> {
    try {
      const { data: movie } = await getMovieDetails(movieId);
      if (!movie) {
        throw new Error('Movie not found');
      }

      const userId = await this.getCurrentUserId();

      const { data: party, error } = await supabase
        .from('watch_parties')
        .insert({
          movie_id: movieId,
          movie: movie,
          host_id: userId,
          status: 'pending',
          current_time: 0,
          is_playing: false,
        })
        .single();

      if (error) throw error;

      this.currentParty = party;
      this.setupRealtimeSubscription();
      return party;
    } catch (error) {
      console.error('Error creating watch party:', error);
      throw this.handleError(error);
    }
  }

  async joinWatchParty(partyId: string): Promise<WatchParty> {
    try {
      const { data: party, error } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('id', partyId)
        .single();

      if (error) throw error;
      if (!party) throw new Error('Watch party not found');

      if (party.participants.length >= MAX_PARTICIPANTS) {
        throw new Error('Watch party is full');
      }

      const userId = await this.getCurrentUserId();
      const userEmail = await this.getCurrentUserEmail();

      const participant: WatchPartyParticipant = {
        userId,
        username: userEmail,
        joinedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: 'active',
      };

      const { data: updatedParty, error: updateError } = await supabase
        .from('watch_parties')
        .update({
          participants: [...party.participants, participant],
        })
        .eq('id', partyId)
        .single();

      if (updateError) throw updateError;

      this.currentParty = updatedParty;
      this.setupRealtimeSubscription();
      return updatedParty;
    } catch (error) {
      console.error('Error joining watch party:', error);
      throw this.handleError(error);
    }
  }

  async updatePlaybackState(isPlaying: boolean, currentTime: number): Promise<void> {
    if (!this.currentParty) {
      throw new Error('No active watch party');
    }

    try {
      const { error } = await supabase
        .from('watch_parties')
        .update({
          is_playing: isPlaying,
          current_time: currentTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating playback state:', error);
      throw this.handleError(error);
    }
  }

  async sendChatMessage(content: string): Promise<void> {
    if (!this.currentParty) {
      throw new Error('No active watch party');
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
        type: 'message',
      };

      const { error } = await supabase
        .from('watch_parties')
        .update({
          chat_messages: [...this.currentParty.chatMessages, message].slice(-CHAT_HISTORY_LIMIT),
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw this.handleError(error);
    }
  }

  async leaveWatchParty(): Promise<void> {
    if (!this.currentParty) {
      throw new Error('No active watch party');
    }

    try {
      const userId = await this.getCurrentUserId();
      const updatedParticipants = this.currentParty.participants.map(p =>
        p.userId === userId
          ? { ...p, status: 'left', lastSeen: new Date().toISOString() }
          : p
      );

      const { error } = await supabase
        .from('watch_parties')
        .update({
          participants: updatedParticipants,
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;

      this.cleanup();
    } catch (error) {
      console.error('Error leaving watch party:', error);
      throw this.handleError(error);
    }
  }

  private setupRealtimeSubscription(): void {
    if (!this.currentParty) return;

    this.subscription = supabase
      .channel(`watch_party_${this.currentParty.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'watch_parties',
          filter: `id=eq.${this.currentParty.id}`,
        },
        (payload) => {
          this.currentParty = payload.new as WatchParty;
          this.emitStateChange();
        }
      )
      .subscribe();

    this.syncInterval = setInterval(() => {
      this.syncState();
    }, SYNC_INTERVAL);
  }

  private async syncState(): Promise<void> {
    if (!this.currentParty) return;

    try {
      const { data: party, error } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('id', this.currentParty.id)
        .single();

      if (error) throw error;
      this.currentParty = party;
      this.emitStateChange();
    } catch (error) {
      console.error('Error syncing state:', error);
      this.handleSyncError(error);
    }
  }

  private handleSyncError(error: any): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.cleanup();
      throw new Error('Failed to sync watch party state');
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
  }

  private emitStateChange(): void {
    // Implement event emitter for state changes
    // This will be used by the UI components
  }

  private handleError(error: any): WatchPartyError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details,
    };
  }
} 