import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

const OFFLINE_MODE_KEY = "@offline_mode";
const AUTO_DOWNLOAD_KEY = "@auto_download";
const DOWNLOAD_QUALITY_KEY = "@download_quality";

export type DownloadQuality = "low" | "medium" | "high";

interface OfflineModeState {
  isEnabled: boolean;
  autoDownload: boolean;
  downloadQuality: DownloadQuality;
  isConnected: boolean | null;
}

interface OfflineModeActions {
  toggleOfflineMode: () => Promise<void>;
  toggleAutoDownload: () => Promise<void>;
  setDownloadQuality: (quality: DownloadQuality) => Promise<void>;
}

export const useOfflineMode = (): [OfflineModeState, OfflineModeActions] => {
  const [state, setState] = useState<OfflineModeState>({
    isEnabled: false,
    autoDownload: false,
    downloadQuality: "medium",
    isConnected: null,
  });

  useEffect(() => {
    loadSettings();
    setupNetworkListener();
  }, []);

  const loadSettings = async () => {
    try {
      const [isEnabled, autoDownload, quality] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_MODE_KEY),
        AsyncStorage.getItem(AUTO_DOWNLOAD_KEY),
        AsyncStorage.getItem(DOWNLOAD_QUALITY_KEY),
      ]);

      setState((prev) => ({
        ...prev,
        isEnabled: isEnabled === "true",
        autoDownload: autoDownload === "true",
        downloadQuality: (quality as DownloadQuality) || "medium",
      }));
    } catch (error) {
      console.error("Error loading offline mode settings:", error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setState((prev) => ({
        ...prev,
        isConnected: state.isConnected,
      }));
    });

    return () => {
      unsubscribe();
    };
  };

  const toggleOfflineMode = async () => {
    try {
      const newValue = !state.isEnabled;
      await AsyncStorage.setItem(OFFLINE_MODE_KEY, String(newValue));
      setState((prev) => ({
        ...prev,
        isEnabled: newValue,
      }));
    } catch (error) {
      console.error("Error toggling offline mode:", error);
    }
  };

  const toggleAutoDownload = async () => {
    try {
      const newValue = !state.autoDownload;
      await AsyncStorage.setItem(AUTO_DOWNLOAD_KEY, String(newValue));
      setState((prev) => ({
        ...prev,
        autoDownload: newValue,
      }));
    } catch (error) {
      console.error("Error toggling auto download:", error);
    }
  };

  const setDownloadQuality = async (quality: DownloadQuality) => {
    try {
      await AsyncStorage.setItem(DOWNLOAD_QUALITY_KEY, quality);
      setState((prev) => ({
        ...prev,
        downloadQuality: quality,
      }));
    } catch (error) {
      console.error("Error setting download quality:", error);
    }
  };

  return [
    state,
    {
      toggleOfflineMode,
      toggleAutoDownload,
      setDownloadQuality,
    },
  ];
};
