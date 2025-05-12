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
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");

  const renderFriendItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.username}
        left={(props) => (
          <Avatar.Text
            {...props}
            label={item.username.substring(0, 2).toUpperCase()}
            size={40}
          />
        )}
      />
      <Card.Actions>
        <Button onPress={() => navigation.navigate("FriendProfile", { friendId: item.id })}>
          View Profile
        </Button>
        <Button onPress={() => removeFriend(item.id)}>Remove</Button>
      </Card.Actions>
    </Card>
  );

  const renderRequestItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.username}
        left={(props) => (
          <Avatar.Text
            {...props}
            label={item.username.substring(0, 2).toUpperCase()}
            size={40}
          />
        )}
      />
      <Card.Actions>
        <Button onPress={() => acceptFriendRequest(item.id)}>Accept</Button>
        <Button onPress={() => declineFriendRequest(item.id)}>Decline</Button>
      </Card.Actions>
    </Card>
  );

  const handleSendRequest = async () => {
    await sendFriendRequest(friendEmail);
    setFriendEmail("");
    setIsDialogVisible(false);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search friends"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {friendRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          <FlatList
            data={friendRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
          <Divider style={styles.divider} />
        </>
      )}

      <Text style={styles.sectionTitle}>Friends</Text>
      <FlatList
        data={friends.filter((friend) =>
          friend.username.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoadingFriends} onRefresh={refreshFriends} />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
          <Dialog.Title>Add Friend</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Friend's Email"
              value={friendEmail}
              onChangeText={setFriendEmail}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSendRequest}>Send Request</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  card: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FriendsScreen;
