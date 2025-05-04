import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// Base colors that remain consistent across themes
const baseColors = {
  primary: "#6200EE",
  secondary: "#03DAC6",
  error: "#B00020",
  success: "#4CAF50",
  warning: "#FB8C00",
  info: "#2196F3",
};

// Light theme specific colors
const lightColors = {
  ...baseColors,
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceVariant: "#F5F5F5",
  onSurface: "#000000",
  onSurfaceVariant: "#1C1B1F",
  elevation: {
    level0: "transparent",
    level1: "#F5F5F5",
    level2: "#EEEEEE",
    level3: "#E0E0E0",
  },
};

// Dark theme specific colors
const darkColors = {
  ...baseColors,
  background: "#121212",
  surface: "#121212",
  surfaceVariant: "#1E1E1E",
  onSurface: "#FFFFFF",
  onSurfaceVariant: "#E6E1E5",
  elevation: {
    level0: "#121212",
    level1: "#1E1E1E",
    level2: "#222222",
    level3: "#242424",
  },
};

// Custom typography configuration
const typography = {
  fontFamily: "System",
  headlineLarge: {
    fontWeight: "600",
    fontSize: 32,
    lineHeight: 40,
  },
  headlineMedium: {
    fontWeight: "600",
    fontSize: 28,
    lineHeight: 36,
  },
  headlineSmall: {
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 32,
  },
  titleLarge: {
    fontWeight: "600",
    fontSize: 22,
    lineHeight: 28,
  },
  titleMedium: {
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
  },
  titleSmall: {
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
  },
};

// Create custom themes by extending MD3 themes
export const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  typography,
  animation: {
    scale: 1.0,
  },
};

export const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  typography,
  animation: {
    scale: 1.0,
  },
};

// Theme interface for TypeScript
export interface AppTheme {
  dark: boolean;
  mode?: "adaptive" | "exact";
  colors: typeof lightColors;
  typography: typeof typography;
  animation: {
    scale: number;
  };
}
