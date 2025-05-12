import { ErrorHandler } from "../utils/errorHandler";
import { CacheError, DatabaseError } from "@errors/errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { ColorSchemeName, useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemePreferences {
  mode: ThemeMode;
  useSystemTheme: boolean;
  lastUpdated: string;
}

class ThemeService {
  private readonly THEME_KEY = "theme_preferences";
  private currentTheme: ThemeMode = "system";
  private listeners: ((theme: ThemeMode) => void)[] = [];
  private errorHandler = ErrorHandler.getInstance();

  constructor() {
    this.loadSavedPreferences();
  }

  private async loadSavedPreferences(): Promise<void> {
    try {
      const savedPrefs = await AsyncStorage.getItem(this.THEME_KEY);
      if (savedPrefs) {
        const prefs: ThemePreferences = JSON.parse(savedPrefs);
        this.currentTheme = prefs.mode;
        this.notifyListeners();
      }
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to load theme preferences",
          this.THEME_KEY,
          "read"
        ),
        {
          componentName: "ThemeService",
          action: "loadSavedPreferences"
        }
      );
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  async getThemePreferences(): Promise<ThemePreferences> {
    try {
      if (!this.currentTheme) {
        await this.loadSavedPreferences();
      }
      return (
        this.currentTheme || {
          mode: "system",
          useSystemTheme: true,
          lastUpdated: new Date().toISOString(),
        }
      );
    } catch (error) {
      await this.errorHandler.handleError(
        new CacheError(
          "Failed to get theme preferences",
          this.THEME_KEY,
          "read"
        ),
        {
          componentName: "ThemeService",
          action: "getThemePreferences"
        }
      );
      return {
        mode: "system",
        useSystemTheme: true,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async setTheme(mode: ThemeMode): Promise<void> {
    try {
      const prefs: ThemePreferences = {
        mode,
        useSystemTheme: mode === "system",
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.THEME_KEY, JSON.stringify(prefs));
      this.currentTheme = mode;
      this.notifyListeners();

      // Update user preferences in database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ theme_preferences: prefs })
          .eq("id", user.id);

        if (error) {
          throw new DatabaseError(
            "Failed to update theme preferences in database",
            "update",
            "profiles",
            error
          );
        }
      }
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to set theme"),
        {
          componentName: "ThemeService",
          action: "setTheme",
          additionalInfo: { mode }
        }
      );
      throw error;
    }
  }

  getCurrentTheme(): ThemeMode {
    return this.currentTheme;
  }

  addThemeChangeListener(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  isDarkMode(): boolean {
    if (this.currentTheme === "system") {
      return useColorScheme() === "dark";
    }
    return this.currentTheme === "dark";
  }

  async syncWithSystem(): Promise<void> {
    const systemTheme = useColorScheme();
    await this.setTheme(systemTheme === "dark" ? "dark" : "light");
  }

  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.THEME_KEY);
      this.currentTheme = "system";
      this.notifyListeners();
    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error("Failed to clear theme preferences"),
        {
          componentName: "ThemeService",
          action: "clearPreferences"
        }
      );
      throw error;
    }
  }
}

export const themeService = new ThemeService();
