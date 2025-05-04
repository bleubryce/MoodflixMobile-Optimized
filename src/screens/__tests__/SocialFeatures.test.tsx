import { NavigationContainer } from "@react-navigation/native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import { AuthProvider } from "../contexts/AuthContext";
import { SocialProvider } from "../contexts/SocialContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import ActivityFeedScreen from "../screens/ActivityFeedScreen";
import FriendsScreen from "../screens/FriendsScreen";
import WatchPartyScreen from "../screens/WatchPartyScreen";

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route for WatchPartyScreen
const mockRoute = {
  params: {
    partyId: "test-party-id",
  },
};

// Mock services
jest.mock("../services/friendService", () => ({
  FriendService: {
    getInstance: () => ({
      getFriends: jest.fn().mockResolvedValue([
        {
          id: "1",
          userId: "user1",
          name: "Test User 1",
          status: "online",
          lastActive: new Date().toISOString(),
        },
      ]),
      getFriendRequests: jest.fn().mockResolvedValue([]),
      sendFriendRequest: jest.fn(),
      respondToFriendRequest: jest.fn(),
      removeFriend: jest.fn(),
      blockUser: jest.fn(),
      setupRealtimeSubscription: jest.fn(),
      cleanup: jest.fn(),
    }),
  },
}));

jest.mock("../services/activityService", () => ({
  ActivityService: {
    getInstance: () => ({
      getActivityFeed: jest.fn().mockResolvedValue([
        {
          id: "1",
          userId: "user1",
          username: "Test User 1",
          type: "watch",
          content: "Test Movie",
          resourceId: "movie1",
          resourceType: "movie",
          timestamp: new Date().toISOString(),
          isPrivate: false,
        },
      ]),
      createActivity: jest.fn(),
      setupRealtimeSubscription: jest.fn(),
      cleanup: jest.fn(),
    }),
  },
}));

jest.mock("../services/watchPartyService", () => ({
  WatchPartyService: {
    getInstance: () => ({
      joinWatchParty: jest.fn().mockResolvedValue({
        id: "test-party-id",
        movieId: 123,
        movie: {
          id: 123,
          title: "Test Movie",
          overview: "Test overview",
          backdrop_path: "test-path",
        },
        hostId: "host1",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: [
          {
            userId: "user1",
            username: "Test User 1",
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: "active",
          },
        ],
        currentTime: 0,
        isPlaying: false,
        chatMessages: [],
      }),
      updatePlaybackState: jest.fn(),
      sendChatMessage: jest.fn(),
      leaveWatchParty: jest.fn(),
      inviteToWatchParty: jest.fn(),
      subscribeToUpdates: jest.fn().mockReturnValue(() => {}),
    }),
  },
}));

// Mock expo-av
jest.mock("expo-av", () => ({
  Video: "Video",
  ResizeMode: {
    CONTAIN: "contain",
  },
}));

// Wrapper component for providing context
const TestWrapper = ({ children }) => (
  <NavigationContainer>
    <ThemeProvider>
      <AuthProvider>
        <SocialProvider>{children}</SocialProvider>
      </AuthProvider>
    </ThemeProvider>
  </NavigationContainer>
);

describe("Social Features", () => {
  test("FriendsScreen renders correctly", async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    // Wait for friends to load
    await waitFor(() => {
      expect(getByText("Test User 1")).toBeTruthy();
    });

    // Check for UI elements
    expect(getByText("Friends")).toBeTruthy();
    expect(getByText("Requests")).toBeTruthy();
    expect(queryByText("No pending friend requests")).toBeFalsy();
  });

  test("ActivityFeedScreen renders correctly", async () => {
    const { getByText } = render(
      <TestWrapper>
        <ActivityFeedScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    // Wait for activity feed to load
    await waitFor(() => {
      expect(getByText("Test User 1")).toBeTruthy();
    });

    // Check for activity content
    expect(getByText("watched a movie Test Movie")).toBeTruthy();
  });
});

describe("Watch Party Feature", () => {
  test("WatchPartyScreen renders correctly", async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <WatchPartyScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    // Wait for watch party to load
    await waitFor(() => {
      expect(getByText("Test Movie")).toBeTruthy();
    });

    // Check for UI elements
    expect(queryByText("Loading watch party...")).toBeFalsy();
    expect(queryByText("Watch party not found")).toBeFalsy();
  });
});
