import { supabase } from './supabase';
import { goalsService, Goal, GoalCompletion } from './goals-service';

// Supabase URL and key for direct HTTP requests
const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM';

export interface DailyReport {
  date: string;
  tasks_completed: number;
  tasks_total: number;
  goals_completed: number;
  goals_total: number;
  time_blocks_completed: number;
  time_blocks_total: number;
  meetings_attended: number;
  meetings_total: number;
  productivity_score: number; // 0-100
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  daily_reports: DailyReport[];
  total_tasks_completed: number;
  total_goals_completed: number;
  total_time_blocks: number;
  total_meetings: number;
  average_productivity: number;
  best_day: string;
  most_productive_time?: string;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  year: number;
  weekly_reports: WeeklyReport[];
  total_tasks_completed: number;
  total_goals_completed: number;
  goal_streaks: { goal_id: string; goal_title: string; streak: number }[];
  completion_rate: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ProductivityInsight {
  type: 'achievement' | 'suggestion' | 'warning';
  title: string;
  description: string;
  metric?: number;
}

export const reportService = {
  // Get daily report for a specific date
  getDailyReport: async (userId: number, date: string): Promise<{ data: DailyReport | null; error: Error | null }> => {
    try {
      // Get time blocks for the date
      const blocksResponse = await fetch(
        `${supabaseUrl}/rest/v1/personal_time_blocks?user_id=eq.${userId}&date=eq.${date}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let timeBlocks: any[] = [];
      if (blocksResponse.ok) {
        timeBlocks = await blocksResponse.json() || [];
      }

      // Get goals for the day
      const dayOfWeek = new Date(date).getDay();
      const goals = await goalsService.getGoalsForDay(userId, dayOfWeek);
      
      // Get goal completions for the date
      const { data: completions } = await goalsService.getCompletions(userId, undefined, date, date);
      const goalsCompleted = completions?.length || 0;

      // Get tasks completed on this date (from projects_task)
      const tasksResponse = await fetch(
        `${supabaseUrl}/rest/v1/projects_task?completed_at=gte.${date}T00:00:00&completed_at=lt.${date}T23:59:59&assignee_ids=cs.{${userId}}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let tasksCompleted = 0;
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json() || [];
        tasksCompleted = tasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
      }

      // Get meetings for the date
      const meetingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/projects_meeting?date=eq.${date}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let meetingsTotal = 0;
      if (meetingsResponse.ok) {
        const meetings = await meetingsResponse.json() || [];
        meetingsTotal = meetings.length;
      }

      // Calculate productivity score
      const timeBlocksCompleted = timeBlocks.filter(b => b.completed).length;
      const timeBlocksTotal = timeBlocks.length;
      const goalsTotal = goals.length;

      let productivityScore = 0;
      let totalWeight = 0;

      if (goalsTotal > 0) {
        productivityScore += (goalsCompleted / goalsTotal) * 40;
        totalWeight += 40;
      }
      if (timeBlocksTotal > 0) {
        productivityScore += (timeBlocksCompleted / timeBlocksTotal) * 30;
        totalWeight += 30;
      }
      if (tasksCompleted > 0) {
        productivityScore += Math.min(tasksCompleted * 10, 30);
        totalWeight += 30;
      }

      if (totalWeight > 0) {
        productivityScore = Math.round((productivityScore / totalWeight) * 100);
      }

      const report: DailyReport = {
        date,
        tasks_completed: tasksCompleted,
        tasks_total: tasksCompleted, // We only track completed tasks here
        goals_completed: goalsCompleted,
        goals_total: goalsTotal,
        time_blocks_completed: timeBlocksCompleted,
        time_blocks_total: timeBlocksTotal,
        meetings_attended: meetingsTotal, // Assuming all meetings are attended
        meetings_total: meetingsTotal,
        productivity_score: productivityScore,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting daily report:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get weekly report
  getWeeklyReport: async (userId: number, weekStart: Date): Promise<{ data: WeeklyReport | null; error: Error | null }> => {
    try {
      const dailyReports: DailyReport[] = [];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get daily reports for each day of the week
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { data: dailyReport } = await reportService.getDailyReport(userId, dateStr);
        if (dailyReport) {
          dailyReports.push(dailyReport);
        }
      }

      // Calculate totals
      const totalTasksCompleted = dailyReports.reduce((sum, r) => sum + r.tasks_completed, 0);
      const totalGoalsCompleted = dailyReports.reduce((sum, r) => sum + r.goals_completed, 0);
      const totalTimeBlocks = dailyReports.reduce((sum, r) => sum + r.time_blocks_completed, 0);
      const totalMeetings = dailyReports.reduce((sum, r) => sum + r.meetings_total, 0);
      
      // Calculate average productivity
      const averageProductivity = dailyReports.length > 0
        ? Math.round(dailyReports.reduce((sum, r) => sum + r.productivity_score, 0) / dailyReports.length)
        : 0;

      // Find best day
      let bestDay = dailyReports[0]?.date || weekStart.toISOString().split('T')[0];
      let bestScore = 0;
      dailyReports.forEach(r => {
        if (r.productivity_score > bestScore) {
          bestScore = r.productivity_score;
          bestDay = r.date;
        }
      });

      const report: WeeklyReport = {
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        daily_reports: dailyReports,
        total_tasks_completed: totalTasksCompleted,
        total_goals_completed: totalGoalsCompleted,
        total_time_blocks: totalTimeBlocks,
        total_meetings: totalMeetings,
        average_productivity: averageProductivity,
        best_day: bestDay,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting weekly report:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get monthly report
  getMonthlyReport: async (userId: number, year: number, month: number): Promise<{ data: MonthlyReport | null; error: Error | null }> => {
    try {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const weeklyReports: WeeklyReport[] = [];

      // Get weekly reports for the month
      let currentWeekStart = new Date(firstDay);
      currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

      while (currentWeekStart <= lastDay) {
        const { data: weeklyReport } = await reportService.getWeeklyReport(userId, currentWeekStart);
        if (weeklyReport) {
          weeklyReports.push(weeklyReport);
        }
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      // Calculate totals
      const totalTasksCompleted = weeklyReports.reduce((sum, r) => sum + r.total_tasks_completed, 0);
      const totalGoalsCompleted = weeklyReports.reduce((sum, r) => sum + r.total_goals_completed, 0);

      // Get goal streaks
      const { data: goals } = await goalsService.getGoals(userId);
      const goalStreaks = (goals || []).map(goal => ({
        goal_id: goal.id,
        goal_title: goal.title,
        streak: goal.streak_current,
      })).sort((a, b) => b.streak - a.streak);

      // Calculate completion rate (goals completed / expected)
      const daysInMonth = lastDay.getDate();
      const expectedCompletions = daysInMonth * (goals?.length || 0);
      const completionRate = expectedCompletions > 0
        ? Math.round((totalGoalsCompleted / expectedCompletions) * 100)
        : 0;

      // Determine trend by comparing first and second half of month
      const midPoint = Math.floor(weeklyReports.length / 2);
      const firstHalfAvg = weeklyReports.slice(0, midPoint).reduce((sum, r) => sum + r.average_productivity, 0) / (midPoint || 1);
      const secondHalfAvg = weeklyReports.slice(midPoint).reduce((sum, r) => sum + r.average_productivity, 0) / ((weeklyReports.length - midPoint) || 1);
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (secondHalfAvg > firstHalfAvg + 10) trend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 10) trend = 'declining';

      const report: MonthlyReport = {
        month: `${year}-${String(month).padStart(2, '0')}`,
        year,
        weekly_reports: weeklyReports,
        total_tasks_completed: totalTasksCompleted,
        total_goals_completed: totalGoalsCompleted,
        goal_streaks: goalStreaks,
        completion_rate: completionRate,
        trend,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get productivity insights
  getInsights: async (userId: number): Promise<{ data: ProductivityInsight[]; error: Error | null }> => {
    try {
      const insights: ProductivityInsight[] = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get this week's data
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const { data: weeklyReport } = await reportService.getWeeklyReport(userId, weekStart);

      // Get goals
      const { data: goals } = await goalsService.getGoals(userId);

      // Check for streaks
      if (goals) {
        const longestStreak = goals.reduce((max, goal) => Math.max(max, goal.streak_current), 0);
        if (longestStreak >= 7) {
          insights.push({
            type: 'achievement',
            title: 'Streak Master',
            description: `You have a ${longestStreak}-day streak! Keep it up!`,
            metric: longestStreak,
          });
        }

        // Check for goals at risk (not completed today when scheduled)
        const dayOfWeek = today.getDay();
        const scheduledGoals = goals.filter(g => 
          g.target_frequency === 'daily' || 
          (g.target_days && g.target_days.includes(dayOfWeek))
        );

        for (const goal of scheduledGoals) {
          const isCompleted = await goalsService.isCompletedForDate(goal.id, todayStr);
          if (!isCompleted && today.getHours() >= 18) { // After 6 PM
            insights.push({
              type: 'warning',
              title: 'Goal at Risk',
              description: `Don't forget to complete "${goal.title}" today to maintain your streak!`,
            });
          }
        }
      }

      // Weekly productivity insight
      if (weeklyReport) {
        if (weeklyReport.average_productivity >= 80) {
          insights.push({
            type: 'achievement',
            title: 'High Performer',
            description: `Your productivity score this week is ${weeklyReport.average_productivity}%! Excellent work!`,
            metric: weeklyReport.average_productivity,
          });
        } else if (weeklyReport.average_productivity < 50) {
          insights.push({
            type: 'suggestion',
            title: 'Room for Improvement',
            description: 'Try setting smaller, achievable goals to build momentum.',
            metric: weeklyReport.average_productivity,
          });
        }

        // Best day insight
        if (weeklyReport.best_day) {
          const bestDayName = new Date(weeklyReport.best_day).toLocaleDateString('en-US', { weekday: 'long' });
          insights.push({
            type: 'suggestion',
            title: 'Peak Performance Day',
            description: `${bestDayName} is typically your most productive day. Plan important tasks accordingly!`,
          });
        }
      }

      // Task completion insight
      if (weeklyReport && weeklyReport.total_tasks_completed >= 10) {
        insights.push({
          type: 'achievement',
          title: 'Task Champion',
          description: `You completed ${weeklyReport.total_tasks_completed} tasks this week!`,
          metric: weeklyReport.total_tasks_completed,
        });
      }

      return { data: insights, error: null };
    } catch (error) {
      console.error('Error getting insights:', error);
      return { data: [], error: error as Error };
    }
  },

  // Get a summary for the dashboard
  getDashboardSummary: async (userId: number): Promise<{
    today: DailyReport | null;
    thisWeek: WeeklyReport | null;
    insights: ProductivityInsight[];
    activeGoals: number;
    totalStreakDays: number;
  }> => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const [todayReport, weeklyReport, insightsResult, goalsResult] = await Promise.all([
      reportService.getDailyReport(userId, todayStr),
      reportService.getWeeklyReport(userId, weekStart),
      reportService.getInsights(userId),
      goalsService.getGoals(userId),
    ]);

    const totalStreakDays = (goalsResult.data || []).reduce((sum, goal) => sum + goal.streak_current, 0);

    return {
      today: todayReport.data,
      thisWeek: weeklyReport.data,
      insights: insightsResult.data,
      activeGoals: goalsResult.data?.length || 0,
      totalStreakDays,
    };
  },
};

export default reportService;

