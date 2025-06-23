'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reportingService } from '@/lib/api-compatibility';
import {
  EyeIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function ReportingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [teamReport, setTeamReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchReportingData();
  }, [isAuthenticated, authLoading, router]);

  const fetchReportingData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Check if user is HR/admin
      const userRole = user?.role || (user as any)?.user_metadata?.role;
      if (userRole !== 'hr' && userRole !== 'admin') {
        setError('Access denied: You need HR or Admin privileges to view team reports');
        return;
      }
      
      // Step 1: Get projects that the current HR/admin user is a member of
      const { data: currentUserProjects, error: userProjectsError } = await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', user?.id);
      
      if (userProjectsError) {
        console.error('User projects fetch error:', userProjectsError);
        throw userProjectsError;
      }
      
      console.log('HR/Admin user is member of projects:', currentUserProjects?.map(p => p.project_id) || []);
      
      if (!currentUserProjects || currentUserProjects.length === 0) {
        // HR/admin user is not assigned to any projects, show empty state
        console.log('HR/Admin user has no project assignments, showing empty data');
        setTeamReport({
          summary: {
            total_team_members: 0,
            average_completion_rate: 0,
            total_tasks_across_team: 0,
            total_finished_tasks: 0
          },
          team_report: []
        });
        return;
      }
      
      const adminProjectIds = currentUserProjects.map(p => p.project_id);
      
      // Step 2: Get all employees who are members of the same projects
      const { data: sharedProjectMembers, error: membersError } = await supabase
        .from('projects_project_members')
        .select(`
          user_id,
          auth_user:user_id (
            id,
            name,
            email,
            role
          )
        `)
        .in('project_id', adminProjectIds);
      
      if (membersError) {
        console.error('Shared project members fetch error:', membersError);
        throw membersError;
      }
      
      // Extract unique employee IDs
      const sharedEmployeeIds = new Set();
      const employeeData = new Map();
      
      sharedProjectMembers?.forEach((member: any) => {
        if (member.auth_user && !sharedEmployeeIds.has(member.user_id)) {
          sharedEmployeeIds.add(member.user_id);
          employeeData.set(member.user_id, member.auth_user);
        }
      });
      
      console.log('Employees sharing projects with HR/Admin:', sharedEmployeeIds.size);
      
      if (sharedEmployeeIds.size === 0) {
        // No shared employees found
        console.log('No employees found sharing projects with HR/Admin user');
        setTeamReport({
          summary: {
            total_team_members: 0,
            average_completion_rate: 0,
            total_tasks_across_team: 0,
            total_finished_tasks: 0
          },
          team_report: []
        });
        return;
      }
      
      // Step 3: Fetch tasks data for shared employees only
      const { data: tasksData, error: tasksError } = await supabase
        .from('projects_task')
        .select(`
          id,
          assignee_id,
          status,
          due_date,
          created_at,
          name,
          description,
          priority,
          project_id,
          projects_project:project_id (
            id,
            name
          )
        `)
        .in('assignee_id', Array.from(sharedEmployeeIds));
      
      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
        throw tasksError;
      }
      
      // Step 4: Calculate KPIs for each employee
      const teamReportData = [];
      let totalTasks = 0;
      let totalFinishedTasks = 0;
      let totalCompletionRates = 0;
      
      for (const employeeId of sharedEmployeeIds) {
        const employee = employeeData.get(employeeId);
        const employeeTasks = tasksData?.filter(task => task.assignee_id === employeeId) || [];
        
        const finishedTasks = employeeTasks.filter(task => task.status === 'completed').length;
        const unfinishedTasks = employeeTasks.filter(task => task.status !== 'completed').length;
        const overdueTasks = employeeTasks.filter(task => {
          if (task.status === 'completed') return false;
          if (!task.due_date) return false;
          return new Date(task.due_date) < new Date();
        }).length;
        
        const activeProjects = new Set(employeeTasks.map(task => task.project_id)).size;
        const completionRate = employeeTasks.length > 0 ? Math.round((finishedTasks / employeeTasks.length) * 100) : 0;
        
        totalTasks += employeeTasks.length;
        totalFinishedTasks += finishedTasks;
        totalCompletionRates += completionRate;
        
        teamReportData.push({
          user_id: employeeId,
          user_name: employee.name,
          user_role: employee.role,
          user_position: employee.role,
          finished_tasks: finishedTasks,
          unfinished_tasks: unfinishedTasks,
          overdue_tasks: overdueTasks,
          active_projects: activeProjects,
          completion_rate: completionRate
        });
      }
      
      const averageCompletionRate = sharedEmployeeIds.size > 0 ? Math.round(totalCompletionRates / sharedEmployeeIds.size) : 0;
      
      const reportData = {
        summary: {
          total_team_members: sharedEmployeeIds.size,
          average_completion_rate: averageCompletionRate,
          total_tasks_across_team: totalTasks,
          total_finished_tasks: totalFinishedTasks
        },
        team_report: teamReportData
      };
      
      console.log('Generated team report for shared project members:', reportData);
      setTeamReport(reportData);
      
    } catch (err: any) {
      setError('Failed to fetch reporting data');
      console.error('Reporting error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberClick = async (memberId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Verify the member is in shared projects with current user
      const { data: currentUserProjects, error: userProjectsError } = await supabase
        .from('projects_project_members')
        .select(`
          project_id,
          projects_project:project_id (
            id,
            name
          )
        `)
        .eq('user_id', user?.id);
      
      if (userProjectsError || !currentUserProjects) {
        setError('Failed to verify project access');
        return;
      }
      
      const adminProjectIds = currentUserProjects.map(p => p.project_id);
      
      // Check if member is in any shared projects
      const { data: memberProjects, error: memberProjectsError } = await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', memberId)
        .in('project_id', adminProjectIds);
      
      if (memberProjectsError || !memberProjects || memberProjects.length === 0) {
        setError('Access denied: This member is not in your shared projects');
        return;
      }
      
      // Fetch member basic info
      const { data: memberInfo, error: memberError } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .eq('id', memberId)
        .single();
      
      if (memberError) {
        console.error('Member info fetch error:', memberError);
        throw memberError;
      }
      
      // Fetch member's tasks from shared projects only
      const { data: memberTasks, error: tasksError } = await supabase
        .from('projects_task')
        .select(`
          id,
          name,
          description,
          status,
          priority,
          due_date,
          created_at,
          project_id,
          projects_project:project_id (
            id,
            name
          )
        `)
        .eq('assignee_id', memberId)
        .in('project_id', adminProjectIds);
      
      if (tasksError) {
        console.error('Member tasks fetch error:', tasksError);
        throw tasksError;
      }
      
      // Calculate task summary
      const totalTasks = memberTasks?.length || 0;
      const completedTasks = memberTasks?.filter(task => task.status === 'completed').length || 0;
      const inProgressTasks = memberTasks?.filter(task => task.status === 'in_progress').length || 0;
      const todoTasks = memberTasks?.filter(task => task.status === 'todo').length || 0;
      const overdueTasks = memberTasks?.filter(task => {
        if (task.status === 'completed') return false;
        if (!task.due_date) return false;
        return new Date(task.due_date) < new Date();
      }) || [];
      
      // Get project involvement
      const projectInvolvement = memberProjects.map(mp => {
        const project = currentUserProjects.find(p => p.project_id === mp.project_id);
        return { project_id: mp.project_id, project_name: project?.projects_project?.[0]?.name || 'Unknown' };
      });
      
      // Prepare overdue task details
      const overdueTaskDetails = overdueTasks.map(task => ({
        name: task.name,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        project_name: task.projects_project?.name || 'Unknown',
        days_overdue: Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
      }));
      
      const memberDetail = {
        user_info: {
          id: memberInfo.id,
          name: memberInfo.name,
          email: memberInfo.email,
          role: memberInfo.role
        },
        task_summary: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          todo_tasks: todoTasks,
          overdue_tasks: overdueTasks.length
        },
        project_involvement: projectInvolvement,
        overdue_task_details: overdueTaskDetails
      };
      
      console.log('Generated member detail report:', memberDetail);
      setSelectedMember(memberDetail);
      setShowDetailModal(true);
      
    } catch (err: any) {
      setError('Failed to fetch member details');
      console.error('Member detail error:', err);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    if (rate >= 40) return '#ef4444';
    return '#6b7280';
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
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
          .reporting-container {
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
          .overview-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          /* Large screens - 5 columns for better spacing */
          @media (min-width: 1400px) {
            .overview-cards {
              grid-template-columns: repeat(5, 1fr);
              gap: 2rem;
            }
          }
          
          /* Medium screens - 3 columns */
          @media (max-width: 1024px) and (min-width: 769px) {
            .overview-cards {
              grid-template-columns: repeat(3, 1fr);
              gap: 1.25rem;
            }
          }
          .overview-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
          }
          .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
          }
          .member-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .member-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .kpi-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
          }
          .kpi-stat {
            text-align: center;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #f9fafb;
          }
          .progress-bar {
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border: 1px solid #000000;
            margin-top: 0.5rem;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 2rem;
          }
          /* Mobile Responsive Styles */
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
            
            .team-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .overview-cards {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }
            
            .overview-card {
              padding: 1rem;
              gap: 0.5rem;
            }
            
            .kpi-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            
            .member-card {
              padding: 1rem;
            }
            
            .modal-content {
              max-width: 95vw;
              padding: 1rem;
              margin: 0.5rem;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            
            .header-title {
              font-size: 1.25rem;
              flex-direction: column;
              gap: 0.5rem;
              text-align: center;
            }
            
            .overview-cards {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .overview-card {
              padding: 0.75rem;
            }
            
            .team-grid {
              gap: 0.75rem;
            }
            
            .member-card {
              padding: 0.75rem;
            }
            
            .kpi-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            
            .kpi-stat {
              padding: 0.5rem;
            }
            
            .modal-content {
              max-width: 98vw;
              padding: 0.75rem;
              margin: 0.25rem;
            }
          }
          `
        }} />

      <div className="reporting-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <DocumentChartBarIcon style={{ width: '32px', height: '32px' }} />
              Team Reporting & KPIs
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              Monitor performance of team members from your shared projects
            </p>
          </header>

          <div style={{ padding: '2rem' }}>
            {error && (
              <div style={{ background: '#ffffff', border: '2px solid #ef4444', color: '#dc2626', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            {teamReport && (
              <>
                {/* Overview Cards */}
                <div className="overview-cards">
                  <div className="overview-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000000' }}>
                      {teamReport.summary.total_team_members}
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Shared Project Members</div>
                  </div>

                  <div className="overview-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000000' }}>
                      {teamReport.summary.average_completion_rate}%
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Team Completion Rate</div>
                  </div>

                  <div className="overview-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000000' }}>
                      {teamReport.summary.total_tasks_across_team}
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Total Tasks</div>
                  </div>

                  <div className="overview-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000000' }}>
                      {teamReport.summary.total_finished_tasks}
                    </div>
                    <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Completed Tasks</div>
                  </div>

                  <div className="overview-card" style={{ cursor: 'pointer', border: '2px solid #ef4444', background: '#fef2f2' }}
                       onClick={() => {
                         const overdueMembers = teamReport.team_report.filter((member: any) => member.overdue_tasks > 0);
                         if (overdueMembers.length > 0) {
                           const overdueDetails = overdueMembers.map((member: any) => 
                             `${member.user_name}: ${member.overdue_tasks} overdue tasks`
                           ).join('\n');
                           alert(`Team Overdue Tasks:\n\n${overdueDetails}\n\nClick on individual team members below to see specific overdue tasks.`);
                         }
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.transform = 'translateY(-2px)';
                         e.currentTarget.style.boxShadow = '4px 4px 0px #ef4444';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = 'none';
                       }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                      {teamReport.team_report.reduce((total: number, member: any) => total + (member.overdue_tasks || 0), 0)}
                    </div>
                    <div style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: '600' }}>Team Overdue Tasks (Click to view)</div>
                  </div>
                </div>

                {/* Team Members Grid */}
                <div className="team-grid">
                  {teamReport.team_report.map((member: any) => (
                    <div
                      key={member.user_id}
                      className="member-card"
                      onClick={() => handleMemberClick(member.user_id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {member.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontWeight: '600', color: '#000000', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                              {member.user_name}
                            </h3>
                            <p style={{ color: '#666666', fontSize: '0.875rem', margin: '0' }}>
                              {member.user_position || member.user_role}
                            </p>
                          </div>
                        </div>
                        <button 
                          style={{ padding: '0.5rem', border: '2px solid #000000', background: '#ffffff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberClick(member.user_id);
                          }}
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                          View Details
                        </button>
                      </div>

                      <div className="kpi-stats">
                        <div className="kpi-stat">
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '0' }}>
                            {member.finished_tasks}
                          </div>
                          <div style={{ color: '#666666', fontSize: '0.75rem', margin: '0.25rem 0 0 0', textTransform: 'uppercase' }}>
                            Finished Tasks
                          </div>
                        </div>
                        <div className="kpi-stat">
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', margin: '0' }}>
                            {member.unfinished_tasks}
                          </div>
                          <div style={{ color: '#666666', fontSize: '0.75rem', margin: '0.25rem 0 0 0', textTransform: 'uppercase' }}>
                            Unfinished Tasks
                          </div>
                        </div>
                        <div className="kpi-stat" style={{ cursor: member.overdue_tasks > 0 ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
                             onClick={(e) => {
                               if (member.overdue_tasks > 0) {
                                 e.stopPropagation();
                                 handleMemberClick(member.user_id);
                               }
                             }}
                             onMouseOver={(e) => {
                               if (member.overdue_tasks > 0) {
                                 e.currentTarget.style.backgroundColor = '#fef2f2';
                                 e.currentTarget.style.borderColor = '#ef4444';
                               }
                             }}
                             onMouseOut={(e) => {
                               e.currentTarget.style.backgroundColor = '#f9fafb';
                               e.currentTarget.style.borderColor = '#e5e7eb';
                             }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', margin: '0' }}>
                            {member.overdue_tasks}
                          </div>
                          <div style={{ color: '#666666', fontSize: '0.75rem', margin: '0.25rem 0 0 0', textTransform: 'uppercase' }}>
                            Overdue Tasks {member.overdue_tasks > 0 && '(Click to view)'}
                          </div>
                        </div>
                        <div className="kpi-stat">
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', margin: '0' }}>
                            {member.active_projects}
                          </div>
                          <div style={{ color: '#666666', fontSize: '0.75rem', margin: '0.25rem 0 0 0', textTransform: 'uppercase' }}>
                            Active Projects
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Completion Rate</span>
                        <span style={{ fontWeight: '600', fontSize: '1.1rem', color: getPerformanceColor(member.completion_rate) }}>
                          {member.completion_rate}%
                        </span>
                      </div>
                                             <div className="progress-bar">
                         <div
                           style={{
                             height: '100%',
                             width: `${member.completion_rate}%`,
                             backgroundColor: getPerformanceColor(member.completion_rate),
                             transition: 'width 0.3s ease'
                           }}
                         />
                       </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000', margin: '0' }}>
                {selectedMember.user_info.name} - Detailed Report
              </h2>
              <button
                style={{ background: '#ffffff', border: '2px solid #000000', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', fontWeight: '600' }}
                onClick={() => setShowDetailModal(false)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000000', margin: '0' }}>
                  {selectedMember.task_summary?.total_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Total Tasks</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', margin: '0' }}>
                  {selectedMember.task_summary?.completed_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Completed</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6', margin: '0' }}>
                  {selectedMember.task_summary?.in_progress_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>In Progress</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', margin: '0' }}>
                  {selectedMember.task_summary?.overdue_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Overdue</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b', margin: '0' }}>
                  {selectedMember.task_summary?.todo_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>To Do</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6', margin: '0' }}>
                  {selectedMember.project_involvement?.length || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Active Projects</div>
              </div>
            </div>

            {/* Overdue Tasks Section */}
            {selectedMember.overdue_task_details && selectedMember.overdue_task_details.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0', color: '#ef4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    ⚠️ Overdue Tasks ({selectedMember.overdue_task_details.length})
                  </h3>
                  {selectedMember.overdue_task_details.length > 5 && (
                    <button
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        const allOverdueTasks = selectedMember.overdue_task_details;
                        alert(`All ${allOverdueTasks.length} overdue tasks:\n\n${allOverdueTasks.map((task: any, i: number) => 
                          `${i+1}. ${task.name} (Due: ${task.due_date})`
                        ).join('\n')}`);
                      }}
                    >
                      View All {selectedMember.overdue_task_details.length} Tasks
                    </button>
                  )}
                </div>
                
                <div style={{ maxHeight: '300px', overflow: 'auto', border: '2px solid #ef4444', borderRadius: '6px', background: '#fef2f2' }}>
                  {selectedMember.overdue_task_details.slice(0, 5).map((task: any, index: number) => (
                    <div 
                      key={index} 
                      style={{ 
                        padding: '1rem', 
                        borderBottom: index < Math.min(4, selectedMember.overdue_task_details.length - 1) ? '1px solid #fecaca' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => {
                        alert(`Task Details:\n\nName: ${task.name}\nDescription: ${task.description || 'No description'}\nDue Date: ${task.due_date}\nPriority: ${task.priority || 'Not set'}\nProject: ${task.project_name || 'Unknown'}\n\nDays Overdue: ${task.days_overdue}`);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#dc2626', fontSize: '1rem' }}>{task.name}</strong>
                        <span style={{ 
                          background: '#dc2626', 
                          color: '#ffffff', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {task.days_overdue} days overdue
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                        <strong>Due:</strong> {new Date(task.due_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
                        <span><strong>Priority:</strong> {task.priority || 'Not set'}</span>
                        <span><strong>Project:</strong> {task.project_name}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: '0.5rem', textAlign: 'right' }}>
                        Click for full details
                      </div>
                    </div>
                  ))}
                  
                  {selectedMember.overdue_task_details.length > 5 && (
                    <div style={{ padding: '1rem', textAlign: 'center', background: '#fee2e2', borderTop: '1px solid #fecaca' }}>
                      <span style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: '500' }}>
                        Showing 5 of {selectedMember.overdue_task_details.length} overdue tasks
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
