'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function EmployeeAbsentPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Check if user is HR or admin
    if (user?.role !== 'hr' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchLeaveRequests();
  }, [isAuthenticated, authLoading, router, user]);

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - replace with actual API call when backend is ready
      const mockLeaveRequests = [
        {
          id: 1,
          employee_name: 'John Doe',
          employee_email: 'john.doe@company.com',
          project_name: 'Website Redesign',
          start_date: '2025-06-25',
          end_date: '2025-06-27',
          leave_type: 'vacation',
          reason: 'Family vacation',
          days_requested: 3,
          status: 'pending',
          created_at: '2025-06-22T10:00:00Z'
        },
        {
          id: 2,
          employee_name: 'Jane Smith',
          employee_email: 'jane.smith@company.com',
          project_name: 'Mobile App Development',
          start_date: '2025-06-30',
          end_date: '2025-07-02',
          leave_type: 'sick',
          reason: 'Medical appointment',
          days_requested: 3,
          status: 'approved',
          created_at: '2025-06-20T14:30:00Z'
        }
      ];
      setLeaveRequests(mockLeaveRequests);
    } catch (err: any) {
      setError('Failed to fetch leave requests');
      console.error('Leave requests error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    try {
      // Update local state immediately for better UX
      setLeaveRequests(requests => 
        requests.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
      
      // TODO: Make API call to update status in database
      // await updateLeaveRequestStatus(requestId, newStatus);
      
      console.log(`Leave request ${requestId} ${newStatus}`);
    } catch (err) {
      console.error('Error updating leave request status:', err);
      setError('Failed to update leave request status');
      // Revert local state on error
      await fetchLeaveRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: '#f59e0b',
          bg: '#fef3c7',
          icon: <ExclamationCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Pending'
        };
      case 'approved':
        return {
          color: '#10b981',
          bg: '#d1fae5',
          icon: <CheckCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Approved'
        };
      case 'rejected':
        return {
          color: '#ef4444',
          bg: '#fef2f2',
          icon: <XCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Rejected'
        };
      default:
        return {
          color: '#6b7280',
          bg: '#f9fafb',
          icon: <ClockIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Unknown'
        };
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      family: 'Family Emergency',
      medical: 'Medical',
      other: 'Other'
    };
    return types[type] || type;
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'hr' && user?.role !== 'admin')) {
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
          .employee-absent-container {
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
          .filters-section {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
          }
          .filter-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .filter-btn {
            padding: 0.5rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .filter-btn:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .filter-btn.active {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .requests-grid {
            padding: 1.5rem 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
          }
          .request-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.2s ease;
          }
          .request-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .request-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .employee-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .employee-avatar {
            width: 40px;
            height: 40px;
            background: #000000;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1rem;
          }
          .status-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .request-details {
            margin-bottom: 1.5rem;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .detail-label {
            color: #666666;
            font-weight: 500;
          }
          .detail-value {
            color: #000000;
            font-weight: 600;
          }
          .request-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
          }
          .action-btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border: 2px solid;
            transition: all 0.2s ease;
          }
          .action-btn.approve {
            background: #10b981;
            color: #ffffff;
            border-color: #10b981;
          }
          .action-btn.approve:hover {
            background: #059669;
            border-color: #059669;
          }
          .action-btn.reject {
            background: #ef4444;
            color: #ffffff;
            border-color: #ef4444;
          }
          .action-btn.reject:hover {
            background: #dc2626;
            border-color: #dc2626;
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
            
            .filters-section {
              padding: 1rem;
            }
            
            .requests-grid {
              grid-template-columns: 1fr;
              padding: 1rem;
              gap: 1rem;
            }
            
            .request-card {
              padding: 1rem;
            }
            
            .request-actions {
              flex-direction: column;
              gap: 0.5rem;
            }
          }
        `
      }} />

      <div className="employee-absent-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <CalendarDaysIcon style={{ width: '32px', height: '32px' }} />
              Employee Absence Requests
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              Review and manage employee leave requests
            </p>
          </header>

          <div className="filters-section">
            <div className="filter-buttons">
              <button
                onClick={() => setFilterStatus('all')}
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              >
                All Requests ({leaveRequests.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              >
                Pending ({leaveRequests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
              >
                Approved ({leaveRequests.filter(r => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
              >
                Rejected ({leaveRequests.filter(r => r.status === 'rejected').length})
              </button>
            </div>
          </div>

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

          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <CalendarDaysIcon style={{ width: '80px', height: '80px', color: '#e5e7eb', margin: '0 auto 1rem' }} />
              <h3>No Leave Requests</h3>
              <p>
                {filterStatus === 'all' 
                  ? 'No leave requests have been submitted yet.'
                  : `No ${filterStatus} leave requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="requests-grid">
              {filteredRequests.map((request) => {
                const statusBadge = getStatusBadge(request.status);
                
                return (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {request.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#000000' }}>
                            {request.employee_name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                            {request.employee_email}
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className="status-badge"
                        style={{ 
                          color: statusBadge.color, 
                          backgroundColor: statusBadge.bg 
                        }}
                      >
                        {statusBadge.icon}
                        {statusBadge.label}
                      </div>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Project:</span>
                        <span className="detail-value">{request.project_name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Leave Type:</span>
                        <span className="detail-value">{getLeaveTypeLabel(request.leave_type)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Days:</span>
                        <span className="detail-value">{request.days_requested} days</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">{request.reason}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Submitted:</span>
                        <span className="detail-value">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button
                          onClick={() => handleStatusChange(request.id, 'approved')}
                          className="action-btn approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(request.id, 'rejected')}
                          className="action-btn reject"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 