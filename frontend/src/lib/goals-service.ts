import { supabase } from './supabase';

// Types
export interface Goal {
  id: string;
  user_id: number;
  title: string;
  description?: string;
  category: string; // e.g., "fitness", "learning", "health", "productivity"
  target_frequency: 'daily' | 'weekly' | 'custom';
  target_days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  target_time?: string; // HH:mm format
  duration_minutes?: number; // How long each session should be
  start_date: string;
  end_date?: string;
  is_active: boolean;
  color: string;
  icon?: string;
  streak_current: number;
  streak_best: number;
  created_at: string;
  updated_at: string;
}

export interface GoalCompletion {
  id: string;
  goal_id: string;
  user_id: number;
  completed_date: string;
  completed_at: string;
  notes?: string;
  duration_minutes?: number;
}

export interface GoalStats {
  total_completions: number;
  current_streak: number;
  best_streak: number;
  completion_rate_daily: number;
  completion_rate_weekly: number;
  completion_rate_monthly: number;
  completion_rate_yearly: number;
  completions_this_week: number;
  completions_this_month: number;
  completions_this_year: number;
  last_completed?: string;
}

// Goal categories with colors
export const GOAL_CATEGORIES = [
  { id: 'fitness', name: 'Fitness', color: '#ef4444' },
  { id: 'health', name: 'Health', color: '#10b981' },
  { id: 'learning', name: 'Learning', color: '#8b5cf6' },
  { id: 'productivity', name: 'Productivity', color: '#3b82f6' },
  { id: 'creative', name: 'Creative', color: '#f59e0b' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#06b6d4' },
  { id: 'social', name: 'Social', color: '#ec4899' },
  { id: 'finance', name: 'Finance', color: '#84cc16' },
  { id: 'custom', name: 'Custom', color: '#64748b' },
];

// Supabase URL and key for direct HTTP requests
const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM';

// Check if tables exist (caches result to avoid repeated checks)
let tablesExist: boolean | null = null;

const checkTablesExist = async (): Promise<boolean> => {
  if (tablesExist !== null) return tablesExist;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/personal_goals?limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    tablesExist = response.ok || response.status !== 404;
    return tablesExist;
  } catch {
    return false;
  }
};

