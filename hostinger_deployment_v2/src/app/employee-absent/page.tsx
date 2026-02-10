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
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data: requests, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          employee_name,
          employee_email,
          project_id,
          project_name,
          start_date,
          end_date,
          leave_type,
          reason,
          notes,
          days_requested,
          status,
          created_at,
          approved_by
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setLeaveRequests(requests || []);
    } catch (err: any) {
      setError('Failed to fetch leave requests');
      console.error('Leave requests error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Find the request to get employee details
      const request = leaveRequests.find(req => req.id === requestId);
      if (!request) {
        setError('Leave request not found');
        return;
      }
      
      // Update the leave request status in database
      const { data: updatedRequest, error: updateError } = await supabase
        .from('leave_requests')
        .update({ 
          status: newStatus, 
          approved_by: user?.id 
        })
        .eq('id', requestId)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setLeaveRequests(requests => 
        requests.map(req => 
          req.id === requestId ? { ...req, status: newStatus, approved_by: user?.id } : req
        )
      );
      
      // If approved, update/create employee leave balance
      if (newStatus === 'approved') {
        try {
          // Check if employee has a leave balance record
          const { data: existingBalance, error: balanceCheckError } = await supabase
            .from('employee_leave_balance')
            .select('*')
            .eq('employee_id', request.employee_id)
            .single();
          
          if (balanceCheckError && balanceCheckError.code !== 'PGRST116') {
            // Error other than "not found"
            console.error('Error checking leave balance:', balanceCheckError);
          } else if (existingBalance) {
            // Update existing balance - available_days is calculated automatically
            const newUsedDays = existingBalance.used_days + request.days_requested;
            
            const { error: updateBalanceError } = await supabase
              .from('employee_leave_balance')
              .update({
                used_days: newUsedDays,
                updated_at: new Date().toISOString()
              })
              .eq('employee_id', request.employee_id);
            
            if (updateBalanceError) {
              console.error('Error updating leave balance:', updateBalanceError);
            } else {
              const newAvailableDays = existingBalance.total_days - newUsedDays;
              console.log(`Updated leave balance: ${request.employee_name} now has ${newAvailableDays} days available (used: ${newUsedDays}/${existingBalance.total_days})`);
            }
          } else {
            // Create new balance record with default 14 days annual leave
            const startingBalance = 14;
            const newUsedDays = request.days_requested;
            
            const { error: createBalanceError } = await supabase
              .from('employee_leave_balance')
              .insert([{
                employee_id: request.employee_id,
                total_days: startingBalance,
                used_days: newUsedDays,
                year: new Date().getFullYear()
              }]);
            
            if (createBalanceError) {
              console.error('Error creating leave balance:', createBalanceError);
              console.error('Create balance error details:', createBalanceError);
            } else {
              const newAvailableDays = startingBalance - newUsedDays;
              console.log(`Created leave balance: ${request.employee_name} has ${newAvailableDays} days remaining from initial ${startingBalance} (used: ${newUsedDays})`);
            }
          }
        } catch (balanceError) {
          console.error('Error managing leave balance:', balanceError);
        }
      }
      
      // Create notification for the employee
      const notificationTitle = newStatus === 'approved' 
        ? 'Leave Request Approved' 
        : 'Leave Request Rejected';
      
      const notificationMessage = newStatus === 'approved'
        ? `Your ${request.days_requested}-day leave request from ${new Date(request.start_date).toLocaleDateString()} to ${new Date(request.end_date).toLocaleDateString()} has been approved.`
        : `Your ${request.days_requested}-day leave request from ${new Date(request.start_date).toLocaleDateString()} to ${new Date(request.end_date).toLocaleDateString()} has been rejected.`;
      
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert([{
          recipient_id: request.employee_id,
          sender_id: user?.id,
          type: newStatus === 'approved' ? 'leave_request_approved' : 'leave_request_rejected',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            leave_request_id: requestId,
            status: newStatus,
            days: request.days_requested,
            start_date: request.start_date,
            end_date: request.end_date,
            leave_type: request.leave_type
          }
        }]);
      
      if (notifyError) {
        console.error('Error creating notification:', notifyError);
      }
      
      console.log(`Leave request ${requestId} ${newStatus} successfully`);
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
          color: '#6b7280',
          bg: '#f3f4f6',
          icon: <ExclamationCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Pending'
        };
      case 'approved':
        return {
          color: '#111827',
          bg: '#f3f4f6',
          icon: <CheckCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Approved'
        };
      case 'rejected':
        return {
          color: '#6b7280',
          bg: '#f3f4f6',
          icon: <XCircleIcon style={{ width: '14px', height: '14px' }} />,
          label: 'Rejected'
        };
      default:
        return {
          color: '#9ca3af',
          bg: '#f3f4f6',
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
      <div style={{ 
        padding: '2rem', 
        background: '#fafafa', 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #9ca3af', 
          borderTop: '3px solid #111827', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'hr' && user?.role !== 'admin')) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        background: '#fafafa', 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #9ca3af', 
          borderTop: '3px solid #111827', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
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

      <div style={{ 
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
              Absence Management
            </h1>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
              Review and manage employee leave requests
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

          {/* Statistics Cards */}
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
                {leaveRequests.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Total Requests</div>
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
                {leaveRequests.filter(r => r.status === 'pending').length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Pending</div>
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
                {leaveRequests.filter(r => r.status === 'approved').length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Approved</div>
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
                {leaveRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Rejected</div>
            </div>
          </div>

          {/* Filter Section */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: filterStatus === status ? '#111827' : '#ffffff',
                    color: filterStatus === status ? '#ffffff' : '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize',
                    boxShadow: filterStatus === status ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {status} ({status === 'all' ? leaveRequests.length : leaveRequests.filter(r => r.status === status).length})
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
          {filteredRequests.length === 0 ? (
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
                  <CalendarDaysIcon style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#111827', letterSpacing: '-0.01em' }}>
                  {filterStatus === 'all' ? 'No Leave Requests' : `No ${filterStatus} Requests`}
                </h3>
                <p style={{ fontSize: '1.1rem', margin: '0', lineHeight: '1.5' }}>
                {filterStatus === 'all' 
                  ? 'No leave requests have been submitted yet.'
                  : `No ${filterStatus} leave requests found.`
                }
              </p>
            </div>
          ) : (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredRequests.map((request) => {
                const statusBadge = getStatusBadge(request.status);
                
                return (
                      <div
                        key={request.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '1.5rem',
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              background: '#111827',
                              color: '#ffffff',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '500',
                              fontSize: '1.1rem'
                            }}>
                          {request.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                            {request.employee_name}
                          </div>
                              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {request.project_name}
                          </div>
                        </div>
                      </div>
                      
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#f3f4f6',
                            color: '#374151', 
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </div>
                    </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '0.25rem' }}>LEAVE TYPE</div>
                            <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{getLeaveTypeLabel(request.leave_type)}</div>
                      </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '0.25rem' }}>DURATION</div>
                            <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{request.days_requested} days</div>
                      </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '0.25rem' }}>START DATE</div>
                            <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{new Date(request.start_date).toLocaleDateString()}</div>
                      </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '0.25rem' }}>END DATE</div>
                            <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{new Date(request.end_date).toLocaleDateString()}</div>
                      </div>
                    </div>

                        {request.reason && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '0.5rem' }}>REASON</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>{request.reason}</div>
                          </div>
                        )}

                    {request.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                            <button
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: '#ffffff',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.color = '#111827';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.color = '#6b7280';
                              }}
                            >
                              Reject
                            </button>
                        <button
                          onClick={() => handleStatusChange(request.id, 'approved')}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: '#111827',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1f2937';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#111827';
                              }}
                        >
                          Approve
                        </button>
                          </div>
                        )}

                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>
                          Submitted on {new Date(request.created_at).toLocaleDateString()}
                        </div>
                  </div>
                );
              })}
                </div>
            </div>
          )}
          </div>
        </div>
      </>
    );
} 