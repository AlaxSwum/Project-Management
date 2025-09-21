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
  PencilIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface WeeklyReport {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  project_id: number;
  project_name: string;
  week_number: number;
  year: number;
  week_start_date: string;
  week_end_date: string;
  date_range_display: string;
  key_activities: string;
  ongoing_tasks: string;
  challenges: string;
  team_performance: string;
  next_week_priorities: string;
  other_notes: string;
  created_at: string;
  updated_at: string;
}

interface WeekFolder {
  weekNumber: number;
  year: number;
  dateRangeDisplay: string;
  reports: WeeklyReport[];
  totalEmployees: number;
  submittedCount: number;
}

export default function WeeklyReportPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [weekFolders, setWeekFolders] = useState<WeekFolder[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    keyActivities: [''],
    ongoingTasks: [''],
    challenges: [''],
    teamPerformance: [''],
    nextWeekPriorities: [''],
    otherNotes: ''
  });
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      if (viewMode === 'user') {
        // Fetch only current user's reports
        const { data: userReports, error: reportsError } = await supabase
          .from('weekly_reports')
          .select('*')
          .eq('employee_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (reportsError) throw reportsError;
        setReports(userReports || []);
      } else {
        // For HR/admin view: Show weekly reports from accessible team members only
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
          setWeekFolders([]);
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
          setWeekFolders([]);
          return;
        }
        
        // Step 3: Fetch weekly reports only from accessible team members
        const { data: filteredReports, error: reportsError } = await supabase
          .from('weekly_reports')
          .select('*')
          .in('employee_id', accessibleMemberIds)
          .order('year', { ascending: false })
          .order('week_number', { ascending: false });
        
        if (reportsError) {
          console.error('Filtered reports fetch error:', reportsError);
          throw reportsError;
        }
        
        console.log('Admin view - Filtered reports from accessible team members:', filteredReports?.length || 0);
        console.log('Admin view - Accessible team members count:', accessibleTeamMembers.length);
        
        setReports(filteredReports || []);
        setEmployees(accessibleTeamMembers);
        
        // Organize reports by week for admin view
        organizeReportsByWeek(filteredReports || [], accessibleTeamMembers);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load weekly reports');
    } finally {
      setIsLoading(false);
    }
  };

  const organizeReportsByWeek = (allReports: WeeklyReport[], allEmployees: any[]) => {
    // Group reports by week and year
    const weekMap = new Map<string, WeeklyReport[]>();
    
    allReports.forEach(report => {
      const weekKey = `${report.year}-${report.week_number}`;
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(report);
    });
    
    // Create week folders with submission statistics
    const folders: WeekFolder[] = [];
    
    weekMap.forEach((weekReports, weekKey) => {
      const [year, weekNumber] = weekKey.split('-').map(Number);
      const sampleReport = weekReports[0];
      
      folders.push({
        weekNumber,
        year,
        dateRangeDisplay: sampleReport.date_range_display,
        reports: weekReports,
        totalEmployees: allEmployees.length,
        submittedCount: new Set(weekReports.map(r => r.employee_id)).size
      });
    });
    
    // Sort by most recent first
    folders.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
    
    setWeekFolders(folders);
  };

  const toggleWeekFolder = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleViewReport = (report: WeeklyReport) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const handleEditReport = (report: WeeklyReport) => {
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
      nextWeekPriorities: parseField(report.next_week_priorities),
      otherNotes: report.other_notes || ''
    });
    
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setEditingReport(null);
    setEditFormData({
      keyActivities: [''],
      ongoingTasks: [''],
      challenges: [''],
      teamPerformance: [''],
      nextWeekPriorities: [''],
      otherNotes: ''
    });
  };

  const updateEditField = (fieldName: keyof typeof editFormData, index: number, value: string) => {
    if (fieldName === 'otherNotes') return; // Skip for non-array fields
    
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] as string[]).map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addEditField = (fieldName: keyof typeof editFormData) => {
    if (fieldName === 'otherNotes') return; // Skip for non-array fields
    
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] as string[]), '']
    }));
  };

  const removeEditField = (fieldName: keyof typeof editFormData, index: number) => {
    if (fieldName === 'otherNotes') return; // Skip for non-array fields
    
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] as string[]).filter((_: string, i: number) => i !== index)
    }));
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReport) return;

    const keyActivitiesText = editFormData.keyActivities.filter(item => item.trim()).join('\n• ');
    if (!keyActivitiesText) {
      alert('Please fill in at least one key activity.');
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Convert arrays to formatted text
      const formatArrayField = (array: string[]) => {
        const filtered = array.filter(item => item.trim());
        return filtered.length > 0 ? '• ' + filtered.join('\n• ') : null;
      };
      
      const { error } = await supabase
        .from('weekly_reports')
        .update({
          key_activities: formatArrayField(editFormData.keyActivities),
          ongoing_tasks: formatArrayField(editFormData.ongoingTasks),
          challenges: formatArrayField(editFormData.challenges),
          team_performance: formatArrayField(editFormData.teamPerformance),
          next_week_priorities: formatArrayField(editFormData.nextWeekPriorities),
          other_notes: editFormData.otherNotes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReport.id);
      
      if (!error) {
        // Refresh data and close modal
        await fetchData();
        handleEditFormClose();
        
        alert(`Weekly report updated successfully! 
        
Your report for ${editingReport.date_range_display} has been saved.

Updated Key Activities: ${keyActivitiesText.substring(0, 100)}${keyActivitiesText.length > 100 ? '...' : ''}

Your changes are now saved in the system.`);
      } else {
        throw new Error(error.message || 'Failed to update weekly report');
      }
    } catch (error) {
      console.error('Error updating weekly report:', error);
      alert('Failed to update weekly report. Please try again.');
    }
  };

  const getMissingEmployees = (weekReports: WeeklyReport[], allEmployees: any[]) => {
    const submittedIds = new Set(weekReports.map(r => r.employee_id));
    return allEmployees.filter(emp => !submittedIds.has(emp.id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state while auth is initializing
  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #C483D9', 
            borderTop: '3px solid #5884FD', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

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
              Weekly Reports
            </h1>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                {viewMode === 'admin' ? 'Team weekly progress reports and insights' : 'Your weekly progress reports and achievements'}
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

            {viewMode === 'admin' ? (
            <>
              {/* Statistics Cards for Admin */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
              }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#111827', marginBottom: '0.5rem' }}>
                    {weekFolders.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Total Weeks</div>
                  </div>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#111827', marginBottom: '0.5rem' }}>
                    {reports.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Total Reports</div>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#111827', marginBottom: '0.5rem' }}>
                    {employees.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Team Members</div>
                </div>
              </div>

              {/* Week Folders */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                {weekFolders.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: '#9ca3af'
                  }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 2rem'
                    }}>
                      <ClipboardDocumentListIcon style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#111827', letterSpacing: '-0.01em' }}>
                      No Weekly Reports Yet
                    </h3>
                    <p style={{ fontSize: '1.1rem', margin: '0', lineHeight: '1.5' }}>
                      Weekly reports from your team will appear here when they're submitted.
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem' }}>
                    {weekFolders.map((folder) => {
                    const weekKey = `${folder.year}-${folder.weekNumber}`;
                    const isExpanded = expandedWeeks.has(weekKey);
                      const completionRate = Math.round((folder.submittedCount / folder.totalEmployees) * 100);
                    
                    return (
                        <div key={weekKey} style={{ marginBottom: '1rem' }}>
                        <div 
                          onClick={() => toggleWeekFolder(weekKey)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1.5rem',
                              background: '#111827',
                              color: '#ffffff',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              marginBottom: isExpanded ? '1rem' : '0'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1f2937';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#111827';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isExpanded ? (
                                  <ChevronDownIcon style={{ width: '20px', height: '20px' }} />
                            ) : (
                                  <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                            )}
                                <FolderIcon style={{ width: '24px', height: '24px' }} />
                              </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                Week {folder.weekNumber}, {folder.year}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                  {folder.dateRangeDisplay}
                                </div>
                            </div>
                          </div>
                          
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                {folder.submittedCount}/{folder.totalEmployees} submitted ({completionRate}%)
                              </div>
                              <div style={{
                                background: '#6b7280',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#ffffff'
                              }}>
                                {completionRate === 100 ? 'Complete' : completionRate >= 50 ? 'In Progress' : 'Pending'}
                              </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                            <div style={{
                              background: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '1.5rem'
                            }}>
                              {folder.reports.length > 0 ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                              {folder.reports.map((report) => (
                                    <div
                                      key={report.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem',
                                        background: '#ffffff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                          width: '40px',
                                          height: '40px',
                                          background: '#111827',
                                          color: '#ffffff',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: '500'
                                        }}>
                                        {report.employee_name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                          <div style={{ fontWeight: '500', color: '#111827' }}>
                                          {report.employee_name}
                                        </div>
                                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                          {report.project_name}
                                        </div>
                                      </div>
                                    </div>
                                    
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleViewReport(report)}
                                          style={{
                                            padding: '0.5rem',
                                            background: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#374151',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                          title="View report"
                                      >
                                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                                      </button>
                                        {report.employee_id === user?.id && (
                                        <button
                                          onClick={() => handleEditReport(report)}
                                            style={{
                                              padding: '0.5rem',
                                              background: '#ffffff',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              color: '#6b7280',
                                              transition: 'all 0.2s ease',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            }}
                                            title="Edit report"
                                        >
                                            <PencilIcon style={{ width: '16px', height: '16px' }} />
                                        </button>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                              ) : (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                                  No reports submitted for this week yet.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
              </>
            ) : (
            /* User View */
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
                {reports.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: '#9ca3af'
                }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem'
                  }}>
                    <ClipboardDocumentListIcon style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#111827', letterSpacing: '-0.01em' }}>
                    No Weekly Reports Yet
                            </h3>
                  <p style={{ fontSize: '1.1rem', margin: '0', lineHeight: '1.5' }}>
                    Your weekly reports will appear here once you start submitting them.
                            </p>
                          </div>
              ) : (
                <div style={{ padding: '1.5rem' }}>
                  {reports.map((report) => (
                    <div
                      key={report.id}
          style={{
            display: 'flex',
            alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        marginBottom: '1rem',
              background: '#ffffff',
                        border: '1px solid #e5e7eb',
              borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                  <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem' }}>
                          Week {report.week_number}, {report.year}
                  </div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {report.date_range_display}
                </div>
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          {report.project_name} • Submitted {formatDate(report.created_at)}
              </div>
                </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                          onClick={() => handleViewReport(report)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#111827',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                          View
              </button>
                            <button
                          onClick={() => handleEditReport(report)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#ffffff',
                            color: '#6b7280',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 