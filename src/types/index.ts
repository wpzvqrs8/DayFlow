export interface DailyReport {
  id: string;
  date: string;
  score: number;
  accomplishments: string | null;
  challenges: string | null;
  reflections: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  is_default: boolean;
  date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AppConfig {
  id: number;
  password_hash: string;
  setup_complete: boolean;
  created_at: string;
}

export interface AnalyticsData {
  streak: number;
  averageScore: number;
  averageScoreTrend: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  weeklyTrend: {
    date: string;
    dayName: string;
    score: number;
  }[];
  monthlyHeatmap: {
    date: string;
    score: number;
  }[];
}
