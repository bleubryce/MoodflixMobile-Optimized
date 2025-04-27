import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { useNotifications } from '../../contexts/notifications/NotificationContext';
import { useTheme } from 'react-native-paper';

export const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const theme = useTheme();

  const handleToggle = async (key: keyof typeof preferences) => {
    try {
      await updatePreferences({
        ...preferences,
        [key]: !preferences[key],
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Item
          title="Movie Recommendations"
          right={() => (
            <Switch
              value={preferences.recommendations}
              onValueChange={() => handleToggle('recommendations')}
              testID="recommendations-switch"
            />
          )}
        />
        <Divider />
        <List.Item
          title="Mood-Based Suggestions"
          right={() => (
            <Switch
              value={preferences.moodSuggestions}
              onValueChange={() => handleToggle('moodSuggestions')}
              testID="mood-suggestions-switch"
            />
          )}
        />
        <Divider />
        <List.Item
          title="Watch Reminders"
          right={() => (
            <Switch
              value={preferences.watchReminders}
              onValueChange={() => handleToggle('watchReminders')}
              testID="watch-reminders-switch"
            />
          )}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}); 