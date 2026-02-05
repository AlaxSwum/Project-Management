'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  BellIcon, 
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';

interface Notification {
  id: number;
  task_id: number;
  project_id: number;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  sender_avatar_url?: string;
  project_name: string;
  notification_type: string;
  message: string;
  task_name: string;
  task_status: string;
  old_status?: string;
  new_status?: string;
  comment_text?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchNotifications();
    fetchProjects();
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      if (!user?.id) {
        setProjects([]);
        return;
      }
      
      // Get all projects with members
      const { data: allProjects } = await supabase
        .from('projects_project')
        .select('*');
      
      // Filter to only show projects where user is a member
      const myProjects = (allProjects || []).filter((project: any) => {
        return project.members && Array.isArray(project.members) && 
               project.members.some((m: any) => m.id === user.id);
      });
      
      setProjects(myProjects);
    } catch (error) {
      setProjects([]);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_summary')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // Enrich with sender avatar_url
        const enriched = await Promise.all(data.map(async (notif) => {
          if (notif.sender_id) {
            const { data: sender } = await supabase
              .from('auth_user')
              .select('avatar_url')
              .eq('id', notif.sender_id)
              .single();
            
            return {
              ...notif,
              sender_avatar_url: sender?.avatar_url
            };
          }
          return notif;
        }));
        
        setNotifications(enriched);
      }
    } catch (error) {
      // Error fetching notifications
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await supabase
        .from('task_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      // Error marking as read
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('task_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      fetchNotifications();
    } catch (error) {
      // Error marking all as read
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_changed':
      case 'task_updated':
        return ArrowPathIcon;
      case 'comment_added':
        return ChatBubbleLeftIcon;
      case 'assigned':
      case 'task_created':
        return UserPlusIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'status_changed': return '#3B82F6';
      case 'comment_added': return '#10B981';
      case 'assigned': return '#8B5CF6';
      case 'task_created': return '#F59E0B';
      default: return '#71717A';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      
      <div style={{ flex: 1, marginLeft: '280px', background: '#0D0D0D' }}>
        {/* Header */}
        <header style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #1F1F1F' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>Notifications</h1>
                <p style={{ color: '#71717A', fontSize: '0.875rem' }}>
                  {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                >
                  <CheckIcon style={{ width: '16px', height: '16px' }} />
                  Mark All as Read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount }
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: isActive ? '#1A1A1A' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#71717A',
                      border: '1px solid',
                      borderColor: isActive ? '#2D2D2D' : 'transparent',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                    <span style={{ padding: '0.125rem 0.5rem', background: '#2D2D2D', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Notifications List */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BellIcon style={{ width: '40px', height: '40px', color: '#10B981' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p style={{ color: '#71717A' }}>
                {filter === 'unread' 
                  ? "You're all caught up! Check back later for updates." 
                  : "You'll see notifications here when there are updates on your tasks."}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const iconColor = getNotificationColor(notification.notification_type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={async () => {
                      // Mark as read before navigating
                      if (!notification.is_read) {
                        await markAsRead(notification.id);
                      }
                      router.push(`/projects/${notification.project_id}`);
                    }}
                    style={{
                      background: notification.is_read ? '#0D0D0D' : '#1A1A1A',
                      border: '1px solid',
                      borderColor: notification.is_read ? '#1F1F1F' : '#2D2D2D',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.background = '#1A1A1A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = notification.is_read ? '#1F1F1F' : '#2D2D2D'; e.currentTarget.style.background = notification.is_read ? '#0D0D0D' : '#1A1A1A'; }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {/* User Avatar */}
                      <UserAvatar 
                        user={{ name: notification.sender_name, avatar_url: notification.sender_avatar_url }} 
                        size="md" 
                      />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                              {notification.message}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ color: '#71717A', fontSize: '0.8125rem' }}>
                                {notification.project_name}
                              </span>
                              <span style={{ color: '#3D3D3D' }}>•</span>
                              <span style={{ color: '#71717A', fontSize: '0.8125rem' }}>
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
                              title="Mark as read"
                            >
                              <CheckIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                        </div>

                        {/* Task Name Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#A1A1AA', fontWeight: 500 }}>
                            {notification.task_name}
                          </span>
                          {notification.task_status && (
                            <>
                              <span style={{ color: '#3D3D3D' }}>•</span>
                              <span style={{ fontSize: '0.75rem', color: '#71717A', textTransform: 'capitalize' }}>
                                {notification.task_status.replace('_', ' ')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Comment Preview */}
                        {notification.comment_text && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', borderLeft: '3px solid #10B981' }}>
                            <p style={{ color: '#A1A1AA', fontSize: '0.8125rem', lineHeight: 1.5, fontStyle: 'italic' }}>
                              "{notification.comment_text.substring(0, 100)}{notification.comment_text.length > 100 ? '...' : ''}"
                            </p>
                          </div>
                        )}

                        {/* Unread Indicator */}
                        {!notification.is_read && (
                          <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }} />
                        )}
                      </div>
                    </div>
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
