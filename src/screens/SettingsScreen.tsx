import React from 'react';
import { StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
});

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <List.Section style={styles.container}>
      <List.Item
        title="Appearance"
        left={props => <List.Icon {...props} icon="theme-light-dark" />}
      />
      <List.Item
        title="Notifications"
        left={props => <List.Icon {...props} icon="bell" />}
      />
      <List.Item
        title="Data"
        left={props => <List.Icon {...props} icon="database" />}
      />
    </List.Section>
  );
}; 