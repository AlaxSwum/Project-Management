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
  PlusIcon
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
        // For HR/admin view: Show ALL weekly reports from ALL employees
        console.log('Admin/HR user - fetching all weekly reports and employees');
        
        // Step 1: Fetch ALL weekly reports (no filtering by projects)
        const { data: allReports, error: reportsError } = await supabase
          .from('weekly_reports')
          .select('*')
          .order('year', { ascending: false })
          .order('week_number', { ascending: false });
        
        if (reportsError) {
          console.error('All reports fetch error:', reportsError);
          throw reportsError;
        }
        
        // Step 2: Get ALL employees who have submitted reports
        const employeeIds = [...new Set(allReports?.map(report => report.employee_id) || [])];
        
        let allEmployees: any[] = [];
        if (employeeIds.length > 0) {
          const { data: employeesData, error: employeesError } = await supabase
            .from('auth_user')
            .select('id, name, email, role')
            .in('id', employeeIds);
          
          if (employeesError) {
            console.error('Employees fetch error:', employeesError);
            throw employeesError;
          }
          
          allEmployees = employeesData || [];
        }
        
        console.log('Admin view - Total reports:', allReports?.length || 0);
        console.log('Admin view - Total employees with reports:', allEmployees.length);
        
        setReports(allReports || []);
        setEmployees(allEmployees);
        
        // Organize reports by week for admin view
        organizeReportsByWeek(allReports || [], allEmployees);
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
                ? 'Monitor weekly reports from all employees across all projects'
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
                    <div className="stat-label">Total Employees</div>
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
                    <p>No weekly reports have been submitted by any employees yet.</p>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      As an admin, you can view all weekly reports from all employees across all projects.
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
                                    
                                    <button
                                      onClick={() => handleViewReport(report)}
                                      className="view-btn"
                                    >
                                      <EyeIcon style={{ width: '12px', height: '12px', marginRight: '0.25rem', display: 'inline' }} />
                                      View
                                    </button>
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
                          
                          <button
                            onClick={() => handleViewReport(report)}
                            className="view-btn"
                            style={{ padding: '0.5rem 1rem' }}
                          >
                            <EyeIcon style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                            View Report
                          </button>
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
    </div>
  );
} 