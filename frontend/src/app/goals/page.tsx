'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { goalsService, Goal, GoalCompletion, GoalStats, GOAL_CATEGORIES } from '@/lib/goals-service';
import { showNotification } from '@/lib/electron-notifications';
import {
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  SparklesIcon,
  BoltIcon,
  AcademicCapIcon,
  HeartIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, FireIcon as FireIconSolid } from '@heroicons/react/24/solid';

// Days of week
const DAYS_OF_WEEK = [
  { id: 0, name: 'Sun', fullName: 'Sunday' },
  { id: 1, name: 'Mon', fullName: 'Monday' },
  { id: 2, name: 'Tue', fullName: 'Tuesday' },
  { id: 3, name: 'Wed', fullName: 'Wednesday' },
  { id: 4, name: 'Thu', fullName: 'Thursday' },
  { id: 5, name: 'Fri', fullName: 'Friday' },
  { id: 6, name: 'Sat', fullName: 'Saturday' },
];

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  fitness: BoltIcon,
  health: HeartIcon,
  learning: AcademicCapIcon,
  productivity: ChartBarIcon,
  creative: SparklesIcon,
  mindfulness: SparklesIcon,
  social: UserGroupIcon,
  finance: CurrencyDollarIcon,
  custom: StarIcon,
};

