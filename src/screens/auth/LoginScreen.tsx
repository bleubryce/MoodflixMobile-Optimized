import { useAuth } from "@contexts/auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { AuthStackNavigationProp } from "@types/navigation";
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigation = useNavigation<AuthStackNavigationProp>();

  const validateForm = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MoodFlix</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          disabled={loading}
          testID="email-input"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          disabled={loading}
          testID="password-input"
        />

        {error && (
          <HelperText type="error" visible={!!error} testID="error-text">
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          testID="login-button"
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
          style={styles.button}
          testID="register-button"
        >
          Create Account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("ForgotPassword")}
          disabled={loading}
          style={styles.button}
          testID="forgot-password-button"
        >
          Forgot Password?
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
