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
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [projectReports, setProjectReports] = useState<{[key: number]: {[key: string]: DailyReport[]}}>({});

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

  // Organize reports when data changes
  useEffect(() => {
    organizeReportsByProject();
  }, [reports]);

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

  const organizeReportsByProject = () => {
    const organized: {[key: number]: {[key: string]: DailyReport[]}} = {};
    
    reports.forEach(report => {
      const projectId = report.project_id || 0;
      const dateKey = report.report_date;
      
      if (!organized[projectId]) {
        organized[projectId] = {};
      }
      
      if (!organized[projectId][dateKey]) {
        organized[projectId][dateKey] = [];
      }
      
      organized[projectId][dateKey].push(report);
    });
    
    // Sort reports within each day by employee name
    Object.keys(organized).forEach(projectId => {
      Object.keys(organized[Number(projectId)]).forEach(dateKey => {
        organized[Number(projectId)][dateKey].sort((a, b) => 
          a.employee_name.localeCompare(b.employee_name)
        );
      });
    });
    
    setProjectReports(organized);
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


  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };


  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleDay = (projectId: number, dateKey: string) => {
    const dayKey = `${projectId}-${dateKey}`;
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const formatDateKey = (dateKey: string) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const getProjectName = (projectId: number) => {
    const report = reports.find(r => r.project_id === projectId);
    return report?.project_name || `Project ${projectId}`;
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

        <div className="page-main" style={{ 
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
                {viewMode === 'admin' ? 'Team daily progress reports organized by project and date' : 'Your daily progress reports organized by project and date'}
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
            /* Hierarchical Project View */
            <div>
              {Object.keys(projectReports).length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <DocumentTextIcon style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 1rem',
                    color: '#d1d5db'
                  }} />
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                    No daily reports found
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: '0' }}>
                    Use the "Daily Report Form" to submit your first daily report.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(projectReports).map(projectIdStr => {
                    const projectId = Number(projectIdStr);
                    const projectData = projectReports[projectId];
                    const projectName = getProjectName(projectId);
                    const isProjectExpanded = expandedProjects.has(projectId);
                    
                    // Count total reports and days for this project
                    const totalDays = Object.keys(projectData).length;
                    const totalReports = Object.values(projectData).reduce((sum, dayReports) => sum + dayReports.length, 0);
                    const hasMeetingMinutes = Object.values(projectData).some(dayReports => 
                      dayReports.some(report => report.has_meeting_minutes)
                    );
                    
                    return (
                      <div key={projectId} style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                      }}>
                        {/* Project Header */}
                        <div
                          onClick={() => toggleProject(projectId)}
                          style={{
                            background: '#f9fafb',
                            padding: '1.5rem',
                            borderBottom: isProjectExpanded ? '1px solid #e5e7eb' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              background: '#3b82f6',
                              color: '#ffffff',
                              borderRadius: '8px',
                              padding: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FolderIcon style={{ width: '20px', height: '20px' }} />
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                margin: '0',
                                color: '#111827'
                              }}>
                                {projectName}
                              </h3>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                margin: '0.25rem 0 0 0'
                              }}>
                                {totalReports} report{totalReports !== 1 ? 's' : ''} across {totalDays} day{totalDays !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {hasMeetingMinutes && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#f0fdf4',
                                color: '#166534',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  background: '#10b981',
                                  borderRadius: '50%'
                                }}></div>
                                Meetings
                              </div>
                            )}
                            {isProjectExpanded ? (
                              <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            ) : (
                              <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            )}
                          </div>
                        </div>

                        {/* Project Content - Days */}
                        {isProjectExpanded && (
                          <div style={{ padding: '1rem' }}>
                            {Object.keys(projectData).sort().reverse().map(dateKey => {
                              const dayReports = projectData[dateKey];
                              const dayKey = `${projectId}-${dateKey}`;
                              const isDayExpanded = expandedDays.has(dayKey);
                              const dayHasMeetingMinutes = dayReports.some(report => report.has_meeting_minutes);
                              
                              return (
                                <div key={dateKey} style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  marginBottom: '0.75rem',
                                  overflow: 'hidden'
                                }}>
                                  {/* Day Header */}
                                  <div
                                    onClick={() => toggleDay(projectId, dateKey)}
                                    style={{
                                      background: '#ffffff',
                                      padding: '1rem',
                                      borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#ffffff';
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: '6px',
                                        padding: '0.375rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        <CalendarIcon style={{ width: '16px', height: '16px' }} />
                                      </div>
                                      <div>
                                        <h4 style={{
                                          fontSize: '1rem',
                                          fontWeight: '600',
                                          margin: '0',
                                          color: '#111827'
                                        }}>
                                          {formatDateKey(dateKey)}
                                        </h4>
                                        <p style={{
                                          fontSize: '0.75rem',
                                          color: '#6b7280',
                                          margin: '0.125rem 0 0 0'
                                        }}>
                                          {dayReports.length} report{dayReports.length !== 1 ? 's' : ''} submitted
                                        </p>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {dayHasMeetingMinutes && (
                                        <div style={{
                                          width: '8px',
                                          height: '8px',
                                          background: '#10b981',
                                          borderRadius: '50%'
                                        }}></div>
                                      )}
                                      {isDayExpanded ? (
                                        <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                                      ) : (
                                        <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                                      )}
                                    </div>
                                  </div>

                                  {/* Day Content - User Reports */}
                                  {isDayExpanded && (
                                    <div style={{ padding: '1rem', background: '#fafafa' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {dayReports.map((report, index) => (
                                          <div
                                            key={report.id}
                                            onClick={() => handleViewReport(report)}
                                            style={{
                                              background: '#ffffff',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '6px',
                                              padding: '1rem',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.borderColor = '#3b82f6';
                                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.borderColor = '#e5e7eb';
                                              e.currentTarget.style.boxShadow = 'none';
                                            }}
                                          >
                                            <div style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'flex-start',
                                              marginBottom: '0.75rem'
                                            }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                  background: '#f3f4f6',
                                                  color: '#374151',
                                                  borderRadius: '4px',
                                                  padding: '0.25rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}>
                                                  <UserIcon style={{ width: '14px', height: '14px' }} />
                                                </div>
                                                <div>
                                                  <h5 style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    margin: '0',
                                                    color: '#111827'
                                                  }}>
                                                    {report.employee_name}
                                                  </h5>
                                                  <p style={{
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    margin: '0'
                                                  }}>
                                                    {report.employee_email}
                                                  </p>
                                                </div>
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {report.has_meeting_minutes && (
                                                  <div 
                                                    title="Has meeting minutes"
                                                    style={{
                                                      width: '6px',
                                                      height: '6px',
                                                      background: '#10b981',
                                                      borderRadius: '50%'
                                                    }}
                                                  ></div>
                                                )}
                                                <EyeIcon style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                                              </div>
                                            </div>
                                            
                                            {/* Key Activities Preview */}
                                            {report.key_activities && (
                                              <div>
                                                <p style={{
                                                  fontSize: '0.75rem',
                                                  color: '#6b7280',
                                                  margin: '0',
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 2,
                                                  WebkitBoxOrient: 'vertical',
                                                  overflow: 'hidden',
                                                  lineHeight: '1.4'
                                                }}>
                                                  {report.key_activities.replace(/^•\s*/gm, '').replace(/\n/g, ' ')}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
