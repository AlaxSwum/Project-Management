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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
          }
          .weekly-report-container {
            min-height: 100vh;
            display: flex;
            background: #ffffff;
          }
          .main-content {
            flex: 1;
            margin-left: 256px;
            background: #ffffff;
          }
          .header {
            background: #ffffff;
            border-bottom: 2px solid #000000;
            padding: 1.5rem 2rem;
          }
          .header-title {
            font-size: 1.75rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .content-section {
            padding: 1.5rem 2rem;
          }
          .stats-bar {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            padding: 1rem;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
          }
          .stat-item {
            text-align: center;
            flex: 1;
          }
          .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
          }
          .stat-label {
            font-size: 0.875rem;
            color: #666666;
          }
          .week-folder {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
          }
          .week-folder-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            background: #f9fafb;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .week-folder-header:hover {
            background: #f3f4f6;
          }
          .week-folder-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .week-folder-stats {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
          }
          .submission-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          .submission-badge.complete {
            background: #d1fae5;
            color: #065f46;
          }
          .submission-badge.partial {
            background: #fef3c7;
            color: #92400e;
          }
          .submission-badge.none {
            background: #fef2f2;
            color: #991b1b;
          }
          .week-folder-content {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
            background: #ffffff;
          }
          .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .report-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.2s ease;
          }
          .report-card:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.75rem;
          }
          .employee-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .employee-avatar {
            width: 32px;
            height: 32px;
            background: #000000;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.875rem;
          }
          .view-btn {
            padding: 0.375rem 0.75rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.2s ease;
          }
          .view-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }
          .missing-section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
          }
          .missing-employees {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .missing-employee {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            font-size: 0.75rem;
            color: #991b1b;
          }
          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #666666;
          }
          .empty-state h3 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .user-reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
          }
          .user-report-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.2s ease;
          }
          .user-report-card:hover {
            border-color: #000000;
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .header {
              padding: 1rem;
            }
            
            .header-title {
              font-size: 1.5rem;
            }
            
            .content-section {
              padding: 1rem;
            }
            
            .stats-bar {
              flex-direction: column;
              gap: 0.5rem;
            }
            
            .reports-grid {
              grid-template-columns: 1fr;
            }
            
            .user-reports-grid {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />

      <div className="weekly-report-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <ClipboardDocumentListIcon style={{ width: '32px', height: '32px' }} />
              Weekly Reports
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              {viewMode === 'admin' 
                ? 'Monitor weekly reports from team members in your assigned projects'
                : 'View your submitted weekly reports'
              }
            </p>
          </header>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '2px solid #ef4444', 
              borderRadius: '8px', 
              padding: '1rem', 
              margin: '1.5rem 2rem',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <div className="content-section">
            {viewMode === 'admin' ? (
              // Admin View: Week folders with team submissions
              <>
                <div className="stats-bar">
                  <div className="stat-item">
                    <div className="stat-number">{weekFolders.length}</div>
                    <div className="stat-label">Weeks Tracked</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{employees.length}</div>
                    <div className="stat-label">Team Members</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{reports.length}</div>
                    <div className="stat-label">Total Reports</div>
                  </div>
                </div>

                {weekFolders.length === 0 ? (
                  <div className="empty-state">
                    <ClipboardDocumentListIcon style={{ width: '80px', height: '80px', color: '#e5e7eb', margin: '0 auto 1rem' }} />
                    <h3>No Weekly Reports Found</h3>
                    <p>No weekly reports have been submitted by team members in your assigned projects yet.</p>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      You can view weekly reports from team members in projects you're assigned to.
                    </div>
                  </div>
                ) : (
                  weekFolders.map((folder) => {
                    const weekKey = `${folder.year}-${folder.weekNumber}`;
                    const isExpanded = expandedWeeks.has(weekKey);
                    const completionRate = (folder.submittedCount / folder.totalEmployees) * 100;
                    
                    return (
                      <div key={weekKey} className="week-folder">
                        <div 
                          className="week-folder-header"
                          onClick={() => toggleWeekFolder(weekKey)}
                        >
                          <div className="week-folder-info">
                            {isExpanded ? (
                              <FolderOpenIcon style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                            ) : (
                              <FolderIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                            )}
                            <div>
                              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                                {folder.dateRangeDisplay}
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666666' }}>
                                Week {folder.weekNumber}, {folder.year}
                              </p>
                            </div>
                          </div>
                          
                          <div className="week-folder-stats">
                            <span className={`submission-badge ${
                              completionRate === 100 ? 'complete' : 
                              completionRate > 0 ? 'partial' : 'none'
                            }`}>
                              {completionRate === 100 ? (
                                <CheckCircleIcon style={{ width: '12px', height: '12px' }} />
                              ) : (
                                <ExclamationTriangleIcon style={{ width: '12px', height: '12px' }} />
                              )}
                              {folder.submittedCount}/{folder.totalEmployees} submitted
                            </span>
                            
                            {isExpanded ? (
                              <ChevronDownIcon style={{ width: '20px', height: '20px' }} />
                            ) : (
                              <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="week-folder-content">
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
                              Submitted Reports ({folder.reports.length})
                            </h4>
                            
                            <div className="reports-grid">
                              {folder.reports.map((report) => (
                                <div key={report.id} className="report-card">
                                  <div className="report-header">
                                    <div className="employee-info">
                                      <div className="employee-avatar">
                                        {report.employee_name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                          {report.employee_name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666666' }}>
                                          {report.project_name}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleViewReport(report)}
                                        className="view-btn"
                                      >
                                        <EyeIcon style={{ width: '12px', height: '12px', marginRight: '0.25rem', display: 'inline' }} />
                                        View
                                      </button>
                                      {(viewMode === 'admin' || report.employee_id === user?.id) && (
                                        <button
                                          onClick={() => handleEditReport(report)}
                                          className="view-btn"
                                          style={{ background: '#e5e7eb', borderColor: '#9ca3af' }}
                                        >
                                          <PencilIcon style={{ width: '12px', height: '12px', marginRight: '0.25rem', display: 'inline' }} />
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div style={{ fontSize: '0.75rem', color: '#666666' }}>
                                    Submitted: {formatDate(report.created_at)}
                                  </div>
                                  
                                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                                    {report.key_activities.substring(0, 120)}
                                    {report.key_activities.length > 120 && '...'}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {folder.submittedCount < folder.totalEmployees && (
                              <div className="missing-section">
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>
                                  Missing Submissions ({folder.totalEmployees - folder.submittedCount})
                                </h4>
                                
                                <div className="missing-employees">
                                  {getMissingEmployees(folder.reports, employees).map((employee) => (
                                    <div key={employee.id} className="missing-employee">
                                      <ExclamationTriangleIcon style={{ width: '12px', height: '12px' }} />
                                      {employee.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              // User View: Their own reports
              <>
                <div className="stats-bar">
                  <div className="stat-item">
                    <div className="stat-number">{reports.length}</div>
                    <div className="stat-label">Reports Submitted</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {reports.length > 0 ? Math.ceil((Date.now() - new Date(reports[reports.length - 1].created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0}
                    </div>
                    <div className="stat-label">Weeks Active</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {reports.length > 0 ? formatDate(reports[0].created_at) : 'N/A'}
                    </div>
                    <div className="stat-label">Latest Report</div>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div className="empty-state">
                    <ClipboardDocumentListIcon style={{ width: '80px', height: '80px', color: '#e5e7eb', margin: '0 auto 1rem' }} />
                    <h3>No Reports Submitted</h3>
                    <p>You haven't submitted any weekly reports yet. Click the + button in the sidebar to create your first report.</p>
                  </div>
                ) : (
                  <div className="user-reports-grid">
                    {reports.map((report) => (
                      <div key={report.id} className="user-report-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                              {report.date_range_display}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666666' }}>
                              {report.project_name}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleViewReport(report)}
                              className="view-btn"
                              style={{ padding: '0.5rem 1rem' }}
                            >
                              <EyeIcon style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                              View Report
                            </button>
                            <button
                              onClick={() => handleEditReport(report)}
                              className="view-btn"
                              style={{ padding: '0.5rem 1rem', background: '#e5e7eb', borderColor: '#9ca3af' }}
                            >
                              <PencilIcon style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                              Edit
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.75rem' }}>
                          Submitted: {formatDate(report.created_at)}
                        </div>
                        
                        <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                          <strong>Key Activities:</strong><br />
                          {report.key_activities.substring(0, 150)}
                          {report.key_activities.length > 150 && '...'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setShowReportDetail(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              border: '3px solid #000000',
              borderRadius: '12px',
              padding: 0,
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem 2rem',
              borderBottom: '3px solid #000000',
              background: '#000000'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0
              }}>
                Weekly Report - {selectedReport.date_range_display}
              </h2>
              <button
                onClick={() => setShowReportDetail(false)}
                style={{
                  background: '#ffffff',
                  border: '2px solid #ffffff',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#000000'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              padding: '2rem',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="employee-avatar" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                    {selectedReport.employee_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                      {selectedReport.employee_name}
                    </h3>
                    <p style={{ margin: 0, color: '#666666' }}>
                      {selectedReport.project_name} • Submitted {formatDate(selectedReport.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ lineHeight: '1.6' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Key Activities Completed
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.key_activities}
                  </p>
                </div>

                {selectedReport.ongoing_tasks && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                      Ongoing Tasks
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {selectedReport.ongoing_tasks}
                    </p>
                  </div>
                )}

                {selectedReport.challenges && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                      Challenges / Issues
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {selectedReport.challenges}
                    </p>
                  </div>
                )}

                {selectedReport.team_performance && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                      Team Performance / KPIs
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {selectedReport.team_performance}
                    </p>
                  </div>
                )}

                {selectedReport.next_week_priorities && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                      Next Week's Priorities
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {selectedReport.next_week_priorities}
                    </p>
                  </div>
                )}

                {selectedReport.other_notes && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                      Other Notes
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {selectedReport.other_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Form Modal */}
      {showEditForm && editingReport && (
        <div className="weekly-report-overlay" onClick={handleEditFormClose}>
          <div className="weekly-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="weekly-report-header">
              <h1 className="weekly-report-title">Edit Weekly Report</h1>
              <button
                onClick={handleEditFormClose}
                className="weekly-close-btn"
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="weekly-report-body">
              {/* Week Info Display */}
              <div className="week-info-banner">
                <h2 className="week-title">{editingReport.date_range_display}</h2>
                <p className="week-subtitle">Edit your weekly progress report</p>
              </div>

              {/* Weekly Report Form */}
              <form onSubmit={handleUpdateReport} className="weekly-report-form">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">Project / Team</label>
                    <div style={{ 
                      padding: '1rem 1.25rem', 
                      border: '3px solid #000000', 
                      background: '#f8f9fa', 
                      fontSize: '1rem',
                      color: '#666666'
                    }}>
                      {editingReport.project_name}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">KEY ACTIVITIES COMPLETED *</label>
                    <div className="weekly-field-container">
                      {editFormData.keyActivities.map((activity, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            required={index === 0}
                            placeholder={index === 0 ? "Main task or deliverable completed..." : "Additional activity..."}
                            value={activity}
                            onChange={(e) => updateEditField('keyActivities', index, e.target.value)}
                          />
                          {editFormData.keyActivities.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeEditField('keyActivities', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addEditField('keyActivities')}
                      >
                        Add another activity
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="weekly-label">ONGOING TASKS</label>
                    <div className="weekly-field-container">
                      {editFormData.ongoingTasks.map((task, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Task still in progress..." : "Additional task..."}
                            value={task}
                            onChange={(e) => updateEditField('ongoingTasks', index, e.target.value)}
                          />
                          {editFormData.ongoingTasks.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeEditField('ongoingTasks', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addEditField('ongoingTasks')}
                      >
                        Add task
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="weekly-label">CHALLENGES / ISSUES</label>
                    <div className="weekly-field-container">
                      {editFormData.challenges.map((challenge, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Any blocker or challenge..." : "Additional challenge..."}
                            value={challenge}
                            onChange={(e) => updateEditField('challenges', index, e.target.value)}
                          />
                          {editFormData.challenges.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeEditField('challenges', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addEditField('challenges')}
                      >
                        Add challenge
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="weekly-label">TEAM PERFORMANCE / KPIs</label>
                    <div className="weekly-field-container">
                      {editFormData.teamPerformance.map((performance, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Metrics or performance indicator..." : "Additional KPI..."}
                            value={performance}
                            onChange={(e) => updateEditField('teamPerformance', index, e.target.value)}
                          />
                          {editFormData.teamPerformance.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeEditField('teamPerformance', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addEditField('teamPerformance')}
                      >
                        Add KPI
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="weekly-label">NEXT WEEK'S PRIORITIES</label>
                    <div className="weekly-field-container">
                      {editFormData.nextWeekPriorities.map((priority, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Priority for upcoming week..." : "Additional priority..."}
                            value={priority}
                            onChange={(e) => updateEditField('nextWeekPriorities', index, e.target.value)}
                          />
                          {editFormData.nextWeekPriorities.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeEditField('nextWeekPriorities', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addEditField('nextWeekPriorities')}
                      >
                        Add priority
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">OTHER NOTES</label>
                    <textarea
                      className="weekly-textarea"
                      placeholder="Additional observations, suggestions, or miscellaneous notes..."
                      value={editFormData.otherNotes}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        otherNotes: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="weekly-form-buttons">
                  <button
                    type="button"
                    onClick={handleEditFormClose}
                    className="weekly-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="weekly-btn-submit"
                  >
                    Update Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Styles for Edit Form */}
      <style jsx>{`
        .weekly-report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .weekly-report-modal {
          background: #ffffff;
          border: 3px solid #000000;
          border-radius: 0;
          width: 100%;
          max-width: 1200px;
          max-height: 95vh;
          overflow: hidden;
          box-shadow: 8px 8px 0px #000000;
          display: flex;
          flex-direction: column;
        }
        
        .weekly-report-header {
          background: #000000;
          color: #ffffff;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #000000;
        }
        
        .weekly-report-title {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
          letter-spacing: -0.025em;
        }
        
        .weekly-close-btn {
          background: #ffffff;
          color: #000000;
          border: 2px solid #ffffff;
          width: 40px;
          height: 40px;
          border-radius: 0;
          cursor: pointer;
          font-size: 24px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .weekly-close-btn:hover {
          background: #f5f5f5;
          transform: scale(1.1);
        }
        
        .weekly-report-body {
          padding: 2rem 3rem 3rem 3rem;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: #ffffff;
          scroll-behavior: smooth;
        }
        
        .week-info-banner {
          background: #f8f9fa;
          border: 3px solid #000000;
          padding: 2rem;
          text-align: center;
          margin-bottom: 3rem;
          border-radius: 0;
        }
        
        .week-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #000000;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }
        
        .week-subtitle {
          font-size: 1rem;
          color: #666666;
          margin: 0;
        }
        
        .weekly-report-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding-bottom: 2rem;
        }
        
        .form-row {
          display: flex;
          gap: 2rem;
          width: 100%;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group.full-width {
          flex: 1;
        }
        
        .form-group.half-width {
          flex: 1;
        }
        
        .weekly-label {
          font-size: 0.9rem;
          font-weight: bold;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
          padding-bottom: 0.5rem;
        }
        
        .weekly-field-container {
          background: #ffffff;
          border: 3px solid #000000;
          padding: 1.5rem;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .weekly-field-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .weekly-input {
          flex: 1;
          padding: 0.875rem 1.125rem;
          border: 2px solid #000000;
          border-radius: 0;
          font-size: 0.95rem;
          background: #ffffff;
          color: #000000;
          transition: all 0.2s ease;
        }
        
        .weekly-input:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 2px 2px 0px #e5e5e5;
        }
        
        .weekly-input::placeholder {
          color: #888888;
        }
        
        .weekly-remove-btn {
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
          width: 32px;
          height: 32px;
          border-radius: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .weekly-remove-btn:hover {
          background: #f5f5f5;
          transform: scale(1.1);
        }
        
        .weekly-add-btn {
          background: #f8f9fa;
          color: #000000;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 0.75rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          align-self: flex-start;
        }
        
        .weekly-add-btn:hover {
          background: #e9ecef;
          transform: translateY(-2px);
          box-shadow: 2px 2px 0px #000000;
        }
        
        .weekly-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem 1.25rem;
          border: 3px solid #000000;
          border-radius: 0;
          font-size: 0.95rem;
          background: #ffffff;
          color: #000000;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: all 0.2s ease;
        }
        
        .weekly-textarea:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 4px 4px 0px #e5e5e5;
        }
        
        .weekly-textarea::placeholder {
          color: #888888;
        }
        
        .weekly-form-buttons {
          display: flex;
          gap: 1.5rem;
          justify-content: flex-end;
          padding: 2rem 0 1rem 0;
          margin-top: 2rem;
          border-top: 2px solid #e5e5e5;
        }
        
        .weekly-btn-cancel {
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .weekly-btn-cancel:hover {
          background: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 3px 3px 0px #000000;
        }
        
        .weekly-btn-submit {
          background: #000000;
          color: #ffffff;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .weekly-btn-submit:hover {
          background: #333333;
          transform: translateY(-2px);
          box-shadow: 3px 3px 0px #666666;
        }
        
        @media (max-width: 768px) {
          .weekly-report-overlay {
            padding: 1rem;
          }
          
          .weekly-report-modal {
            max-width: 100%;
            max-height: 98vh;
          }
          
          .weekly-report-header {
            padding: 1.5rem;
          }
          
          .weekly-report-title {
            font-size: 1.5rem;
          }
          
          .weekly-report-body {
            padding: 1.5rem;
          }
          
          .form-row {
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .weekly-form-buttons {
            flex-direction: column;
            gap: 1rem;
          }
          
          .weekly-btn-cancel,
          .weekly-btn-submit {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
} 