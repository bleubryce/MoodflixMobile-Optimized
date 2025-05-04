import { useThemeContext } from "@contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Switch } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, isSystemTheme, setSystemTheme, theme } =
    useThemeContext();

  // Animation values
  const rotation = useSharedValue(isDarkMode ? 180 : 0);
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  const handleThemeToggle = async () => {
    // Animate icon
    rotation.value = withSpring(isDarkMode ? 0 : 180, {
      damping: 10,
      stiffness: 100,
    });
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });

    await toggleTheme();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleThemeToggle}
        style={[
          styles.themeButton,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialCommunityIcons
            name={isDarkMode ? "weather-night" : "white-balance-sunny"}
            size={24}
            color={theme.colors.onSurface}
          />
        </Animated.View>
        <Text style={[styles.themeText, { color: theme.colors.onSurface }]}>
          {isDarkMode ? "Dark Mode" : "Light Mode"}
        </Text>
      </Pressable>

      <View style={styles.systemThemeContainer}>
        <Text
          style={[styles.systemThemeText, { color: theme.colors.onSurface }]}
        >
          Use System Theme
        </Text>
        <Switch
          value={isSystemTheme}
          onValueChange={setSystemTheme}
          color={theme.colors.primary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  themeText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  systemThemeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  systemThemeText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
