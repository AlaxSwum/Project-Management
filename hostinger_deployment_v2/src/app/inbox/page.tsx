'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  InboxIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface Notification {
  id: number;
  recipient_id: number;
  sender_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export default function InboxPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchNotifications();
  }, [isAuthenticated, authLoading, router, user]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      ));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(notifications.map(notif => 
        ({ ...notif, is_read: true })
      ));
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request_submitted':
        return <ExclamationCircleIcon style={{ width: '20px', height: '20px', color: '#FFB333' }} />;
      case 'leave_request_approved':
        return <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />;
      case 'leave_request_rejected':
        return <XCircleIcon style={{ width: '20px', height: '20px', color: '#F87239' }} />;
      default:
        return <BellIcon style={{ width: '20px', height: '20px', color: '#C483D9' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  // Show loading state while auth is initializing
  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div className="page-main" style={{ 
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

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div className="page-main" style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
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
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
              Inbox
            </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
              Notifications and important updates
            </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#5884FD', marginBottom: '0.5rem' }}>
                {notifications.length}
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Total Notifications</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#FFB333', marginBottom: '0.5rem' }}>
                {notifications.filter(n => !n.is_read).length}
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Unread</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '300', color: '#10b981', marginBottom: '0.5rem' }}>
                {notifications.filter(n => n.is_read).length}
              </div>
              <div style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '500' }}>Read</div>
            </div>
          </div>

          {/* Filter Section */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: filter === 'all' ? '#5884FD' : '#ffffff',
                    color: filter === 'all' ? '#ffffff' : '#666666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: filter === 'all' ? '0 4px 12px rgba(88, 132, 253, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: filter === 'unread' ? '#5884FD' : '#ffffff',
                    color: filter === 'unread' ? '#ffffff' : '#666666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: filter === 'unread' ? '0 4px 12px rgba(88, 132, 253, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Unread ({notifications.filter(n => !n.is_read).length})
                </button>
              </div>
              
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#FFB333',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
                  }}
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #F87239', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#F87239',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)'
            }}>
              {error}
            </div>
          )}

          {/* Notifications List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            {filteredNotifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#999999'
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: '#f0f0f0',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 2rem'
                }}>
                  <InboxIcon style={{ width: '32px', height: '32px', color: '#999999' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                </h3>
                <p style={{ fontSize: '1.1rem', margin: '0', lineHeight: '1.5' }}>
                  {filter === 'unread' 
                    ? 'All caught up! No unread notifications at the moment.'
                    : 'Your inbox is empty. Notifications will appear here when you have updates.'
                  }
                </p>
              </div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1.5rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      background: notification.is_read ? '#ffffff' : '#f8fafc',
                      border: `1px solid ${notification.is_read ? '#e8e8e8' : '#5884FD'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#f0f0f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1a1a1a',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                      {notification.title}
                    </div>
                      <div style={{
                        fontSize: '0.95rem',
                        color: '#666666',
                        lineHeight: '1.5',
                        marginBottom: '1rem'
                      }}>
                      {notification.message}
                    </div>
                    
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: '#999999'
                      }}>
                      <span>{formatDate(notification.created_at)}</span>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#5884FD',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          title="Mark as read"
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 