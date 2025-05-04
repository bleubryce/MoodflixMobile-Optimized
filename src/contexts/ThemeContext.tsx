import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme } from "@react-navigation/native";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

type ThemeMode = "light" | "dark" | "system";

interface CustomTheme extends Theme {
  colors: Theme["colors"] & {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    text: string;
    disabled: string;
    placeholder: string;
    backdrop: string;
    onSurface: string;
    onBackground: string;
    elevation: {
      level0: string;
      level1: string;
      level2: string;
      level3: string;
      level4: string;
      level5: string;
    };
    card: string;
    border: string;
    notification: string;
  };
}

interface ThemeContextType {
  theme: CustomTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_MODE_KEY = "@theme_mode";

const customLightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    card: "#ffffff",
    border: "#d8d8d8",
    notification: "#ff3b30",
    primary: "#6200ee",
    secondary: "#03dac6",
    background: "#f6f6f6",
    surface: "#ffffff",
    error: "#b00020",
    text: "#000000",
    disabled: "#000000",
    placeholder: "#000000",
    backdrop: "rgba(0, 0, 0, 0.5)",
    onSurface: "#000000",
    onBackground: "#000000",
    elevation: {
      level0: "transparent",
      level1: "#fff",
      level2: "#f5f5f5",
      level3: "#e0e0e0",
      level4: "#d6d6d6",
      level5: "#cccccc",
    },
  },
};

const customDarkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    card: "#1e1e1e",
    border: "#272727",
    notification: "#ff453a",
    primary: "#bb86fc",
    secondary: "#03dac6",
    background: "#121212",
    surface: "#1e1e1e",
    error: "#cf6679",
    text: "#ffffff",
    disabled: "#ffffff",
    placeholder: "#ffffff",
    backdrop: "rgba(0, 0, 0, 0.5)",
    onSurface: "#ffffff",
    onBackground: "#ffffff",
    elevation: {
      level0: "#121212",
      level1: "#1e1e1e",
      level2: "#222222",
      level3: "#242424",
      level4: "#272727",
      level5: "#2c2c2c",
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (savedMode) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme mode:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme mode:", error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    await setThemeMode(newMode);
  };

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const theme = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
