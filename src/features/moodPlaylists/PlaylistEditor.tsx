import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Picker } from 'react-native';
import { Mood } from '@errors/mood';
import { ErrorHandler } from '@utils/errorHandler';
import { MoodPlaylist } from './MoodPlaylistsScreen';

export interface PlaylistEditorProps {
  playlist?: MoodPlaylist;
  onSave: (playlist: Omit<MoodPlaylist, 'id'>) => void;
  onCancel: () => void;
}

const MOODS: { mood: Mood; label: string }[] = [
  { mood: 'happy', label: 'Happy' },
  { mood: 'sad', label: 'Sad' },
  { mood: 'excited', label: 'Excited' },
  { mood: 'relaxed', label: 'Relaxed' },
  { mood: 'thoughtful', label: 'Thoughtful' },
];

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({ playlist, onSave, onCancel }) => {
  const [name, setName] = useState(playlist?.name || '');
  const [mood, setMood] = useState<Mood>(playlist?.mood || 'happy');
  // For simplicity, movieIds editing is omitted; add as needed

  const handleSave = () => {
    try {
      if (!name.trim()) return;
      onSave({ name, mood, movieIds: playlist?.movieIds || [] });
    } catch (error) {
      ErrorHandler.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'PlaylistEditor',
        action: 'onSave',
        additionalInfo: { name, mood },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{playlist ? 'Edit Playlist' : 'Create Playlist'}</Text>
      <TextInput
        style={styles.input}
        placeholder={'Playlist Name'}
        value={name}
        onChangeText={setName}
      />
      <Picker
        selectedValue={mood}
        onValueChange={(itemValue) => setMood(itemValue as Mood)}
        style={styles.picker}
      >
        {MOODS.map(({ mood, label }) => (
          <Picker.Item key={mood} label={label} value={mood} />
        ))}
      </Picker>
      <View style={styles.buttonRow}>
        <Button title={'Cancel'} onPress={onCancel} color="#888" />
        <Button title={'Save'} onPress={handleSave} color="#4caf50" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  picker: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}); 