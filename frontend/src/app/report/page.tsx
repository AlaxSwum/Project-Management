'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { reportService, DailyReport, WeeklyReport, MonthlyReport, ProductivityInsight } from '@/lib/report-service';
import { goalsService, Goal } from '@/lib/goals-service';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FireIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, FireIcon as FireIconSolid } from '@heroicons/react/24/solid';

type ViewMode = 'day' | 'week' | 'month';

export default function ReportPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Load insights and goals
      const [insightsResult, goalsResult] = await Promise.all([
        reportService.getInsights(user.id),
        goalsService.getGoals(user.id),
      ]);

      setInsights(insightsResult.data);
      setGoals(goalsResult.data || []);

      // Load report based on view mode
      if (viewMode === 'day') {
        const dateStr = currentDate.toISOString().split('T')[0];
        const { data } = await reportService.getDailyReport(user.id, dateStr);
        setDailyReport(data);
      } else if (viewMode === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const { data } = await reportService.getWeeklyReport(user.id, weekStart);
        setWeeklyReport(data);
      } else if (viewMode === 'month') {
        const { data } = await reportService.getMonthlyReport(
          user.id,
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setMonthlyReport(data);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, viewMode, currentDate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, router, loadData]);

  // Navigate date
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  // Get date range label
  const getDateLabel = (): string => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return TrophyIcon;
      case 'suggestion':
        return LightBulbIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      default:
        return SparklesIcon;
    }
  };

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return '#10b981';
      case 'suggestion':
        return '#3b82f6';
      case 'warning':
        return '#f59e0b';
      default:
        return '#8b5cf6';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)' }}>
      <Sidebar 
        projects={[]} 
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
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <ArrowLeftIcon style={{ width: 16, height: 16 }} />
              Back to Personal
            </button>
          </div>

          <h1 style={{ 
            fontSize: 36, 
            fontWeight: 700, 
            color: '#fff',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <ChartBarIcon style={{ width: 40, height: 40, color: '#3b82f6' }} />
            Productivity Report
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 16 }}>
            Track your progress and stay on top of your goals
          </p>
        </motion.div>

        {/* View Mode & Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: 4,
          }}>
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '10px 20px',
                  background: viewMode === mode ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: viewMode === mode ? '#3b82f6' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigateDate('prev')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeftIcon style={{ width: 18, height: 18 }} />
            </button>

            <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
              {getDateLabel()}
            </span>

            <button
              onClick={() => navigateDate('next')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRightIcon style={{ width: 18, height: 18 }} />
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                padding: '10px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 10,
                color: '#3b82f6',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
          </div>
        </motion.div>

        {/* Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Insights
            </h2>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const color = getInsightColor(insight.type);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    style={{
                      minWidth: 280,
                      padding: 20,
                      background: `${color}10`,
                      border: `1px solid ${color}30`,
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon style={{ width: 20, height: 20, color }} />
                      </div>
                      <h3 style={{ color, fontSize: 15, fontWeight: 600 }}>{insight.title}</h3>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, lineHeight: 1.5 }}>
                      {insight.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Daily Report */}
        {viewMode === 'day' && dailyReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Productivity Score */}
            <div style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 20,
              marginBottom: 24,
              textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, marginBottom: 8 }}>
                Productivity Score
              </p>
              <div style={{ 
                fontSize: 72, 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 16,
              }}>
                {dailyReport.productivity_score}%
              </div>
              <div style={{
                width: '100%',
                maxWidth: 400,
                margin: '0 auto',
                height: 12,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyReport.productivity_score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}>
              <StatCard
                icon={CheckCircleIconSolid}
                label="Tasks Completed"
                value={dailyReport.tasks_completed}
                color="#10b981"
              />
              <StatCard
                icon={FireIconSolid}
                label="Goals Completed"
                value={`${dailyReport.goals_completed}/${dailyReport.goals_total}`}
                color="#ef4444"
              />
              <StatCard
                icon={ClockIcon}
                label="Time Blocks"
                value={`${dailyReport.time_blocks_completed}/${dailyReport.time_blocks_total}`}
                color="#3b82f6"
              />
              <StatCard
                icon={CalendarDaysIcon}
                label="Meetings"
                value={dailyReport.meetings_total}
                color="#8b5cf6"
              />
            </div>
          </motion.div>
        )}

        {/* Weekly Report */}
        {viewMode === 'week' && weeklyReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}>
              <StatCard
                icon={ChartBarIcon}
                label="Avg. Productivity"
                value={`${weeklyReport.average_productivity}%`}
                color="#3b82f6"
              />
              <StatCard
                icon={CheckCircleIconSolid}
                label="Tasks Completed"
                value={weeklyReport.total_tasks_completed}
                color="#10b981"
              />
              <StatCard
                icon={FireIconSolid}
                label="Goals Completed"
                value={weeklyReport.total_goals_completed}
                color="#ef4444"
              />
              <StatCard
                icon={CalendarDaysIcon}
                label="Meetings"
                value={weeklyReport.total_meetings}
                color="#8b5cf6"
              />
            </div>

            {/* Daily Breakdown */}
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Daily Breakdown
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 12,
            }}>
              {weeklyReport.daily_reports.map((day, index) => {
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = day.date === new Date().toISOString().split('T')[0];

                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    style={{
                      padding: 16,
                      background: isToday 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isToday ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                      borderRadius: 16,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ 
                      color: isToday ? '#3b82f6' : 'rgba(255, 255, 255, 0.6)', 
                      fontSize: 13, 
                      fontWeight: 600,
                      marginBottom: 12,
                    }}>
                      {dayName}
                    </p>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: `conic-gradient(
                        ${day.productivity_score >= 80 ? '#10b981' : day.productivity_score >= 50 ? '#f59e0b' : '#ef4444'} ${day.productivity_score * 3.6}deg,
                        rgba(255, 255, 255, 0.1) 0deg
                      )`,
                      margin: '0 auto 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#1a1a2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                          {day.productivity_score}
                        </span>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 8,
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}>
                      <span>{day.goals_completed} goals</span>
                      <span>•</span>
                      <span>{day.tasks_completed} tasks</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Monthly Report */}
        {viewMode === 'month' && monthlyReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Trend Banner */}
            <div style={{
              padding: 24,
              background: monthlyReport.trend === 'improving' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                : monthlyReport.trend === 'declining'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: `1px solid ${
                monthlyReport.trend === 'improving' ? 'rgba(16, 185, 129, 0.3)' :
                monthlyReport.trend === 'declining' ? 'rgba(239, 68, 68, 0.3)' :
                'rgba(59, 130, 246, 0.3)'
              }`,
              borderRadius: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              {monthlyReport.trend === 'improving' ? (
                <ArrowTrendingUpIcon style={{ width: 32, height: 32, color: '#10b981' }} />
              ) : monthlyReport.trend === 'declining' ? (
                <ArrowTrendingDownIcon style={{ width: 32, height: 32, color: '#ef4444' }} />
              ) : (
                <ChartBarIcon style={{ width: 32, height: 32, color: '#3b82f6' }} />
              )}
              <div>
                <h3 style={{ 
                  color: monthlyReport.trend === 'improving' ? '#10b981' :
                         monthlyReport.trend === 'declining' ? '#ef4444' : '#3b82f6',
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 4,
                }}>
                  {monthlyReport.trend === 'improving' ? 'Great Progress!' :
                   monthlyReport.trend === 'declining' ? 'Needs Attention' : 'Steady Performance'}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                  {monthlyReport.trend === 'improving' 
                    ? 'Your productivity is trending upward this month!'
                    : monthlyReport.trend === 'declining'
                    ? 'Consider adjusting your goals or schedule.'
                    : 'You\'re maintaining consistent productivity.'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}>
              <StatCard
                icon={CheckCircleIconSolid}
                label="Completion Rate"
                value={`${monthlyReport.completion_rate}%`}
                color="#10b981"
              />
              <StatCard
                icon={CheckCircleIcon}
                label="Tasks Completed"
                value={monthlyReport.total_tasks_completed}
                color="#3b82f6"
              />
              <StatCard
                icon={FireIconSolid}
                label="Goals Completed"
                value={monthlyReport.total_goals_completed}
                color="#ef4444"
              />
            </div>

            {/* Goal Streaks */}
            {monthlyReport.goal_streaks.length > 0 && (
              <>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                  Top Streaks
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {monthlyReport.goal_streaks.slice(0, 5).map((streak, index) => (
                    <motion.div
                      key={streak.goal_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 16,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ 
                          color: 'rgba(255, 255, 255, 0.4)', 
                          fontSize: 16, 
                          fontWeight: 700,
                          width: 24,
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ color: '#fff', fontSize: 15 }}>{streak.goal_title}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 8,
                      }}>
                        <FireIconSolid style={{ width: 16, height: 16, color: '#ef4444' }} />
                        <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 600 }}>
                          {streak.streak} days
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        padding: 20,
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon style={{ width: 22, height: 22, color }} />
        </div>
      </div>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>
        {value}
      </p>
    </motion.div>
  );
}

