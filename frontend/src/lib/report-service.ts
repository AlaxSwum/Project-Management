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

// Helper function to safely fetch data
async function safeFetch(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    return await response.json() || [];
  } catch {
    return [];
  }
}

// Get tasks completed in a date range (batch query)
async function getTasksCompletedInRange(userId: number, startDate: string, endDate: string): Promise<any[]> {
  const url = `${supabaseUrl}/rest/v1/projects_task?completed_at=gte.${startDate}T00:00:00&completed_at=lte.${endDate}T23:59:59&status=in.(done,completed)&select=id,completed_at,status`;
  return safeFetch(url);
}

// Get meetings in a date range (batch query)
async function getMeetingsInRange(userId: number, startDate: string, endDate: string): Promise<any[]> {
  const url = `${supabaseUrl}/rest/v1/projects_meeting?date=gte.${startDate}&date=lte.${endDate}&select=id,date,title`;
  return safeFetch(url);
}

// Get goal completions in a date range (batch query)
async function getGoalCompletionsInRange(userId: number, startDate: string, endDate: string): Promise<GoalCompletion[]> {
  const { data } = await goalsService.getCompletions(userId, undefined, startDate, endDate);
  return data || [];
}

export const reportService = {
  // Get daily report for a specific date - OPTIMIZED
  getDailyReport: async (userId: number, date: string): Promise<{ data: DailyReport | null; error: Error | null }> => {
    try {
      // Run all queries in parallel for speed
      const [goals, completions, tasks, meetings] = await Promise.all([
        goalsService.getGoalsForDay(userId, new Date(date).getDay()),
        goalsService.getCompletions(userId, undefined, date, date),
        getTasksCompletedInRange(userId, date, date),
        getMeetingsInRange(userId, date, date),
      ]);

      const goalsCompleted = completions.data?.length || 0;
      const goalsTotal = goals.length;
      const tasksCompleted = tasks.length;
      const meetingsTotal = meetings.length;

      // Calculate productivity score
      let productivityScore = 0;
      let totalWeight = 0;

      if (goalsTotal > 0) {
        productivityScore += (goalsCompleted / goalsTotal) * 50;
        totalWeight += 50;
      }
      if (tasksCompleted > 0) {
        productivityScore += Math.min(tasksCompleted * 10, 50);
        totalWeight += 50;
      }

      // If no data exists, base score on whether any activity happened
      if (totalWeight === 0) {
        productivityScore = (goalsCompleted > 0 || tasksCompleted > 0) ? 50 : 0;
      } else {
        productivityScore = Math.round((productivityScore / totalWeight) * 100);
      }

      const report: DailyReport = {
        date,
        tasks_completed: tasksCompleted,
        tasks_total: tasksCompleted,
        goals_completed: goalsCompleted,
        goals_total: goalsTotal,
        time_blocks_completed: 0, // Time blocks not yet implemented
        time_blocks_total: 0,
        meetings_attended: meetingsTotal,
        meetings_total: meetingsTotal,
        productivity_score: productivityScore,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting daily report:', error);
      // Return empty report instead of null
      return { 
        data: {
          date,
          tasks_completed: 0,
          tasks_total: 0,
          goals_completed: 0,
          goals_total: 0,
          time_blocks_completed: 0,
          time_blocks_total: 0,
          meetings_attended: 0,
          meetings_total: 0,
          productivity_score: 0,
        }, 
        error: null 
      };
    }
  },

  // Get weekly report - OPTIMIZED with batch queries
  getWeeklyReport: async (userId: number, weekStart: Date): Promise<{ data: WeeklyReport | null; error: Error | null }> => {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      // Batch fetch all data for the week at once
      const [goals, allCompletions, tasks, meetings] = await Promise.all([
        goalsService.getGoals(userId),
        getGoalCompletionsInRange(userId, startStr, endStr),
        getTasksCompletedInRange(userId, startStr, endStr),
        getMeetingsInRange(userId, startStr, endStr),
      ]);

      // Build daily reports from the batch data
      const dailyReports: DailyReport[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();

        // Filter data for this specific day
        const dayGoals = (goals.data || []).filter(g => 
          g.target_frequency === 'daily' || 
          (g.target_days && g.target_days.includes(dayOfWeek))
        );
        const dayCompletions = allCompletions.filter(c => c.completed_date === dateStr);
        const dayTasks = tasks.filter(t => t.completed_at?.startsWith(dateStr));
        const dayMeetings = meetings.filter(m => m.date === dateStr);

        // Calculate daily productivity
        const goalsCompleted = dayCompletions.length;
        const goalsTotal = dayGoals.length;
        const tasksCompleted = dayTasks.length;

        let productivityScore = 0;
        if (goalsTotal > 0) {
          productivityScore = Math.round((goalsCompleted / goalsTotal) * 80);
        }
        if (tasksCompleted > 0) {
          productivityScore += Math.min(tasksCompleted * 5, 20);
        }
        productivityScore = Math.min(productivityScore, 100);

        dailyReports.push({
          date: dateStr,
          tasks_completed: tasksCompleted,
          tasks_total: tasksCompleted,
          goals_completed: goalsCompleted,
          goals_total: goalsTotal,
          time_blocks_completed: 0,
          time_blocks_total: 0,
          meetings_attended: dayMeetings.length,
          meetings_total: dayMeetings.length,
          productivity_score: productivityScore,
        });
      }

      // Calculate totals
      const totalTasksCompleted = dailyReports.reduce((sum, r) => sum + r.tasks_completed, 0);
      const totalGoalsCompleted = dailyReports.reduce((sum, r) => sum + r.goals_completed, 0);
      const totalMeetings = dailyReports.reduce((sum, r) => sum + r.meetings_total, 0);
      
      const averageProductivity = dailyReports.length > 0
        ? Math.round(dailyReports.reduce((sum, r) => sum + r.productivity_score, 0) / dailyReports.length)
        : 0;

      // Find best day
      let bestDay = dailyReports[0]?.date || startStr;
      let bestScore = 0;
      dailyReports.forEach(r => {
        if (r.productivity_score > bestScore) {
          bestScore = r.productivity_score;
          bestDay = r.date;
        }
      });

      const report: WeeklyReport = {
        week_start: startStr,
        week_end: endStr,
        daily_reports: dailyReports,
        total_tasks_completed: totalTasksCompleted,
        total_goals_completed: totalGoalsCompleted,
        total_time_blocks: 0,
        total_meetings: totalMeetings,
        average_productivity: averageProductivity,
        best_day: bestDay,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting weekly report:', error);
      // Return empty report
      const startStr = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return { 
        data: {
          week_start: startStr,
          week_end: weekEnd.toISOString().split('T')[0],
          daily_reports: [],
          total_tasks_completed: 0,
          total_goals_completed: 0,
          total_time_blocks: 0,
          total_meetings: 0,
          average_productivity: 0,
          best_day: startStr,
        }, 
        error: null 
      };
    }
  },

  // Get monthly report - OPTIMIZED
  getMonthlyReport: async (userId: number, year: number, month: number): Promise<{ data: MonthlyReport | null; error: Error | null }> => {
    try {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = lastDay.toISOString().split('T')[0];

      // Batch fetch all data for the month
      const [goals, allCompletions, tasks] = await Promise.all([
        goalsService.getGoals(userId),
        getGoalCompletionsInRange(userId, startStr, endStr),
        getTasksCompletedInRange(userId, startStr, endStr),
      ]);

      const totalTasksCompleted = tasks.length;
      const totalGoalsCompleted = allCompletions.length;

      // Get goal streaks
      const goalStreaks = (goals.data || []).map(goal => ({
        goal_id: goal.id,
        goal_title: goal.title,
        streak: goal.streak_current,
      })).sort((a, b) => b.streak - a.streak);

      // Calculate completion rate
      const daysInMonth = lastDay.getDate();
      const expectedCompletions = daysInMonth * (goals.data?.length || 0);
      const completionRate = expectedCompletions > 0
        ? Math.round((totalGoalsCompleted / expectedCompletions) * 100)
        : 0;

      // Simple trend calculation
      const midPoint = Math.floor(daysInMonth / 2);
      const firstHalfCompletions = allCompletions.filter(c => {
        const day = new Date(c.completed_date).getDate();
        return day <= midPoint;
      }).length;
      const secondHalfCompletions = allCompletions.filter(c => {
        const day = new Date(c.completed_date).getDate();
        return day > midPoint;
      }).length;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (secondHalfCompletions > firstHalfCompletions * 1.2) trend = 'improving';
      else if (secondHalfCompletions < firstHalfCompletions * 0.8) trend = 'declining';

      const report: MonthlyReport = {
        month: `${year}-${String(month).padStart(2, '0')}`,
        year,
        weekly_reports: [], // Not loading weekly reports to avoid nested queries
        total_tasks_completed: totalTasksCompleted,
        total_goals_completed: totalGoalsCompleted,
        goal_streaks: goalStreaks,
        completion_rate: completionRate,
        trend,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return { 
        data: {
          month: `${year}-${String(month).padStart(2, '0')}`,
          year,
          weekly_reports: [],
          total_tasks_completed: 0,
          total_goals_completed: 0,
          goal_streaks: [],
          completion_rate: 0,
          trend: 'stable',
        }, 
        error: null 
      };
    }
  },

  // Get productivity insights - OPTIMIZED
  getInsights: async (userId: number): Promise<{ data: ProductivityInsight[]; error: Error | null }> => {
    try {
      const insights: ProductivityInsight[] = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get this week's dates
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Batch fetch data
      const [goals, weekCompletions, weekTasks] = await Promise.all([
        goalsService.getGoals(userId),
        getGoalCompletionsInRange(userId, weekStartStr, todayStr),
        getTasksCompletedInRange(userId, weekStartStr, todayStr),
      ]);

      const goalsData = goals.data || [];

      // Check for streaks
      if (goalsData.length > 0) {
        const longestStreak = goalsData.reduce((max, goal) => Math.max(max, goal.streak_current), 0);
        if (longestStreak >= 7) {
          insights.push({
            type: 'achievement',
            title: 'Streak Master',
            description: `You have a ${longestStreak}-day streak! Keep it up!`,
            metric: longestStreak,
          });
        } else if (longestStreak >= 3) {
          insights.push({
            type: 'achievement',
            title: 'Building Momentum',
            description: `You're on a ${longestStreak}-day streak. Keep going!`,
            metric: longestStreak,
          });
        }

        // Check for goals at risk (not completed today when scheduled)
        const dayOfWeek = today.getDay();
        const scheduledGoals = goalsData.filter(g => 
          g.target_frequency === 'daily' || 
          (g.target_days && g.target_days.includes(dayOfWeek))
        );

        const todayCompletions = weekCompletions.filter(c => c.completed_date === todayStr);
        const completedGoalIds = new Set(todayCompletions.map(c => c.goal_id));
        
        const incompleteGoals = scheduledGoals.filter(g => !completedGoalIds.has(g.id));
        
        if (incompleteGoals.length > 0 && today.getHours() >= 18) {
          insights.push({
            type: 'warning',
            title: 'Goals Pending',
            description: `You have ${incompleteGoals.length} goal(s) to complete today!`,
            metric: incompleteGoals.length,
          });
        }
      }

      // Weekly productivity insight
      const totalWeekGoals = weekCompletions.length;
      const totalWeekTasks = weekTasks.length;

      if (totalWeekTasks >= 10) {
        insights.push({
          type: 'achievement',
          title: 'Task Champion',
          description: `You completed ${totalWeekTasks} tasks this week!`,
          metric: totalWeekTasks,
        });
      }

      if (totalWeekGoals >= 5) {
        insights.push({
          type: 'achievement',
          title: 'Goal Getter',
          description: `You completed ${totalWeekGoals} goals this week!`,
          metric: totalWeekGoals,
        });
      }

      // Add a helpful tip if no insights yet
      if (insights.length === 0) {
        if (goalsData.length === 0) {
          insights.push({
            type: 'suggestion',
            title: 'Get Started',
            description: 'Create your first goal to start tracking your progress!',
          });
        } else {
          insights.push({
            type: 'suggestion',
            title: 'Keep It Up',
            description: 'Complete your daily goals to build consistency and streaks!',
          });
        }
      }

      return { data: insights, error: null };
    } catch (error) {
      console.error('Error getting insights:', error);
      return { 
        data: [{
          type: 'suggestion',
          title: 'Welcome',
          description: 'Start by creating some goals to track your productivity!',
        }], 
        error: null 
      };
    }
  },

  // Get a summary for the dashboard - OPTIMIZED
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
