import { renderHook, act } from '@testing-library/react-hooks';
import { useOffline } from '../useOffline';
import { offlineService } from '../../services/offlineService';
import { useNetInfo } from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/offlineService');

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNetInfo as jest.Mock).mockReturnValue({ isConnected: true });
    (offlineService.getOfflineState as jest.Mock).mockResolvedValue({
      isConnected: true,
      lastSync: null,
      cacheSize: 0,
    });
  });

  it('should initialize with default state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOffline());
    
    await waitForNextUpdate();
    
    expect(result.current.isConnected).toBe(true);
    expect(result.current.lastSync).toBeNull();
    expect(result.current.cacheSize).toBe(0);
  });

  it('should update connection state when network changes', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOffline());
    
    await waitForNextUpdate();
    
    act(() => {
      (useNetInfo as jest.Mock).mockReturnValue({ isConnected: false });
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isConnected).toBe(false);
    expect(offlineService.updateOfflineState).toHaveBeenCalledWith({
      isConnected: false,
    });
  });

  it('should update last sync timestamp', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOffline());
    
    await waitForNextUpdate();
    
    const timestamp = new Date().toISOString();
    await act(async () => {
      await result.current.updateLastSync(timestamp);
    });
    
    expect(result.current.lastSync).toBe(timestamp);
    expect(offlineService.updateOfflineState).toHaveBeenCalledWith({
      lastSync: timestamp,
    });
  });

  it('should clear cache', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOffline());
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.clearCache();
    });
    
    expect(offlineService.clearCache).toHaveBeenCalled();
    expect(result.current.cacheSize).toBe(0);
    expect(result.current.lastSync).toBeNull();
  });
}); 