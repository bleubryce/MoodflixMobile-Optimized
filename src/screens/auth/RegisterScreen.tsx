import { useAuth } from "@contexts/auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { AuthStackNavigationProp } from "@types/navigation";
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";

export const RegisterScreen: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigation = useNavigation<AuthStackNavigationProp>();

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, name);
      navigation.navigate("Login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
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
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          disabled={loading}
          testID="name-input"
          autoCapitalize="words"
        />

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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          disabled={loading}
          testID="confirm-password-input"
        />

        {error && (
          <HelperText type="error" visible={!!error} testID="error-text">
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
          testID="register-button"
        >
          Create Account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
          style={styles.button}
          testID="login-button"
        >
          Already have an account? Sign in
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
