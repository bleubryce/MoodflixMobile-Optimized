import React, { useEffect, useState, Suspense } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { SvgUri } from "react-native-svg";
import { images } from "@constants/assets";
import { useAuth } from '@contexts/auth/AuthContext';
import { recommendationService, RecommendationResult } from "@services/recommendationService";
import { ErrorHandler } from "@utils/errorHandler";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/RootNavigator';

const MoodRecommendations = React.lazy(() => import("@components/MoodRecommendations").then(m => ({ default: m.MoodRecommendations })));

export default function HomeScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'MoodPlaylists'>>();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const recs = await recommendationService.getRecommendations(10);
        setRecommendations(recs);
      } catch (err) {
        setError("Failed to load recommendations");
        ErrorHandler.getInstance().handleError(err instanceof Error ? err : new Error(String(err)), {
          componentName: "HomeScreen",
          action: "fetchRecommendations",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <SvgUri width={50} height={50} uri={images.happy} />
      </View>
      <Text variant="headlineMedium">Welcome to MoodFlix</Text>
      {session && (
        <Text variant="bodyLarge">Logged in as: {session.user.email}</Text>
      )}
      <Button
        mode="contained"
        style={{ marginTop: 24, marginBottom: 8 }}
        onPress={() => navigation.navigate('MoodPlaylists')}
        accessibilityLabel="Go to Mood Playlists"
      >
        View Mood Playlists
      </Button>
      <Suspense fallback={<Text>Loading recommendations…</Text>}>
        {!loading && !error && recommendations.length > 0 && (
          <MoodRecommendations
            mood={undefined as any}
            recommendationsWithReasons={recommendations.map(r => ({ movie: r.movies[0], reason: r.reason }))}
          />
        )}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
});
