import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { List, Text, TextInput, Button as PaperButton, IconButton } from 'react-native-paper';
import { WatchPartyService } from '../services/watchPartyService';
import { WatchParty, ChatMessage, WatchPartyParticipant } from '../types/watch-party';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    width: '100%',
  },
  video: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
  chatContainer: {
    borderRightColor: '#e0e0e0',
    borderRightWidth: 1,
    flex: 1,
    width: '30%',
  },
  inputContainer: {
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
    padding: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export const WatchPartyScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<WatchParty | null>(null);
  const [message, setMessage] = useState('');
  const [videoRef, setVideoRef] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const watchPartyService = WatchPartyService.getInstance();
  const theme = useTheme();

  useEffect(() => {
    const loadParty = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const partyData = await watchPartyService.joinWatchParty(partyId);
        setParty(partyData);
      } catch (error) {
        console.error('Error loading watch party:', error);
        setError(error instanceof Error ? error.message : 'Failed to load watch party');
      } finally {
        setIsLoading(false);
      }
    };

    loadParty();

    return () => {
      watchPartyService.leaveWatchParty().catch(console.error);
    };
  }, [partyId]);

  const handlePlayPause = async () => {
    if (!party || !videoRef) return;

    try {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      const status = await videoRef.getStatusAsync();
      if (status.isLoaded) {
        await watchPartyService.updatePlaybackState(newIsPlaying, status.positionMillis);
      }
    } catch (error) {
      console.error('Error updating playback state:', error);
      setError(error instanceof Error ? error.message : 'Failed to update playback state');
    }
  };

  const handleSeek = async (position: number) => {
    if (!party || !videoRef) return;

    try {
      await videoRef.setPositionAsync(position);
      await watchPartyService.updatePlaybackState(isPlaying, position);
    } catch (error) {
      console.error('Error seeking:', error);
      setError(error instanceof Error ? error.message : 'Failed to seek video');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await watchPartyService.sendChatMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const renderChatMessage = (message: ChatMessage) => (
    <List.Item
      key={message.id}
      title={message.username}
      description={message.content}
      left={props => <List.Icon {...props} icon="account" />}
    />
  );

  const renderParticipant = (participant: WatchPartyParticipant) => (
    <List.Item
      key={participant.userId}
      title={participant.username}
      description={participant.status}
      left={props => <List.Icon {...props} icon="account" />}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading watch party...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <PaperButton mode="contained" onPress={() => setError(null)}>
          Retry
        </PaperButton>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.container}>
        <Text>Watch party not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={setVideoRef}
          style={styles.video}
          source={{ uri: party.movie.backdrop_path || '' }}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={status => {
            if (status.isLoaded) {
              handleSeek(status.positionMillis);
            }
          }}
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.chatContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <PaperButton mode="contained" onPress={handleSendMessage}>
            Send
          </PaperButton>
        </View>
      </View>
    </View>
  );
}; 