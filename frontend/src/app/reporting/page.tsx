'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reportingService } from '@/lib/api-compatibility';
// Icons removed for clean design;
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
    // Require authentication for project-based access control
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
      
      // Use the reporting service with project-based access control
      console.log('Fetching team reporting data for authenticated user');
      
      const reportData = await reportingService.getTeamKpiReport();
      console.log('Generated team report:', reportData);
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
      console.log('Fetching member detail for:', memberId);
      
      // Use the reporting service with project-based access control
      const memberDetail = await reportingService.getMemberDetailedReport(memberId);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
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
            background: #F5F5ED;
          }
          .reporting-container {
            min-height: 100vh;
            display: flex;
            background: #F5F5ED;
          }
          .main-content {
            flex: 1;
            margin-left: 256px;
            background: #F5F5ED;
          }
          .header {
            background: transparent;
            padding: 2rem;
            margin-bottom: 1rem;
          }
          .header-title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #1a1a1a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            letter-spacing: -0.02em;
          }
          .overview-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
            padding: 0 1rem;
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
            background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
            border: 1px solid #f0f0f0;
            border-radius: 24px;
            padding: 2.5rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }
          .overview-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .overview-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
            border-color: rgba(196, 131, 217, 0.3);
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          }
          .overview-card:hover::before {
            opacity: 1;
          }
          .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
          }
          .member-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .member-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-color: #C483D9;
          }
          .kpi-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
          }
          .kpi-stat {
            text-align: center;
            padding: 1rem;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            background: #fafafa;
            transition: all 0.2s ease;
          }
          .kpi-stat:hover {
            background: #f0f0f0;
            border-color: #C483D9;
          }
          .progress-bar {
            width: 100%;
            height: 12px;
            background: #f0f0f0;
            border-radius: 8px;
            margin-top: 0.75rem;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
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
            border: 1px solid #e8e8e8;
            border-radius: 20px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
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
              padding: 1.5rem 1rem;
              gap: 0.75rem;
              border-radius: 20px;
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
              padding: 1.25rem 0.75rem;
              border-radius: 16px;
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
              Team Reporting & KPIs
            </h1>
            <p style={{ color: '#666666', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '400', lineHeight: '1.5' }}>
              Monitor performance of team members in your accessible projects only
            </p>
          </header>

          <div style={{ padding: '2rem 3rem 3rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
            {error && (
              <div style={{ background: '#ffffff', border: '1px solid #F87239', color: '#F87239', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontWeight: '500', boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)' }}>
                {error}
              </div>
            )}

            {teamReport && (
              <>
                {/* Overview Cards */}
                <div className="overview-cards">
                  <div className="overview-card">
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '600', 
                      color: '#5884FD', 
                      lineHeight: '1',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #5884FD, #7BA3FF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {teamReport.summary.total_team_members}
                    </div>
                    <div style={{ 
                      color: '#666666', 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4'
                    }}>
                      Your Project Team Members
                    </div>
                  </div>

                  <div className="overview-card">
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '600', 
                      color: '#10B981', 
                      lineHeight: '1',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #10B981, #34D399)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {teamReport.summary.average_completion_rate}%
                    </div>
                    <div style={{ 
                      color: '#666666', 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4'
                    }}>
                      Team Completion Rate
                    </div>
                  </div>

                  <div className="overview-card">
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '600', 
                      color: '#FFB333', 
                      lineHeight: '1',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #FFB333, #FCD34D)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {teamReport.summary.total_tasks_across_team}
                    </div>
                    <div style={{ 
                      color: '#666666', 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4'
                    }}>
                      Total Tasks
                    </div>
                  </div>

                  <div className="overview-card">
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '600', 
                      color: '#C483D9', 
                      lineHeight: '1',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #C483D9, #DDA0DD)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {teamReport.summary.total_finished_tasks}
                    </div>
                    <div style={{ 
                      color: '#666666', 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4'
                    }}>
                      Completed Tasks
                    </div>
                  </div>

                  <div className="overview-card" style={{ cursor: 'pointer', border: '1px solid #F87239', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' }}
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
                         e.currentTarget.style.boxShadow = '0 8px 32px rgba(248, 114, 57, 0.3)';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = '0 2px 16px rgba(0, 0, 0, 0.04)';
                       }}>
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '600', 
                      color: '#F87239', 
                      lineHeight: '1',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #F87239, #FB923C)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {teamReport.team_report.reduce((total: number, member: any) => total + (member.overdue_tasks || 0), 0)}
                    </div>
                    <div style={{ 
                      color: '#F87239', 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4'
                    }}>
                      Team Overdue Tasks (Click to view)
                    </div>
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
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #5884FD, #C483D9)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.25rem', boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)' }}>
                            {member.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontWeight: '600', color: '#1a1a1a', margin: '0 0 0.25rem 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                              {member.user_name}
                            </h3>
                            <p style={{ color: '#666666', fontSize: '0.875rem', margin: '0', fontWeight: '500' }}>
                              {member.user_position || member.user_role}
                            </p>
                          </div>
                        </div>
                        <button 
                          style={{ 
                            padding: '0.75rem 1rem', 
                            border: '1px solid #e8e8e8', 
                            background: '#ffffff', 
                            borderRadius: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#5884FD',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberClick(member.user_id);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#5884FD';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#5884FD';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#5884FD';
                            e.currentTarget.style.borderColor = '#e8e8e8';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          }}
                        >
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '400', color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }}>
                {selectedMember.user_info.name} - Detailed Report
              </h2>
              <button
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '12px', 
                  padding: '0.75rem 1rem', 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  color: '#666666',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onClick={() => setShowDetailModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F87239';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#F87239';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#666666';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFB333', margin: '0', lineHeight: '1' }}>
                  {selectedMember.task_summary?.total_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Total Tasks</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', margin: '0', lineHeight: '1' }}>
                  {selectedMember.task_summary?.completed_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Completed</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#5884FD', margin: '0', lineHeight: '1' }}>
                  {selectedMember.task_summary?.in_progress_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>In Progress</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F87239', margin: '0', lineHeight: '1' }}>
                  {selectedMember.task_summary?.overdue_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Overdue</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', margin: '0', lineHeight: '1' }}>
                  {selectedMember.task_summary?.todo_tasks || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>To Do</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#C483D9', margin: '0', lineHeight: '1' }}>
                  {selectedMember.project_involvement?.length || 0}
                </div>
                <div style={{ color: '#666666', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Active Projects</div>
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
                        background: '#F87239',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(248, 114, 57, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e66429';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F87239';
                        e.currentTarget.style.transform = 'translateY(0)';
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
                
                <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #F87239', borderRadius: '16px', background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', boxShadow: '0 4px 16px rgba(248, 114, 57, 0.1)' }}>
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




