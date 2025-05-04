import { useSocial } from "@contexts/SocialContext";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  Searchbar,
  FAB,
  Dialog,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";

export const FriendsScreen: React.FC = () => {
  const {
    friends,
    friendRequests,
    isLoadingFriends,
    isLoadingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshFriends,
  } = useSocial();

  const navigation = useNavigation();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddFriend = async () => {
    if (!friendIdInput.trim()) {
      setError("Please enter a valid friend ID");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await sendFriendRequest(friendIdInput.trim());
      setAddDialogVisible(false);
      setFriendIdInput("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send friend request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFriendItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        subtitle={item.status}
        left={(props) => (
          <Avatar.Image
            {...props}
            source={
              item.avatar
                ? { uri: item.avatar }
                : require("../../assets/default-avatar.png")
            }
          />
        )}
        right={(props) => (
          <Button
            {...props}
            mode="text"
            onPress={() =>
              navigation.navigate("Profile", { userId: item.userId })
            }
          >
            View
          </Button>
        )}
      />
      <Card.Actions>
        <Button
          onPress={() => navigation.navigate("Chat", { friendId: item.userId })}
        >
          Message
        </Button>
        <Button onPress={() => removeFriend(item.userId)}>Remove</Button>
      </Card.Actions>
    </Card>
  );

  const renderRequestItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.senderName}
        subtitle="Wants to be your friend"
        left={(props) => (
          <Avatar.Image
            {...props}
            source={
              item.senderAvatar
                ? { uri: item.senderAvatar }
                : require("../../assets/default-avatar.png")
            }
          />
        )}
      />
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => acceptFriendRequest(item.id)}
          style={{ marginRight: 8 }}
        >
          Accept
        </Button>
        <Button mode="outlined" onPress={() => declineFriendRequest(item.id)}>
          Decline
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === "friends" ? "contained" : "outlined"}
          onPress={() => setActiveTab("friends")}
          style={styles.tabButton}
        >
          Friends ({friends.length})
        </Button>
        <Button
          mode={activeTab === "requests" ? "contained" : "outlined"}
          onPress={() => setActiveTab("requests")}
          style={styles.tabButton}
        >
          Requests ({friendRequests.length})
        </Button>
      </View>

      {activeTab === "friends" ? (
        <>
          <Searchbar
            placeholder="Search friends"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingFriends}
                onRefresh={refreshFriends}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No friends match your search"
                    : "You have no friends yet"}
                </Text>
                {!searchQuery && (
                  <Button
                    mode="contained"
                    onPress={() => setAddDialogVisible(true)}
                    style={styles.addButton}
                  >
                    Add Friends
                  </Button>
                )}
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={friendRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingRequests}
              onRefresh={refreshFriends}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending friend requests</Text>
            </View>
          }
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setAddDialogVisible(true)}
      />

      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
        >
          <Dialog.Title>Add Friend</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Friend ID"
              value={friendIdInput}
              onChangeText={setFriendIdInput}
              mode="outlined"
              error={!!error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddFriend} loading={isSubmitting}>
              Send Request
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  addButton: {
    marginTop: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  errorText: {
    color: "red",
    marginTop: 8,
  },
});

export default FriendsScreen;
