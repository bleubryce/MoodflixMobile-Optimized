import { WatchPartyService } from '../watchPartyService';
import { supabase } from '../../config/supabase';
import { getMovieDetails } from '../movieService';

jest.mock('../../config/supabase');
jest.mock('../movieService');

describe('WatchPartyService', () => {
  let service: WatchPartyService;

  beforeEach(() => {
    service = WatchPartyService.getInstance();
    jest.clearAllMocks();
  });

  describe('createWatchParty', () => {
    it('should create a watch party successfully', async () => {
      const mockMovie = { id: 1, title: 'Test Movie' };
      const mockParty = {
        id: 'party-1',
        movieId: 1,
        movie: mockMovie,
        hostId: 'user-1',
        status: 'pending',
        participants: [],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      };

      (getMovieDetails as jest.Mock).mockResolvedValue({ data: mockMovie });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockParty, error: null }),
        }),
      });

      const result = await service.createWatchParty(1);

      expect(result).toEqual(mockParty);
      expect(getMovieDetails).toHaveBeenCalledWith(1);
      expect(supabase.from).toHaveBeenCalledWith('watch_parties');
    });

    it('should handle errors when creating a watch party', async () => {
      (getMovieDetails as jest.Mock).mockResolvedValue({ data: null });

      await expect(service.createWatchParty(1)).rejects.toThrow('Movie not found');
    });
  });

  describe('joinWatchParty', () => {
    it('should join a watch party successfully', async () => {
      const mockParty = {
        id: 'party-1',
        movieId: 1,
        movie: { id: 1, title: 'Test Movie' },
        hostId: 'user-1',
        status: 'pending',
        participants: [],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockParty, error: null }),
        }),
        update: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockParty, error: null }),
        }),
      });

      const result = await service.joinWatchParty('party-1');

      expect(result).toEqual(mockParty);
      expect(supabase.from).toHaveBeenCalledWith('watch_parties');
    });

    it('should handle errors when joining a watch party', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('Party not found') }),
        }),
      });

      await expect(service.joinWatchParty('party-1')).rejects.toThrow();
    });
  });

  describe('updatePlaybackState', () => {
    it('should update playback state successfully', async () => {
      const mockParty = {
        id: 'party-1',
        movieId: 1,
        movie: { id: 1, title: 'Test Movie' },
        hostId: 'user-1',
        status: 'active',
        participants: [],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      };

      service['currentParty'] = mockParty;

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(service.updatePlaybackState(true, 1000)).resolves.not.toThrow();
    });

    it('should handle errors when updating playback state', async () => {
      service['currentParty'] = null;

      await expect(service.updatePlaybackState(true, 1000)).rejects.toThrow('No active watch party');
    });
  });

  describe('sendChatMessage', () => {
    it('should send a chat message successfully', async () => {
      const mockParty = {
        id: 'party-1',
        movieId: 1,
        movie: { id: 1, title: 'Test Movie' },
        hostId: 'user-1',
        status: 'active',
        participants: [],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      };

      service['currentParty'] = mockParty;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(service.sendChatMessage('Hello!')).resolves.not.toThrow();
    });

    it('should handle errors when sending a chat message', async () => {
      service['currentParty'] = null;

      await expect(service.sendChatMessage('Hello!')).rejects.toThrow('No active watch party');
    });
  });

  describe('leaveWatchParty', () => {
    it('should leave a watch party successfully', async () => {
      const mockParty = {
        id: 'party-1',
        movieId: 1,
        movie: { id: 1, title: 'Test Movie' },
        hostId: 'user-1',
        status: 'active',
        participants: [{ userId: 'user-1', status: 'active' }],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      };

      service['currentParty'] = mockParty;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(service.leaveWatchParty()).resolves.not.toThrow();
      expect(service['currentParty']).toBeNull();
    });

    it('should handle errors when leaving a watch party', async () => {
      service['currentParty'] = null;

      await expect(service.leaveWatchParty()).rejects.toThrow('No active watch party');
    });
  });
}); 