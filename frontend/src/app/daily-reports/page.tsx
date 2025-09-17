'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  UserIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon as ChevronRightIconSolid,
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface DailyReport {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  project_id: number;
  project_name: string;
  report_date: string;
  date_display: string;
  key_activities: string;
  ongoing_tasks: string;
  challenges: string;
  team_performance: string;
  next_day_priorities: string;
  meeting_minutes: string;
  has_meeting_minutes: boolean;
  other_notes: string;
  created_at: string;
  updated_at: string;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  reports: DailyReport[];
  hasMeetingMinutes: boolean;
}

export default function DailyReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    keyActivities: [''],
    ongoingTasks: [''],
    challenges: [''],
    teamPerformance: [''],
    nextDayPriorities: [''],
    meetingMinutes: '',
    otherNotes: ''
  });
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Determine view mode based on user role  
    console.log('User role detection:', { 
      user: user, 
      role: user?.role, 
      userMetadata: (user as any)?.user_metadata 
    });
    
    const userRole = user?.role || (user as any)?.user_metadata?.role;
    if (userRole === 'hr' || userRole === 'admin') {
      console.log('Setting admin view mode for role:', userRole);
      setViewMode('admin');
    } else {
      console.log('Setting user view mode for role:', userRole);
      setViewMode('user');
    }
    
    fetchData();
  }, [isAuthenticated, authLoading, router, user]);

  // Re-fetch data when view mode changes
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      console.log('View mode changed, re-fetching data. Mode:', viewMode);
      fetchData();
    }
  }, [viewMode]);

  // Generate calendar when reports or currentDate changes
  useEffect(() => {
    generateCalendar();
  }, [reports, currentDate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      if (viewMode === 'user') {
        // Fetch only current user's reports
        const { data: userReports, error: reportsError } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('employee_id', user?.id)
          .order('report_date', { ascending: false });
        
        if (reportsError) throw reportsError;
        setReports(userReports || []);
      } else {
        // For HR/admin view: Show daily reports from accessible team members only
        console.log('Admin/HR user - fetching reports from accessible team members');
        
        // Step 1: Get user's accessible projects (projects they're assigned to as members)
        const { data: userProjects, error: projectsError } = await supabase
          .from('projects_project_members')
          .select('project_id')
          .eq('user_id', user?.id);
        
        if (projectsError) {
          console.error('User projects fetch error:', projectsError);
          throw projectsError;
        }
        
        const accessibleProjectIds = userProjects?.map(p => p.project_id) || [];
        console.log('User accessible projects:', accessibleProjectIds);
        
        if (accessibleProjectIds.length === 0) {
          // User has no accessible projects, show empty state
          setReports([]);
          setEmployees([]);
          return;
        }
        
        // Step 2: Get all team members from accessible projects
        const { data: accessibleMembers, error: membersError } = await supabase
          .from('projects_project_members')
          .select(`
            user_id,
            auth_user!inner(id, name, email, role)
          `)
          .in('project_id', accessibleProjectIds);
        
        if (membersError) {
          console.error('Accessible members fetch error:', membersError);
          throw membersError;
        }
        
        // Extract unique member IDs and their info
        const accessibleMemberIds = [...new Set(accessibleMembers?.map(m => m.user_id) || [])];
        const accessibleTeamMembers = accessibleMembers?.map(m => m.auth_user).filter(Boolean) || [];
        
        console.log('Accessible team members:', accessibleMemberIds.length);
        
        if (accessibleMemberIds.length === 0) {
          // No accessible team members, show empty state
          setReports([]);
          setEmployees([]);
          return;
        }
        
        // Step 3: Fetch daily reports only from accessible team members
        const { data: filteredReports, error: reportsError } = await supabase
          .from('daily_reports')
          .select('*')
          .in('employee_id', accessibleMemberIds)
          .order('report_date', { ascending: false });
        
        if (reportsError) {
          console.error('Filtered reports fetch error:', reportsError);
          throw reportsError;
        }
        
        console.log('Admin view - Filtered reports from accessible team members:', filteredReports?.length || 0);
        console.log('Admin view - Accessible team members count:', accessibleTeamMembers.length);
        
        setReports(filteredReports || []);
        setEmployees(accessibleTeamMembers);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load daily reports');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of the calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateString = currentDateObj.toISOString().split('T')[0];
      const dayReports = reports.filter(report => report.report_date === dateString);
      const hasMeetingMinutes = dayReports.some(report => report.has_meeting_minutes);
      
      days.push({
        date: new Date(currentDateObj),
        dateString,
        isCurrentMonth: currentDateObj.getMonth() === month,
        reports: dayReports,
        hasMeetingMinutes
      });
      
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const handleViewReport = (report: DailyReport) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const handleEditReport = (report: DailyReport) => {
    setEditingReport(report);
    
    // Parse existing data into form format
    const parseField = (text: string | null) => {
      if (!text) return [''];
      // Remove bullet points and split by newlines
      const items = text.replace(/^•\s*/gm, '').split('\n').filter(item => item.trim());
      return items.length > 0 ? items : [''];
    };

    setEditFormData({
      keyActivities: parseField(report.key_activities),
      ongoingTasks: parseField(report.ongoing_tasks),
      challenges: parseField(report.challenges),
      teamPerformance: parseField(report.team_performance),
      nextDayPriorities: parseField(report.next_day_priorities),
      meetingMinutes: report.meeting_minutes || '',
      otherNotes: report.other_notes || ''
    });
    
    setShowEditForm(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />

      <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#fafafa', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '3rem',
            paddingBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#111827',
                letterSpacing: '-0.02em'
              }}>
                Daily Reports
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                {viewMode === 'admin' ? 'Team daily progress reports and meeting minutes' : 'Your daily progress reports and achievements'}
              </p>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#dc2626',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading daily reports...</p>
            </div>
          ) : (
            <div>
              {/* Calendar Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => navigateMonth('prev')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                  Previous
                </button>
                
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: '0',
                  color: '#111827'
                }}>
                  {formatDate(currentDate)}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  Next
                  <ChevronRightIconSolid style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Calendar Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: 'repeat(6, 1fr)'
                }}>
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      style={{
                        minHeight: '120px',
                        padding: '0.75rem',
                        borderRight: index % 7 !== 6 ? '1px solid #e5e7eb' : 'none',
                        borderBottom: index < 35 ? '1px solid #e5e7eb' : 'none',
                        background: !day.isCurrentMonth ? '#f9fafb' : 
                                   isToday(day.date) ? '#eff6ff' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      {/* Date Number */}
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: day.isCurrentMonth ? '500' : '400',
                        color: !day.isCurrentMonth ? '#9ca3af' : 
                               isToday(day.date) ? '#1d4ed8' : '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {day.date.getDate()}
                      </div>

                      {/* Reports Indicators */}
                      {day.reports.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {day.reports.slice(0, 3).map((report, reportIndex) => (
                            <div
                              key={reportIndex}
                              onClick={() => handleViewReport(report)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                background: '#dbeafe',
                                color: '#1e40af',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={`${report.employee_name} - ${report.project_name}`}
                            >
                              {viewMode === 'admin' ? report.employee_name : report.project_name}
                            </div>
                          ))}
                          {day.reports.length > 3 && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              textAlign: 'center'
                            }}>
                              +{day.reports.length - 3} more
                            </div>
                          )}
                        </div>
                      )}

                      {/* Meeting Minutes Indicator */}
                      {day.hasMeetingMinutes && (
                        <div 
                          title="Has meeting minutes"
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            width: '8px',
                            height: '8px',
                            background: '#10b981',
                            borderRadius: '50%'
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#dbeafe',
                    borderRadius: '4px'
                  }}></div>
                  Daily Report
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  Has Meeting Minutes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div 
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 1000
          }}
          onClick={() => setShowReportDetail(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: '0',
                color: '#111827'
              }}>
                Daily Report - {selectedReport.date_display}
              </h2>
              <button
                onClick={() => setShowReportDetail(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <strong style={{ color: '#374151' }}>Employee:</strong> {selectedReport.employee_name}
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Project:</strong> {selectedReport.project_name}
              </div>
              
              {selectedReport.key_activities && (
                <div>
                  <strong style={{ color: '#374151' }}>Key Activities:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.key_activities}
                  </div>
                </div>
              )}

              {selectedReport.ongoing_tasks && (
                <div>
                  <strong style={{ color: '#374151' }}>Ongoing Tasks:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.ongoing_tasks}
                  </div>
                </div>
              )}

              {selectedReport.challenges && (
                <div>
                  <strong style={{ color: '#374151' }}>Challenges:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.challenges}
                  </div>
                </div>
              )}

              {selectedReport.team_performance && (
                <div>
                  <strong style={{ color: '#374151' }}>Team Performance:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.team_performance}
                  </div>
                </div>
              )}

              {selectedReport.next_day_priorities && (
                <div>
                  <strong style={{ color: '#374151' }}>Tomorrow's Priorities:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.next_day_priorities}
                  </div>
                </div>
              )}

              {selectedReport.meeting_minutes && (
                <div>
                  <strong style={{ color: '#374151' }}>Meeting Minutes:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280',
                    background: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    {selectedReport.meeting_minutes}
                  </div>
                </div>
              )}

              {selectedReport.other_notes && (
                <div>
                  <strong style={{ color: '#374151' }}>Other Notes:</strong>
                  <div style={{ 
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-line',
                    color: '#6b7280'
                  }}>
                    {selectedReport.other_notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
