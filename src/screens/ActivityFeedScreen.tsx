import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useSocial } from '../contexts/SocialContext';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeedScreen: React.FC = () => {
  const { activityFeed, isLoadingActivity, loadMoreActivity, refreshActivity } = useSocial();
  const navigation = useNavigation();
  const theme = useTheme();

  const renderActivityItem = ({ item }) => {
    let actionText = '';
    let icon = '';
    let navigateTo = null;
    let navigateParams = {};

    switch (item.type) {
      case 'watch':
        actionText = 'watched a movie';
        icon = 'movie';
        navigateTo = 'MovieDetail';
        navigateParams = { movieId: item.resourceId };
        break;
      case 'rate':
        actionText = 'rated a movie';
        icon = 'star';
        navigateTo = 'MovieDetail';
        navigateParams = { movieId: item.resourceId };
        break;
      case 'recommend':
        actionText = 'recommended a movie';
        icon = 'thumb-up';
        navigateTo = 'MovieDetail';
        navigateParams = { movieId: item.resourceId };
        break;
      case 'friend':
        actionText = 'made a new friend';
        icon = 'account-multiple';
        break;
      case 'mood':
        actionText = 'is in the mood for';
        icon = 'emoticon';
        break;
      default:
        actionText = 'did something';
        icon = 'information';
    }

    const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

    return (
      <Card style={styles.card}>
        <Card.Title
          title={item.username}
          subtitle={timeAgo}
          left={(props) => (
            <Avatar.Image
              {...props}
              source={
                item.avatarUrl
                  ? { uri: item.avatarUrl }
                  : require('../../assets/default-avatar.png')
              }
            />
          )}
          right={(props) => (
            <Avatar.Icon {...props} icon={icon} size={36} />
          )}
        />
        <Card.Content>
          <Text style={styles.activityText}>
            {actionText} {item.content}
          </Text>
        </Card.Content>
        {navigateTo && (
          <Card.Actions>
            <Button onPress={() => navigation.navigate(navigateTo, navigateParams)}>
              View Details
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={activityFeed}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingActivity}
            onRefresh={refreshActivity}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={loadMoreActivity}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No activity yet. Add friends or interact with movies to see activity here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  activityText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ActivityFeedScreen;
