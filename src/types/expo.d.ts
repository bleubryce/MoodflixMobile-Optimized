declare module 'expo-secure-store' {
  export async function getItemAsync(key: string): Promise<string | null>;
  export async function setItemAsync(key: string, value: string): Promise<void>;
  export async function deleteItemAsync(key: string): Promise<void>;
}

declare module 'expo-device' {
  export const isDevice: boolean;
  export const brand: string;
  export const manufacturer: string;
  export const modelName: string;
  export const deviceYearClass: number;
  export const totalMemory: number;
  export const supportedCpuArchitectures: string[] | null;
  export const osName: string;
  export const osVersion: string;
  export const platformApiLevel: number | null;
  export const deviceName: string;
  export const modelId: string | null;
  export const designName: string | null;
  export const productName: string | null;
  export const deviceType: number;
  export const osBuildId: string | null;
  export const osInternalBuildId: string | null;
  export const osBuildFingerprint: string | null;
}

declare module 'expo-local-authentication' {
  export enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2,
  }

  export interface LocalAuthenticationResult {
    success: boolean;
    error?: string;
  }

  export async function hasHardwareAsync(): Promise<boolean>;
  export async function isEnrolledAsync(): Promise<boolean>;
  export async function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
  export async function authenticateAsync(options?: {
    promptMessage?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
    cancelLabel?: string;
  }): Promise<LocalAuthenticationResult>;
}

declare module 'expo-av' {
  export interface AVPlaybackStatus {
    isLoaded: boolean;
    isPlaying: boolean;
    isBuffering: boolean;
    didJustFinish: boolean;
    positionMillis: number;
    durationMillis: number;
    rate: number;
    shouldCorrectPitch: boolean;
    volume: number;
    isMuted: boolean;
    isLooping: boolean;
    didJustFinish: boolean;
    error?: string;
  }

  export class Video extends React.Component<{
    source: { uri: string } | number;
    style?: any;
    resizeMode?: 'contain' | 'cover' | 'stretch';
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onLoad?: (status: AVPlaybackStatus) => void;
    onError?: (error: string) => void;
    onReadyForDisplay?: () => void;
    onFullscreenUpdate?: (status: { fullscreenUpdate: number }) => void;
    useNativeControls?: boolean;
    shouldPlay?: boolean;
    isLooping?: boolean;
    rate?: number;
    volume?: number;
    isMuted?: boolean;
    progressUpdateIntervalMillis?: number;
    positionMillis?: number;
    posterSource?: { uri: string } | number;
    posterStyle?: any;
    usePoster?: boolean;
    ref?: React.RefObject<Video>;
  }> {
    playAsync: () => Promise<void>;
    pauseAsync: () => Promise<void>;
    setPositionAsync: (positionMillis: number) => Promise<void>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean) => Promise<void>;
    setVolumeAsync: (volume: number) => Promise<void>;
    setIsMutedAsync: (isMuted: boolean) => Promise<void>;
    setIsLoopingAsync: (isLooping: boolean) => Promise<void>;
    setProgressUpdateIntervalAsync: (intervalMillis: number) => Promise<void>;
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    replayAsync: () => Promise<void>;
    stopAsync: () => Promise<void>;
    unloadAsync: () => Promise<void>;
    presentFullscreenPlayer: () => Promise<void>;
    dismissFullscreenPlayer: () => Promise<void>;
  }
} 