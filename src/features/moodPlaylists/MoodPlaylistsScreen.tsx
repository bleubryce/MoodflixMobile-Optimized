import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import { ErrorHandler } from '@utils/errorHandler';
import { Mood } from '@errors/mood';
import { playlistService } from '@services/playlistService';
import { useAuth } from '@contexts/auth/AuthContext';
import { PlaylistEditor } from './PlaylistEditor';

export interface MoodPlaylist {
  id: string;
  name: string;
  mood: Mood;
  movieIds: number[];
}

export interface MoodPlaylistsScreenProps {
  onSelect: (playlist: MoodPlaylist) => void;
}

export const MoodPlaylistsScreen: React.FC<MoodPlaylistsScreenProps> = ({ onSelect }) => {
  const { session } = useAuth();
  const [playlists, setPlaylists] = useState<MoodPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<MoodPlaylist | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const fetchPlaylists = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await playlistService.getPlaylists(session.user.id);
      setPlaylists(data);
    } catch (err) {
      setError('Failed to load playlists');
      ErrorHandler.getInstance().handleError(err instanceof Error ? err : new Error(String(err)), {
        componentName: 'MoodPlaylistsScreen',
        action: 'fetchPlaylists',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlaylist(null);
    setShowEditor(true);
  };

  const handleEdit = (playlist: MoodPlaylist) => {
    setEditingPlaylist(playlist);
    setShowEditor(true);
  };

  const handleSave = async (playlistData: Omit<MoodPlaylist, 'id'>) => {
    try {
      setFeedback(null);
      if (editingPlaylist) {
        // Edit existing
        const updated = await playlistService.updatePlaylist(editingPlaylist.id, playlistData);
        setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setFeedback('Playlist updated!');
      } else {
        // Create new
        const created = await playlistService.createPlaylist({ ...playlistData, userId: session.user.id });
        setPlaylists((prev) => [created, ...prev]);
        setFeedback('Playlist created!');
      }
      setShowEditor(false);
    } catch (err) {
      setFeedback('Error saving playlist');
      ErrorHandler.getInstance().handleError(err instanceof Error ? err : new Error(String(err)), {
        componentName: 'MoodPlaylistsScreen',
        action: 'savePlaylist',
      });
    }
  };

  const grouped = playlists.reduce<Record<Mood, MoodPlaylist[]>>((acc, playlist) => {
    acc[playlist.mood] = acc[playlist.mood] || [];
    acc[playlist.mood].push(playlist);
    return acc;
  }, {} as Record<Mood, MoodPlaylist[]>);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
  }
  if (error) {
    return <Text style={{ color: 'red', margin: 16 }}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{'Mood Playlists'}</Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>{'Create Playlist'}</Text>
      </TouchableOpacity>
      {feedback && <Text style={styles.feedback}>{feedback}</Text>}
      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([mood]) => mood}
        renderItem={({ item: [mood, moodPlaylists] }) => (
          <View style={styles.moodGroup}>
            <Text style={styles.moodLabel}>{mood}</Text>
            {moodPlaylists.map((playlist) => (
              <TouchableOpacity key={playlist.id} style={styles.playlistItem} onPress={() => onSelect(playlist)} onLongPress={() => handleEdit(playlist)}>
                <Text style={styles.playlistName}>{playlist.name}</Text>
                <Text style={styles.movieCount}>{`${playlist.movieIds.length} movies`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      <Modal visible={showEditor} animationType="slide" onRequestClose={() => setShowEditor(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
          <PlaylistEditor
            playlist={editingPlaylist ?? undefined}
            onSave={handleSave}
            onCancel={() => setShowEditor(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#ffe066',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedback: {
    color: 'green',
    marginBottom: 8,
    textAlign: 'center',
  },
  moodGroup: {
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  playlistItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playlistName: {
    fontSize: 16,
  },
  movieCount: {
    fontSize: 12,
    color: '#888',
  },
}); 