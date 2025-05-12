import { supabase } from "@config/supabase";
import { ErrorHandler } from "@utils/errorHandler";

export interface MoodSummary {
  mood: string;
  count: number;
}

export interface GenreSummary {
  genre: string;
  count: number;
}

class SummaryService {
  private readonly errorHandler = ErrorHandler.getInstance();

  async getUserSummary(userId: string): Promise<{ moodSummary: MoodSummary[]; genreSummary: GenreSummary[] }> {
    try {
      // Get start of week (Monday)
      const now = new Date();
      const day = now.getDay() || 7;
      const monday = new Date(now);
      if (day !== 1) monday.setHours(-24 * (day - 1));
      const weekStart = monday.toISOString().slice(0, 10);

      // Fetch watch history for this week
      const { data, error } = await supabase
        .from("watch_history")
        .select("mood, genre")
        .eq("user_id", userId)
        .gte("watched_at", weekStart);
      if (error) throw error;

      // Aggregate mood and genre counts
      const moodCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.mood) moodCounts[row.mood] = (moodCounts[row.mood] || 0) + 1;
        if (row.genre) genreCounts[row.genre] = (genreCounts[row.genre] || 0) + 1;
      });
      const moodSummary = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));
      const genreSummary = Object.entries(genreCounts).map(([genre, count]) => ({ genre, count }));
      return { moodSummary, genreSummary };
    } catch (error) {
      await this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), {
        componentName: "SummaryService",
        action: "getUserSummary",
      });
      throw error;
    }
  }
}

export const summaryService = new SummaryService(); 