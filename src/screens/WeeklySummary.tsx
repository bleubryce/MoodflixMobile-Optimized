import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ErrorHandler } from '@utils/errorHandler';
import { summaryService, MoodSummary, GenreSummary } from '@services/summaryService';
import { useAuth } from '@contexts/auth/AuthContext';

export const WeeklySummaryScreen: React.FC = () => {
  const { session } = useAuth();
  const [moodSummary, setMoodSummary] = useState<MoodSummary[]>([]);
  const [genreSummary, setGenreSummary] = useState<GenreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!session?.user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { moodSummary, genreSummary } = await summaryService.getUserSummary(session.user.id);
        setMoodSummary(moodSummary);
        setGenreSummary(genreSummary);
      } catch (err) {
        setError('Failed to load summary');
        ErrorHandler.getInstance().handleError(err instanceof Error ? err : new Error(String(err)), {
          componentName: 'WeeklySummaryScreen',
          action: 'loadSummary',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [session?.user?.id]);

  if (loading) return <Text>Loading weekly summary…</Text>;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{'Weekly Summary'}</Text>
      <Text style={styles.subheader}>{'Movies Watched by Mood'}</Text>
      <FlatList
        data={moodSummary}
        keyExtractor={(item) => item.mood}
        renderItem={({ item }) => (
          <Text>{`${item.mood}: ${item.count}`}</Text>
        )}
      />
      <Text style={styles.subheader}>{'Movies Watched by Genre'}</Text>
      <FlatList
        data={genreSummary}
        keyExtractor={(item) => item.genre}
        renderItem={({ item }) => (
          <Text>{`${item.genre}: ${item.count}`}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subheader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
}); 