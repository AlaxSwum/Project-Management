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
        return <ExclamationCircleIcon style={{ width: '20px', height: '20px', color: '#f59e0b' }} />;
      case 'leave_request_approved':
        return <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />;
      case 'leave_request_rejected':
        return <XCircleIcon style={{ width: '20px', height: '20px', color: '#ef4444' }} />;
      default:
        return <BellIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />;
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
          .inbox-container {
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
          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
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
          }
          .filter-btn.active {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .mark-all-btn {
            padding: 0.5rem 1rem;
            background: #f3f4f6;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .mark-all-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }
          .notifications-section {
            padding: 1.5rem 2rem;
          }
          .notification-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
            background: #ffffff;
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .notification-item:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .notification-item.unread {
            background: #f8fafc;
            border-color: #3b82f6;
          }
          .notification-icon {
            flex-shrink: 0;
            padding: 0.5rem;
            border-radius: 50%;
            background: #f9fafb;
          }
          .notification-content {
            flex: 1;
            min-width: 0;
          }
          .notification-title {
            font-size: 1rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.25rem;
          }
          .notification-message {
            font-size: 0.875rem;
            color: #666666;
            line-height: 1.5;
          }
          .notification-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.75rem;
            font-size: 0.75rem;
            color: #9ca3af;
          }
          .mark-read-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          .mark-read-btn:hover {
            background: #f3f4f6;
            color: #000000;
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
            
            .header-actions {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.75rem;
            }
            
            .notifications-section {
              padding: 1rem;
            }
            
            .notification-item {
              padding: 1rem;
            }
            
            .notification-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }
          }
        `
      }} />

      <div className="inbox-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <InboxIcon style={{ width: '32px', height: '32px' }} />
              Inbox
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              Notifications and important updates
            </p>
            
            <div className="header-actions">
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setFilter('all')}
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                >
                  Unread ({notifications.filter(n => !n.is_read).length})
                </button>
              </div>
              
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={markAllAsRead}
                  className="mark-all-btn"
                >
                  Mark All as Read
                </button>
              )}
            </div>
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

          <div className="notifications-section">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <InboxIcon style={{ width: '80px', height: '80px', color: '#e5e7eb', margin: '0 auto 1rem' }} />
                <h3>No Notifications</h3>
                <p>
                  {filter === 'unread' 
                    ? 'No unread notifications at the moment.'
                    : 'Your inbox is empty. Notifications will appear here when you have updates.'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    
                    <div className="notification-meta">
                      <span>{formatDate(notification.created_at)}</span>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="mark-read-btn"
                          title="Mark as read"
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 