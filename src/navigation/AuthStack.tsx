import { createStackNavigator } from "@react-navigation/stack";
import { ForgotPasswordScreen } from "@screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "@screens/auth/LoginScreen";
import { RegisterScreen } from "@screens/auth/RegisterScreen";
import React from "react";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};
