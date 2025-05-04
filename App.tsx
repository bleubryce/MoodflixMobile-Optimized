import { AuthProvider } from "@contexts/AuthContext";
import { SocialProvider } from "@contexts/SocialContext";
import { ThemeProvider, useTheme } from "@contexts/ThemeContext";
import { RootNavigator } from "@navigation/RootNavigator";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

const ThemedApp = () => {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocialProvider>
            <ThemedApp />
          </SocialProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