export const goalsService = {
  // Check if goals feature is available
  isAvailable: async (): Promise<boolean> => {
    return await checkTablesExist();
  },

  // Get all goals for a user
  getGoals: async (userId: number): Promise<{ data: Goal[] | null; error: Error | null }> => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/personal_goals?user_id=eq.${userId}&is_active=eq.true&order=created_at.desc`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // If table doesn't exist (404) or any other error, return empty array gracefully
      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          console.warn('Goals table not found - please run the SQL migration');
          return { data: [], error: null };
        }
        return { data: [], error: new Error(`HTTP error: ${response.status}`) };
      }

      const data = await response.json();
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching goals:', error);
      return { data: [], error: error as Error };
    }
  },

  // Create a new goal
  createGoal: async (goalData: Partial<Goal>): Promise<{ data: Goal | null; error: Error | null }> => {
    try {
      const goalToInsert = {
        ...goalData,
        streak_current: 0,
        streak_best: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/personal_goals`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(goalToInsert),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: new Error('Goals table not found. Please run the SQL migration in Supabase.') };
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { data: null, error: error as Error };
    }
  },

  // Update a goal
  updateGoal: async (goalId: string, goalData: Partial<Goal>): Promise<{ data: Goal | null; error: Error | null }> => {
    try {
      const updateData = {
        ...goalData,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: new Error('Goals table not found') };
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Error updating goal:', error);
      return { data: null, error: error as Error };
    }
  },

  // Delete (soft delete) a goal
  deleteGoal: async (goalId: string): Promise<{ error: Error | null }> => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: false,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting goal:', error);
      return { error: error as Error };
    }
  },

  // Get goal completions for a date range
  getCompletions: async (
    userId: number,
    goalId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: GoalCompletion[] | null; error: Error | null }> => {
    try {
      let url = `${supabaseUrl}/rest/v1/goal_completions?user_id=eq.${userId}`;
      
      if (goalId) {
        url += `&goal_id=eq.${goalId}`;
      }
      if (startDate) {
        url += `&completed_date=gte.${startDate}`;
      }
      if (endDate) {
        url += `&completed_date=lte.${endDate}`;
      }
      
      url += '&order=completed_date.desc';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle missing table gracefully
      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          return { data: [], error: null };
        }
        return { data: [], error: new Error(`HTTP error: ${response.status}`) };
      }

      const data = await response.json();
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching completions:', error);
      return { data: [], error: error as Error };
    }
  },

  // Mark a goal as completed for today
  completeGoal: async (
    goalId: string,
    userId: number,
    notes?: string,
    durationMinutes?: number
  ): Promise<{ data: GoalCompletion | null; error: Error | null }> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already completed today
      const existingResponse = await fetch(
        `${supabaseUrl}/rest/v1/goal_completions?goal_id=eq.${goalId}&completed_date=eq.${today}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        if (existing && existing.length > 0) {
          return { data: existing[0], error: null }; // Already completed
        }
      }

      // Create completion record
      const completion = {
        goal_id: goalId,
        user_id: userId,
        completed_date: today,
        completed_at: new Date().toISOString(),
        notes,
        duration_minutes: durationMinutes,
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/goal_completions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(completion),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: new Error('Tables not found. Please run the SQL migration.') };
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      // Update streak
      await goalsService.updateStreak(goalId);

      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Error completing goal:', error);
      return { data: null, error: error as Error };
    }
  },

  // Uncomplete a goal for today
  uncompleteGoal: async (goalId: string, date?: string): Promise<{ error: Error | null }> => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/rest/v1/goal_completions?goal_id=eq.${goalId}&completed_date=eq.${targetDate}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update streak
      await goalsService.updateStreak(goalId);

      return { error: null };
    } catch (error) {
      console.error('Error uncompleting goal:', error);
      return { error: error as Error };
    }
  },

  // Update streak for a goal
  updateStreak: async (goalId: string): Promise<void> => {
    try {
      // Get all completions for this goal, ordered by date
      const response = await fetch(
        `${supabaseUrl}/rest/v1/goal_completions?goal_id=eq.${goalId}&order=completed_date.desc`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return;

      const completions = await response.json();
      if (!completions || completions.length === 0) {
        // No completions, reset streak
        await fetch(`${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            streak_current: 0,
            updated_at: new Date().toISOString(),
          }),
        });
        return;
      }

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < completions.length; i++) {
        const completionDate = new Date(completions[i].completed_date);
        completionDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (completionDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Get current goal to check best streak
      const goalResponse = await fetch(
        `${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!goalResponse.ok) return;

      const goals = await goalResponse.json();
      const currentGoal = goals?.[0];
      const bestStreak = Math.max(currentStreak, currentGoal?.streak_best || 0);

      // Update goal with new streak values
      await fetch(`${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streak_current: currentStreak,
          streak_best: bestStreak,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  },

  // Get statistics for a goal
  getGoalStats: async (goalId: string, userId: number): Promise<{ data: GoalStats | null; error: Error | null }> => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Get all completions for this goal
      const { data: allCompletions } = await goalsService.getCompletions(userId, goalId);
      
      // Get goal details
      const goalResponse = await fetch(
        `${supabaseUrl}/rest/v1/personal_goals?id=eq.${goalId}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!goalResponse.ok) {
        return { data: null, error: new Error('Failed to fetch goal') };
      }

      const goals = await goalResponse.json();
      const goal = goals?.[0];

      if (!goal) {
        return { data: null, error: new Error('Goal not found') };
      }

      const completions = allCompletions || [];

      // Calculate completions for different periods
      const completionsThisWeek = completions.filter(c => 
        new Date(c.completed_date) >= startOfWeek
      ).length;

      const completionsThisMonth = completions.filter(c => 
        new Date(c.completed_date) >= startOfMonth
      ).length;

      const completionsThisYear = completions.filter(c => 
        new Date(c.completed_date) >= startOfYear
      ).length;

      // Calculate completion rates
      const daysSinceStart = Math.max(1, Math.floor((today.getTime() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24)));
      const daysThisWeek = Math.min(7, today.getDay() + 1);
      const daysThisMonth = today.getDate();
      const daysThisYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // For custom days, calculate expected completions
      let expectedDaily = daysSinceStart;
      let expectedWeekly = daysThisWeek;
      let expectedMonthly = daysThisMonth;
      let expectedYearly = daysThisYear;

      if (goal.target_days && goal.target_days.length > 0 && goal.target_days.length < 7) {
        // Adjust for specific days
        const daysPerWeek = goal.target_days.length;
        expectedDaily = Math.floor(daysSinceStart * daysPerWeek / 7);
        expectedWeekly = goal.target_days.filter((d: number) => d <= today.getDay()).length;
        expectedMonthly = Math.floor(daysThisMonth * daysPerWeek / 7);
        expectedYearly = Math.floor(daysThisYear * daysPerWeek / 7);
      }

      const stats: GoalStats = {
        total_completions: completions.length,
        current_streak: goal.streak_current || 0,
        best_streak: goal.streak_best || 0,
        completion_rate_daily: expectedDaily > 0 ? Math.min(100, (completions.length / expectedDaily) * 100) : 0,
        completion_rate_weekly: expectedWeekly > 0 ? Math.min(100, (completionsThisWeek / expectedWeekly) * 100) : 0,
        completion_rate_monthly: expectedMonthly > 0 ? Math.min(100, (completionsThisMonth / expectedMonthly) * 100) : 0,
        completion_rate_yearly: expectedYearly > 0 ? Math.min(100, (completionsThisYear / expectedYearly) * 100) : 0,
        completions_this_week: completionsThisWeek,
        completions_this_month: completionsThisMonth,
        completions_this_year: completionsThisYear,
        last_completed: completions[0]?.completed_date,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting goal stats:', error);
      return { data: null, error: error as Error };
    }
  },

  // Check if a goal is completed for a specific date
  isCompletedForDate: async (goalId: string, date: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/goal_completions?goal_id=eq.${goalId}&completed_date=eq.${date}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  },

  // Get goals scheduled for a specific day of week
  getGoalsForDay: async (userId: number, dayOfWeek: number): Promise<Goal[]> => {
    try {
      const { data: goals } = await goalsService.getGoals(userId);
      if (!goals) return [];

      return goals.filter(goal => {
        if (goal.target_frequency === 'daily') return true;
        if (goal.target_days && goal.target_days.includes(dayOfWeek)) return true;
        return false;
      });
    } catch (error) {
      return [];
    }
  },
};

export default goalsService;