export default function GoalsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<GoalCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fitness',
    target_frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    target_days: [] as number[],
    target_days_of_month: [] as number[], // 1-31 for monthly
    target_time: '',
    duration_minutes: 30,
    color: '#ef4444',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const [setupRequired, setSetupRequired] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load goals
  const loadGoals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setCreateError(null);
      const { data: goalsData, error } = await goalsService.getGoals(user.id);
      
      // Check if error indicates missing tables
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        setSetupRequired(true);
      }
      
      setGoals(goalsData || []);

      // Load today's completions
      const today = new Date().toISOString().split('T')[0];
      const { data: completionsData } = await goalsService.getCompletions(user.id, undefined, today, today);
      setCompletions(completionsData || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    loadGoals();
  }, [authLoading, isAuthenticated, router, loadGoals]);

  // Load goal stats when a goal is selected
  useEffect(() => {
    if (selectedGoal && user?.id) {
      goalsService.getGoalStats(selectedGoal.id, user.id).then(({ data }) => {
        setGoalStats(data);
      });
    } else {
      setGoalStats(null);
    }
  }, [selectedGoal, user?.id]);

  // Check if a goal is completed today
  const isCompletedToday = (goalId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return completions.some(c => c.goal_id === goalId && c.completed_date === today);
  };

  // Toggle goal completion
  const toggleGoalCompletion = async (goal: Goal) => {
    if (!user?.id) return;

    const wasCompleted = isCompletedToday(goal.id);

    if (wasCompleted) {
      await goalsService.uncompleteGoal(goal.id);
      setCompletions(prev => prev.filter(c => c.goal_id !== goal.id));
    } else {
      const { data: completion } = await goalsService.completeGoal(goal.id, user.id);
      if (completion) {
        setCompletions(prev => [...prev, completion]);
        
        // Show notification
        showNotification(
          'Goal Completed!',
          `Great job completing "${goal.title}"! Keep up the momentum!`
        );
      }
    }

    // Reload goals to get updated streaks
    loadGoals();
  };

  // Create goal
  const handleCreateGoal = async () => {
    if (!user?.id || !formData.title) return;

    setCreateError(null);

    const goalData: Partial<Goal> = {
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      target_frequency: formData.target_frequency,
      target_days: formData.target_frequency === 'custom' || formData.target_frequency === 'weekly' 
                   ? formData.target_days 
                   : formData.target_frequency === 'daily' 
                     ? [0, 1, 2, 3, 4, 5, 6] 
                     : [],
      target_days_of_month: formData.target_frequency === 'monthly' ? formData.target_days_of_month : undefined,
      target_time: formData.target_time || undefined,
      duration_minutes: formData.duration_minutes,
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date || undefined,
      color: formData.color,
    };

    const { data: newGoal, error } = await goalsService.createGoal(goalData);
    
    if (error) {
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('migration')) {
        setSetupRequired(true);
        setCreateError('Database tables not set up. Please run the SQL migration in Supabase.');
      } else {
        setCreateError(error.message || 'Failed to create goal');
      }
      return;
    }
    
    if (newGoal) {
      setGoals(prev => [newGoal, ...prev]);
      setShowCreateModal(false);
      resetForm();
      
      showNotification(
        'Goal Created',
        `Your goal "${formData.title}" has been created. Let's build that consistency!`
      );
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await goalsService.deleteGoal(goalId);
    if (!error) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setSelectedGoal(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'fitness',
      target_frequency: 'daily',
      target_days: [],
      target_days_of_month: [],
      target_time: '',
      duration_minutes: 30,
      color: '#ef4444',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
  };

  // Get goals for today
  const todaysGoals = goals.filter(goal => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    
    if (goal.target_frequency === 'daily') return true;
    if (goal.target_frequency === 'monthly') {
      return goal.target_days_of_month && goal.target_days_of_month.includes(dayOfMonth);
    }
    if (goal.target_days && goal.target_days.includes(dayOfWeek)) return true;
    return false;
  });

  const completedToday = todaysGoals.filter(g => isCompletedToday(g.id)).length;
  const totalStreak = goals.reduce((sum, g) => sum + g.streak_current, 0);

  if (authLoading || isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <Sidebar 
        projects={[]} 
        onCreateProject={() => {}}
        onCollapsedChange={setIsSidebarCollapsed}
      />

      <main style={{
        flex: 1,
        marginLeft: isSidebarCollapsed ? 80 : 280,
        padding: '32px',
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <button
              onClick={() => router.push('/personal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <ArrowLeftIcon style={{ width: 16, height: 16 }} />
              Back to Personal
            </button>
          </div>

          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#111827',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            Goals
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15 }}>
            Build consistency and discipline with daily goals
          </p>
        </motion.div>

        {/* Setup Required Banner */}
        {setupRequired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <h3 style={{ color: '#fb923c', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Database Setup Required
            </h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>
              The Goals feature requires database tables to be created. Please run the SQL migration in your Supabase dashboard.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              Go to Supabase → SQL Editor → Run the contents of <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 4 }}>supabase_migrations/create_goals_tables.sql</code>
            </p>
          </motion.div>
        )}

        {/* Error Banner */}
        {createError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <XMarkIcon style={{ width: 20, height: 20, color: '#ef4444' }} />
            <p style={{ color: '#ef4444', fontSize: 14 }}>{createError}</p>
            <button
              onClick={() => setCreateError(null)}
              style={{
                marginLeft: 'auto',
                padding: '4px 8px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* Today's Progress */}
          <div style={{
            padding: 24,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircleIconSolid style={{ width: 24, height: 24, color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Today's Progress</p>
                <p style={{ color: '#111827', fontSize: 24, fontWeight: 700 }}>
                  {completedToday} / {todaysGoals.length}
                </p>
              </div>
            </div>
            <div style={{
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todaysGoals.length > 0 ? (completedToday / todaysGoals.length) * 100 : 0}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>

          {/* Total Streak */}
          <div style={{
            padding: 24,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FireIconSolid style={{ width: 24, height: 24, color: '#ef4444' }} />
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Total Streak Days</p>
                <p style={{ color: '#111827', fontSize: 24, fontWeight: 700 }}>{totalStreak}</p>
              </div>
            </div>
          </div>

          {/* Active Goals */}
          <div style={{
            padding: 24,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrophyIcon style={{ width: 24, height: 24, color: '#8b5cf6' }} />
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Active Goals</p>
                <p style={{ color: '#111827', fontSize: 24, fontWeight: 700 }}>{goals.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Create Goal Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          style={{
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)',
            border: '2px dashed rgba(251, 146, 60, 0.3)',
            borderRadius: 16,
            color: '#fb923c',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 32,
          }}
        >
          <PlusIcon style={{ width: 20, height: 20 }} />
          Create New Goal
        </motion.button>

        {/* Today's Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: '#111827', 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CalendarDaysIcon style={{ width: 24, height: 24, color: '#fb923c' }} />
            Today's Goals
          </h2>

          {todaysGoals.length === 0 ? (
            <div style={{
              padding: 48,
              textAlign: 'center',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
            }}>
              <FireIcon style={{ width: 48, height: 48, color: '#d1d5db', margin: '0 auto 16px' }} />
              <p style={{ color: '#9ca3af', fontSize: 16 }}>
                No goals scheduled for today. Create one to get started!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todaysGoals.map((goal, index) => {
                const completed = isCompletedToday(goal.id);
                const CategoryIcon = categoryIcons[goal.category] || StarIcon;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 20,
                      background: completed 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                        : '#fff',
                      border: `1px solid ${completed ? 'rgba(34, 197, 94, 0.3)' : '#e5e7eb'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedGoal(goal)}
                  >
                    {/* Completion Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGoalCompletion(goal);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: completed ? goal.color : '#f3f4f6',
                        border: `2px solid ${completed ? goal.color : '#d1d5db'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {completed && <CheckIcon style={{ width: 20, height: 20, color: '#111827' }} />}
                    </motion.button>

                    {/* Goal Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          padding: '2px 8px',
                          background: `${goal.color}20`,
                          color: goal.color,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}>
                          {goal.category}
                        </span>
                        {goal.streak_current > 0 && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            <FireIconSolid style={{ width: 12, height: 12 }} />
                            {goal.streak_current} day streak
                          </span>
                        )}
                      </div>
                      <h3 style={{ 
                        color: '#111827', 
                        fontSize: 16, 
                        fontWeight: 600,
                        textDecoration: completed ? 'line-through' : 'none',
                        opacity: completed ? 0.7 : 1,
                      }}>
                        {goal.title}
                      </h3>
                      {goal.target_time && (
                        <p style={{ 
                          color: '#9ca3af', 
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                        }}>
                          <ClockIcon style={{ width: 14, height: 14 }} />
                          {goal.target_time} • {goal.duration_minutes} min
                        </p>
                      )}
                    </div>

                    {/* Category Icon */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${goal.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CategoryIcon style={{ width: 24, height: 24, color: goal.color }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* All Goals */}
        {goals.length > todaysGoals.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 40 }}
          >
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: 16,
            }}>
              All Goals
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: 16 
            }}>
              {goals.filter(g => !todaysGoals.includes(g)).map((goal, index) => {
                const CategoryIcon = categoryIcons[goal.category] || StarIcon;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedGoal(goal)}
                    style={{
                      padding: 20,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 16,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${goal.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <CategoryIcon style={{ width: 24, height: 24, color: goal.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#111827', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                          {goal.title}
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: 12 }}>
                          {goal.target_frequency === 'daily' ? 'Every day' : 
                           goal.target_frequency === 'monthly' 
                             ? `Monthly: ${goal.target_days_of_month?.sort((a, b) => a - b).join(', ') || 'Not set'}`
                             : goal.target_days?.map(d => DAYS_OF_WEEK[d].name).join(', ')}
                        </p>
                        {goal.streak_current > 0 && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 8,
                            padding: '4px 8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 6,
                          }}>
                            <FireIconSolid style={{ width: 14, height: 14, color: '#ef4444' }} />
                            <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
                              {goal.streak_current} day streak
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 500,
                maxHeight: '90vh',
                overflow: 'auto',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 20,
                padding: 32,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ color: '#111827', fontSize: 24, fontWeight: 700 }}>Create New Goal</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <XMarkIcon style={{ width: 20, height: 20, color: '#9ca3af' }} />
                </button>
              </div>

              {/* Goal Title */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Morning Exercise"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    color: '#111827',
                    fontSize: 15,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your goal..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    color: '#111827',
                    fontSize: 15,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                  Category
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData({ ...formData, category: cat.id, color: cat.color })}
                      style={{
                        padding: '8px 16px',
                        background: formData.category === cat.id ? `${cat.color}20` : '#f9fafb',
                        border: `1px solid ${formData.category === cat.id ? cat.color : '#e5e7eb'}`,
                        borderRadius: 8,
                        color: formData.category === cat.id ? cat.color : '#6b7280',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                  Frequency
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['daily', 'weekly', 'monthly', 'custom'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFormData({ ...formData, target_frequency: freq as any, target_days: [], target_days_of_month: [] })}
                      style={{
                        flex: '1 1 auto',
                        minWidth: 80,
                        padding: '12px',
                        background: formData.target_frequency === freq ? 'rgba(251, 146, 60, 0.15)' : '#f9fafb',
                        border: `1px solid ${formData.target_frequency === freq ? '#fb923c' : '#e5e7eb'}`,
                        borderRadius: 10,
                        color: formData.target_frequency === freq ? '#ea580c' : '#6b7280',
                        fontSize: 14,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of Week Selection (for weekly/custom frequency) */}
              {(formData.target_frequency === 'weekly' || formData.target_frequency === 'custom') && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    Select Days of Week
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => {
                          const days = formData.target_days.includes(day.id)
                            ? formData.target_days.filter(d => d !== day.id)
                            : [...formData.target_days, day.id];
                          setFormData({ ...formData, target_days: days });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 4px',
                          background: formData.target_days.includes(day.id) ? 'rgba(251, 146, 60, 0.15)' : '#f9fafb',
                          border: `1px solid ${formData.target_days.includes(day.id) ? '#fb923c' : '#e5e7eb'}`,
                          borderRadius: 8,
                          color: formData.target_days.includes(day.id) ? '#ea580c' : '#6b7280',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Days of Month Selection (for monthly frequency) */}
              {formData.target_frequency === 'monthly' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    Select Days of Month
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 6,
                    maxHeight: 200,
                    overflowY: 'auto',
                    padding: 4,
                  }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          const days = formData.target_days_of_month.includes(day)
                            ? formData.target_days_of_month.filter(d => d !== day)
                            : [...formData.target_days_of_month, day];
                          setFormData({ ...formData, target_days_of_month: days });
                        }}
                        style={{
                          padding: '8px 4px',
                          background: formData.target_days_of_month.includes(day) ? 'rgba(251, 146, 60, 0.15)' : '#f9fafb',
                          border: `1px solid ${formData.target_days_of_month.includes(day) ? '#fb923c' : '#e5e7eb'}`,
                          borderRadius: 6,
                          color: formData.target_days_of_month.includes(day) ? '#ea580c' : '#6b7280',
                          fontSize: 13,
                          cursor: 'pointer',
                          fontWeight: formData.target_days_of_month.includes(day) ? 600 : 400,
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
                    Selected: {formData.target_days_of_month.length > 0 
                      ? formData.target_days_of_month.sort((a, b) => a - b).join(', ')
                      : 'None'}
                  </p>
                </div>
              )}

              {/* Date Range */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      color: '#111827',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      color: '#111827',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Time and Duration */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    Target Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.target_time}
                    onChange={(e) => setFormData({ ...formData, target_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      color: '#111827',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#4b5563', fontSize: 13, marginBottom: 8 }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                    min={5}
                    max={480}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      color: '#111827',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateGoal}
                disabled={!formData.title}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: formData.title ? 'linear-gradient(135deg, #fb923c, #f97316)' : '#e5e7eb',
                  border: 'none',
                  borderRadius: 12,
                  color: formData.title ? '#fff' : '#9ca3af',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: formData.title ? 'pointer' : 'not-allowed',
                  opacity: formData.title ? 1 : 0.5,
                }}
              >
                Create Goal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, x: 100 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 100 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 500,
                maxHeight: '90vh',
                overflow: 'auto',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 20,
                padding: 32,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${selectedGoal.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {(() => {
                      const Icon = categoryIcons[selectedGoal.category] || StarIcon;
                      return <Icon style={{ width: 28, height: 28, color: selectedGoal.color }} />;
                    })()}
                  </div>
                  <div>
                    <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 700 }}>{selectedGoal.title}</h2>
                    <span style={{
                      padding: '2px 8px',
                      background: `${selectedGoal.color}20`,
                      color: selectedGoal.color,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {selectedGoal.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGoal(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <XMarkIcon style={{ width: 20, height: 20, color: '#9ca3af' }} />
                </button>
              </div>

              {/* Streak Display */}
              <div style={{
                display: 'flex',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{
                  flex: 1,
                  padding: 20,
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 16,
                  textAlign: 'center',
                }}>
                  <FireIconSolid style={{ width: 32, height: 32, color: '#ef4444', margin: '0 auto 8px' }} />
                  <p style={{ color: '#111827', fontSize: 28, fontWeight: 700 }}>{selectedGoal.streak_current}</p>
                  <p style={{ color: '#9ca3af', fontSize: 12 }}>Current Streak</p>
                </div>
                <div style={{
                  flex: 1,
                  padding: 20,
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: 16,
                  textAlign: 'center',
                }}>
                  <TrophyIcon style={{ width: 32, height: 32, color: '#8b5cf6', margin: '0 auto 8px' }} />
                  <p style={{ color: '#111827', fontSize: 28, fontWeight: 700 }}>{selectedGoal.streak_best}</p>
                  <p style={{ color: '#9ca3af', fontSize: 12 }}>Best Streak</p>
                </div>
              </div>

              {/* Stats */}
              {goalStats && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#111827', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Statistics
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>This Week</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 100,
                          height: 6,
                          background: '#e5e7eb',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${goalStats.completion_rate_weekly}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>
                          {Math.round(goalStats.completion_rate_weekly)}%
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>This Month</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 100,
                          height: 6,
                          background: '#e5e7eb',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${goalStats.completion_rate_monthly}%`,
                            height: '100%',
                            background: '#3b82f6',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>
                          {Math.round(goalStats.completion_rate_monthly)}%
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>All Time</span>
                      <span style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>
                        {goalStats.total_completions} completions
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Info */}
              <div style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 12,
                marginBottom: 24,
              }}>
                <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Schedule</p>
                <p style={{ color: '#111827', fontSize: 15 }}>
                  {selectedGoal.target_frequency === 'daily' ? 'Every day' : 
                   selectedGoal.target_frequency === 'monthly' 
                     ? `Monthly on: ${selectedGoal.target_days_of_month?.sort((a, b) => a - b).map(d => 
                         d === 1 ? '1st' : d === 2 ? '2nd' : d === 3 ? '3rd' : `${d}th`
                       ).join(', ') || 'Not set'}`
                     : selectedGoal.target_days?.map(d => DAYS_OF_WEEK[d].fullName).join(', ')}
                </p>
                {selectedGoal.target_time && (
                  <p style={{ color: '#4b5563', fontSize: 14, marginTop: 4 }}>
                    at {selectedGoal.target_time} • {selectedGoal.duration_minutes} minutes
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleDeleteGoal(selectedGoal.id)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 12,
                    color: '#ef4444',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <TrashIcon style={{ width: 18, height: 18 }} />
                  Delete Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

