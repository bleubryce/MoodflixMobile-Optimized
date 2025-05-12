import { supabase } from '../lib/supabase';
import { MoodPlaylist } from '@types/playlist';
import { ErrorHandler } from '@utils/errorHandler';

export class PlaylistService {
  private static instance: PlaylistService;
  private errorHandler = ErrorHandler.getInstance();

  static getInstance() {
    if (!PlaylistService.instance) {
      PlaylistService.instance = new PlaylistService();
    }
    return PlaylistService.instance;
  }

  async getPlaylists(userId: string): Promise<MoodPlaylist[]> {
    try {
      const { data, error } = await supabase
        .from('mood_playlists')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as MoodPlaylist[];
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'PlaylistService',
        action: 'getPlaylists',
        additionalInfo: { userId },
      });
      throw error;
    }
  }

  async createPlaylist(playlist: Omit<MoodPlaylist, 'id' | 'createdAt' | 'updatedAt'>): Promise<MoodPlaylist> {
    try {
      const { data, error } = await supabase
        .from('mood_playlists')
        .insert([{ ...playlist }])
        .select('*')
        .single();
      if (error) throw error;
      return data as MoodPlaylist;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'PlaylistService',
        action: 'createPlaylist',
        additionalInfo: { playlist },
      });
      throw error;
    }
  }

  async updatePlaylist(id: string, updates: Partial<MoodPlaylist>): Promise<MoodPlaylist> {
    try {
      const { data, error } = await supabase
        .from('mood_playlists')
        .update({ ...updates })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as MoodPlaylist;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'PlaylistService',
        action: 'updatePlaylist',
        additionalInfo: { id, updates },
      });
      throw error;
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mood_playlists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'PlaylistService',
        action: 'deletePlaylist',
        additionalInfo: { id },
      });
      throw error;
    }
  }
}

export const playlistService = PlaylistService.getInstance(); 