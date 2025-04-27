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
  private stateUpdateCallbacks: ((party: WatchParty) => void)[] = [];

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
      const userEmail = await this.getCurrentUserEmail();

      const participant: WatchPartyParticipant = {
        userId,
        username: userEmail,
        joinedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: 'active',
      };

      const { data: party, error } = await supabase
        .from('watch_parties')
        .insert({
          movie_id: movieId,
          movie: movie,
          host_id: userId,
          status: 'active',
          current_time: 0,
          is_playing: false,
          participants: [participant],
          chat_messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
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

      if (party.participants && party.participants.length >= MAX_PARTICIPANTS) {
        throw new Error('Watch party is full');
      }

      const userId = await this.getCurrentUserId();
      const userEmail = await this.getCurrentUserEmail();

      // Check if user is already a participant
      const existingParticipant = party.participants?.find(p => p.userId === userId);
      
      if (existingParticipant) {
        // Update existing participant
        const updatedParticipants = party.participants.map(p => 
          p.userId === userId 
            ? { ...p, status: 'active', lastSeen: new Date().toISOString() } 
            : p
        );

        const { data: updatedParty, error: updateError } = await supabase
          .from('watch_parties')
          .update({
            participants: updatedParticipants,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partyId)
          .select('*')
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
          status: 'active',
        };

        const updatedParticipants = [...(party.participants || []), newParticipant];

        const { data: updatedParty, error: updateError } = await supabase
          .from('watch_parties')
          .update({
            participants: updatedParticipants,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partyId)
          .select('*')
          .single();

        if (updateError) throw updateError;

        // Add system message about joining
        await this.addSystemMessage(`${userEmail} joined the watch party`);

        this.currentParty = updatedParty;
        this.setupRealtimeSubscription();
        return updatedParty;
      }
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

      const currentMessages = this.currentParty.chatMessages || [];
      const updatedMessages = [...currentMessages, message].slice(-CHAT_HISTORY_LIMIT);

      const { error } = await supabase
        .from('watch_parties')
        .update({
          chat_messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw this.handleError(error);
    }
  }

  private async addSystemMessage(content: string): Promise<void> {
    if (!this.currentParty) {
      return;
    }

    try {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId: 'system',
        username: 'System',
        content,
        timestamp: new Date().toISOString(),
        type: 'system',
      };

      const currentMessages = this.currentParty.chatMessages || [];
      const updatedMessages = [...currentMessages, message].slice(-CHAT_HISTORY_LIMIT);

      const { error } = await supabase
        .from('watch_parties')
        .update({
          chat_messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding system message:', error);
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
      const updatedParticipants = this.currentParty.participants.map(p =>
        p.userId === userId
          ? { ...p, status: 'left', lastSeen: new Date().toISOString() }
          : p
      );

      const { error } = await supabase
        .from('watch_parties')
        .update({
          participants: updatedParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentParty.id);

      if (error) throw error;

      // Add system message about leaving
      await this.addSystemMessage(`${userEmail} left the watch party`);

      this.cleanup();
    } catch (error) {
      console.error('Error leaving watch party:', error);
      this.cleanup();
    }
  }

  async inviteToWatchParty(partyId: string, friendId: string): Promise<void> {
    if (!this.currentParty) {
      throw new Error('No active watch party');
    }

    try {
      const userId = await this.getCurrentUserId();
      
      // Send notification to the friend
      await NotificationService.sendNotification(
        friendId,
        'Watch Party Invitation',
        'You have been invited to a watch party',
        { type: 'watch_party_invite', partyId, senderId: userId }
      );

      // Add system message about invitation
      await this.addSystemMessage(`Invitation sent to a friend`);
    } catch (error) {
      console.error('Error inviting to watch party:', error);
      throw this.handleError(error);
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
      this.stateUpdateCallbacks = this.stateUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  private setupRealtimeSubscription(): void {
    if (!this.currentParty) return;

    // Clean up existing subscription if any
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

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
      
      // Update current user's last seen timestamp
      if (party) {
        const userId = await this.getCurrentUserId();
        const updatedParticipants = party.participants.map(p =>
          p.userId === userId
            ? { ...p, lastSeen: new Date().toISOString() }
            : p
        );

        await supabase
          .from('watch_parties')
          .update({
            participants: updatedParticipants,
          })
          .eq('id', this.currentParty.id);
      }
      
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
      console.error('Failed to sync watch party state after multiple attempts');
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

  private emitStateChange(): void {
    if (!this.currentParty) return;
    
    this.stateUpdateCallbacks.forEach(callback => {
      try {
        callback(this.currentParty!);
      } catch (error) {
        console.error('Error in watch party state update callback:', error);
      }
    });
  }

  private handleError(error: any): WatchPartyError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details,
    };
  }
}
