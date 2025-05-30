import { useAuth } from "@contexts/auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { AuthStackNavigationProp } from "@types/navigation";
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";

export const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigation = useNavigation<AuthStackNavigationProp>();

  const validateForm = () => {
    if (!email) {
      setError("Please enter your email");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
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
        <Text style={styles.title}>Reset Password</Text>

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

        {error && (
          <HelperText type="error" visible={!!error} testID="error-text">
            {error}
          </HelperText>
        )}

        {success && (
          <HelperText type="info" visible={!!success} testID="success-text">
            Password reset email sent. Please check your inbox.
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
          style={styles.button}
          testID="reset-button"
        >
          Send Reset Link
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
          style={styles.button}
          testID="login-button"
        >
          Back to Login
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
