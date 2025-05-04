import { useSocial } from "@contexts/SocialContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { WatchPartyService } from "@services/watchPartyService";
import { Video, ResizeMode } from "expo-av";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import {
  Text,
  Button,
  TextInput,
  Avatar,
  Card,
  IconButton,
  useTheme,
} from "react-native-paper";

export const WatchPartyScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { partyId } = route.params as { partyId: string };
  const { friends, createActivity } = useSocial();

  const [party, setParty] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);

  const videoRef = useRef(null);
  const chatScrollRef = useRef(null);
  const watchPartyService = WatchPartyService.getInstance();

  useEffect(() => {
    loadParty();
    setupRealtimeSubscription();

    return () => {
      leaveParty();
    };
  }, [partyId]);

  const loadParty = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const partyData = await watchPartyService.joinWatchParty(partyId);
      setParty(partyData);
      setParticipants(partyData.participants);
      setChatMessages(partyData.chatMessages || []);

      // Create activity for joining watch party
      await createActivity(
        "watch",
        `joined a watch party for ${partyData.movie.title}`,
        partyData.movieId.toString(),
        "movie",
      );
    } catch (err) {
      console.error("Error loading watch party:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load watch party",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      // Subscribe to real-time updates
      watchPartyService.subscribeToUpdates((updatedParty) => {
        setParty(updatedParty);
        setParticipants(updatedParty.participants);
        setChatMessages(updatedParty.chatMessages || []);

        // Sync video playback state
        if (videoRef.current) {
          if (updatedParty.isPlaying !== isPlaying) {
            if (updatedParty.isPlaying) {
              videoRef.current.playAsync();
            } else {
              videoRef.current.pauseAsync();
            }
            setIsPlaying(updatedParty.isPlaying);
          }

          // Sync video position if it's more than 3 seconds off
          videoRef.current.getStatusAsync().then((status) => {
            if (
              status.isLoaded &&
              Math.abs(status.positionMillis - updatedParty.currentTime) > 3000
            ) {
              videoRef.current.setPositionAsync(updatedParty.currentTime);
            }
          });
        }
      });
    } catch (err) {
      console.error("Error setting up real-time subscription:", err);
    }
  };

  const leaveParty = async () => {
    try {
      await watchPartyService.leaveWatchParty();
    } catch (err) {
      console.error("Error leaving watch party:", err);
    }
  };

  const handlePlayPause = async () => {
    if (!party || !videoRef.current) return;

    try {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);

      if (newIsPlaying) {
        await videoRef.current.playAsync();
      } else {
        await videoRef.current.pauseAsync();
      }

      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        await watchPartyService.updatePlaybackState(
          newIsPlaying,
          status.positionMillis,
        );
      }
    } catch (err) {
      console.error("Error updating playback state:", err);
    }
  };

  const handleSeek = async (position) => {
    if (!party || !videoRef.current) return;

    try {
      await videoRef.current.setPositionAsync(position);
      await watchPartyService.updatePlaybackState(isPlaying, position);
    } catch (err) {
      console.error("Error seeking:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await watchPartyService.sendChatMessage(message);
      setMessage("");

      // Scroll to bottom of chat
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollToEnd({ animated: true });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleInviteFriend = async (friendId) => {
    try {
      await watchPartyService.inviteToWatchParty(partyId, friendId);
      setInviteDialogVisible(false);
    } catch (err) {
      console.error("Error inviting friend:", err);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading watch party...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadParty} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Watch party not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{party.movie.title}</Text>
        <View style={styles.headerButtons}>
          <IconButton
            icon="account-group"
            size={24}
            onPress={() => setShowParticipants(!showParticipants)}
          />
          <IconButton
            icon="account-plus"
            size={24}
            onPress={() => setInviteDialogVisible(true)}
          />
        </View>
      </View>

      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{
            uri:
              party.movie.videoUrl ||
              `https://example.com/videos/${party.movieId}.mp4`,
          }}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
              watchPartyService.updatePlaybackState(
                false,
                status.positionMillis,
              );
            }
          }}
        />
        <View style={styles.videoControls}>
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            size={36}
            onPress={handlePlayPause}
          />
          <IconButton
            icon="skip-backward"
            size={36}
            onPress={() => handleSeek(0)}
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        {showParticipants ? (
          <Card style={styles.participantsCard}>
            <Card.Title title="Participants" />
            <Card.Content>
              <FlatList
                data={participants}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                  <View style={styles.participantItem}>
                    <Avatar.Image
                      size={40}
                      source={
                        item.avatarUrl
                          ? { uri: item.avatarUrl }
                          : require("../../assets/default-avatar.png")
                      }
                    />
                    <View style={styles.participantInfo}>
                      <Text>{item.username}</Text>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                )}
              />
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.chatContainer}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
            >
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.type === "system"
                      ? styles.systemMessage
                      : styles.userMessage,
                  ]}
                >
                  {msg.type !== "system" && (
                    <Text style={styles.messageUsername}>{msg.username}</Text>
                  )}
                  <Text style={styles.messageContent}>{msg.content}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                mode="outlined"
              />
              <IconButton
                icon="send"
                size={24}
                onPress={handleSendMessage}
                disabled={!message.trim()}
              />
            </View>
          </View>
        )}
      </View>

      {inviteDialogVisible && (
        <View style={styles.inviteDialog}>
          <Card>
            <Card.Title title="Invite Friends" />
            <Card.Content>
              <FlatList
                data={friends}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                  <View style={styles.friendItem}>
                    <Avatar.Image
                      size={40}
                      source={
                        item.avatar
                          ? { uri: item.avatar }
                          : require("../../assets/default-avatar.png")
                      }
                    />
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Button
                      mode="contained"
                      onPress={() => handleInviteFriend(item.userId)}
                    >
                      Invite
                    </Button>
                  </View>
                )}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setInviteDialogVisible(false)}>
                Close
              </Button>
            </Card.Actions>
          </Card>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#e1f5fe",
    alignSelf: "flex-start",
  },
  systemMessage: {
    backgroundColor: "#f5f5f5",
    alignSelf: "center",
    borderRadius: 8,
  },
  messageUsername: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#757575",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  chatInput: {
    flex: 1,
    marginRight: 8,
  },
  participantsCard: {
    margin: 16,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  participantInfo: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#757575",
  },
  inviteDialog: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  friendName: {
    flex: 1,
    marginLeft: 12,
  },
  errorText: {
    color: "red",
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
});

export default WatchPartyScreen;
