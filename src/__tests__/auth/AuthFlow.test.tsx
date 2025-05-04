import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import { AuthProvider } from "../../contexts/auth/AuthContext";
import { supabase } from "../../lib/supabase";
import { ForgotPasswordScreen } from "../../screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "../../screens/auth/LoginScreen";
import { RegisterScreen } from "../../screens/auth/RegisterScreen";

// Mock Supabase client
jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

const Stack = createStackNavigator();

const TestNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <AuthProvider>{component}</AuthProvider>
    </NavigationContainer>,
  );
};

describe("Authentication Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Login Screen", () => {
    it("should show validation errors for empty fields", async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      fireEvent.press(getByTestId("login-button"));

      await waitFor(() => {
        expect(getByText("Please fill in all fields")).toBeTruthy();
      });
    });

    it("should show validation error for invalid email", async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      fireEvent.changeText(getByTestId("email-input"), "invalid-email");
      fireEvent.changeText(getByTestId("password-input"), "password123");
      fireEvent.press(getByTestId("login-button"));

      await waitFor(() => {
        expect(getByText("Please enter a valid email address")).toBeTruthy();
      });
    });

    it("should call signIn with correct credentials", async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        mockSignIn,
      );

      const { getByTestId } = renderWithNavigation(<TestNavigator />);

      fireEvent.changeText(getByTestId("email-input"), "test@example.com");
      fireEvent.changeText(getByTestId("password-input"), "password123");
      fireEvent.press(getByTestId("login-button"));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should show error message on failed login", async () => {
      const mockSignIn = jest
        .fn()
        .mockResolvedValue({ error: new Error("Invalid credentials") });
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        mockSignIn,
      );

      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      fireEvent.changeText(getByTestId("email-input"), "test@example.com");
      fireEvent.changeText(getByTestId("password-input"), "wrongpassword");
      fireEvent.press(getByTestId("login-button"));

      await waitFor(() => {
        expect(getByText("Invalid credentials")).toBeTruthy();
      });
    });
  });

  describe("Register Screen", () => {
    it("should show validation errors for empty fields", async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      // Navigate to Register screen
      fireEvent.press(getByTestId("register-button"));

      // Try to register without filling fields
      fireEvent.press(getByTestId("register-button"));

      await waitFor(() => {
        expect(getByText("Please fill in all fields")).toBeTruthy();
      });
    });

    it("should show validation error for password mismatch", async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      // Navigate to Register screen
      fireEvent.press(getByTestId("register-button"));

      fireEvent.changeText(getByTestId("name-input"), "Test User");
      fireEvent.changeText(getByTestId("email-input"), "test@example.com");
      fireEvent.changeText(getByTestId("password-input"), "password123");
      fireEvent.changeText(
        getByTestId("confirm-password-input"),
        "password456",
      );
      fireEvent.press(getByTestId("register-button"));

      await waitFor(() => {
        expect(getByText("Passwords do not match")).toBeTruthy();
      });
    });

    it("should call signUp with correct data", async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        data: { user: { id: "test-id" } },
        error: null,
      });
      (supabase.auth.signUp as jest.Mock).mockImplementation(mockSignUp);

      const { getByTestId } = renderWithNavigation(<TestNavigator />);

      // Navigate to Register screen
      fireEvent.press(getByTestId("register-button"));

      fireEvent.changeText(getByTestId("name-input"), "Test User");
      fireEvent.changeText(getByTestId("email-input"), "test@example.com");
      fireEvent.changeText(getByTestId("password-input"), "password123");
      fireEvent.changeText(
        getByTestId("confirm-password-input"),
        "password123",
      );
      fireEvent.press(getByTestId("register-button"));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          options: {
            data: {
              username: "Test User",
            },
          },
        });
      });
    });
  });

  describe("Forgot Password Screen", () => {
    it("should show validation error for empty email", async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      // Navigate to Forgot Password screen
      fireEvent.press(getByTestId("forgot-password-button"));

      // Try to reset without email
      fireEvent.press(getByTestId("reset-button"));

      await waitFor(() => {
        expect(getByText("Please enter your email")).toBeTruthy();
      });
    });

    it("should show success message on password reset", async () => {
      const mockResetPassword = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockImplementation(
        mockResetPassword,
      );

      const { getByTestId, getByText } = renderWithNavigation(
        <TestNavigator />,
      );

      // Navigate to Forgot Password screen
      fireEvent.press(getByTestId("forgot-password-button"));

      fireEvent.changeText(getByTestId("email-input"), "test@example.com");
      fireEvent.press(getByTestId("reset-button"));

      await waitFor(() => {
        expect(
          getByText("Password reset email sent. Please check your inbox."),
        ).toBeTruthy();
      });
    });
  });
});
