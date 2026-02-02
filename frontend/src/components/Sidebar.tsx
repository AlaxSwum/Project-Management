'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  HomeIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  InboxIcon,
  DocumentTextIcon,
  KeyIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  BellIcon,
  ChartBarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: Array<{
    id: number;
    name: string;
    email: string;
    role?: string;
  }>;
}

interface SidebarProps {
  projects: Project[];
  onCreateProject: () => void;
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Personal', href: '/personal', icon: UserCircleIcon },
  { name: 'My Tasks', href: '/my-tasks', icon: ClipboardDocumentListIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon, badge: true },
  { name: 'Invoices & Expenses', href: '/expenses', icon: CurrencyDollarIcon },
  { name: 'Password Vault', href: '/password-vault', icon: KeyIcon },
  { name: 'Meeting Schedule', href: '/calendar', icon: CalendarIcon },
  { name: 'Content Calendar', href: '/content-calendar', icon: CalendarDaysIcon },
];

const PERSONAL_ITEMS = [
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Daily Reports', href: '/daily-reports', icon: DocumentTextIcon },
];

export default function Sidebar({ projects, onCreateProject }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
    if (!user?.id) return;
    
    try {
        const { count } = await supabase
          .from('task_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        
        setUnreadNotifications(count || 0);
    } catch (error) {
        // Error fetching notifications
      }
    };

    fetchNotificationCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
      await logout();
      router.push('/login');
  };

  // Task counts for categories
  const todoCount = projects.reduce((acc, p) => acc + (p.task_count || 0) - (p.completed_task_count || 0), 0);
  const completedCount = projects.reduce((acc, p) => acc + (p.completed_task_count || 0), 0);
  
  // Get all team members from assigned projects
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user?.id || !projects || projects.length === 0) {
        setTeamMembers([]);
      return;
    }
    
    try {
        // Get all unique members from all assigned projects
        const allMembersMap = new Map();
        
        projects.forEach(project => {
          if (project.members && Array.isArray(project.members)) {
            project.members.forEach(member => {
              if (member.id !== user.id && !allMembersMap.has(member.id)) {
                allMembersMap.set(member.id, member);
              }
            });
          }
        });
        
        const members = Array.from(allMembersMap.values()).slice(0, 10);
        setTeamMembers(members);
    } catch (error) {
        setTeamMembers([]);
      }
    };
    
    fetchTeamMembers();
  }, [user, projects]);

  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: '#0D0D0D', borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      {/* Workspace Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #1F1F1F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A1A'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.125rem' }}>F</span>
            </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Focus</span>
              <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
              </div>
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
        {/* Main Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const showBadge = item.badge && unreadNotifications > 0;
            return (
                  <Link
                    key={item.name}
                    href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: isActive ? '#10B981' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#A1A1AA',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  position: 'relative'
            }} 
            onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#1A1A1A';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
            }} 
            onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#A1A1AA';
                  }
                }}
              >
                <item.icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name}</span>
                {showBadge && (
                <span style={{
                    minWidth: '20px', 
                    height: '20px', 
                    background: '#EF4444', 
                    color: '#FFFFFF', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    borderRadius: '10px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                    padding: '0 0.375rem'
                }}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
                  </Link>
            );
          })}
              </div>

        {/* Personal Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal</span>
              </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {PERSONAL_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: isActive ? '#10B981' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#A1A1AA',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
            }} 
            onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#1A1A1A';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
            }} 
            onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#A1A1AA';
                    }
                  }}
                >
                  <item.icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                </Link>
              );
            })}
                  </div>
                </div>

        {/* Messages Section - Only Real Team Members */}
        {teamMembers.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages</span>
                </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {teamMembers.map((member, i) => (
                <Link
                  key={member.id}
                  href={`/messages?user=${member.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', color: '#A1A1AA', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; }}
                >
                  <div
                    style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i % 4], position: 'relative' }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', background: '#10B981', border: '2px solid #0D0D0D', borderRadius: '50%' }} />
                </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#52525B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.role || 'Team Member'}
            </div>
          </div>
                </Link>
              ))}
                  </div>
                </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div style={{ borderTop: '1px solid #1F1F1F', padding: '0.75rem' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <button
            style={{ padding: '0.5rem', color: '#71717A', background: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
          >
            <Squares2X2Icon style={{ width: '20px', height: '20px' }} />
                            </button>
                      <button
            style={{ padding: '0.5rem', color: '#71717A', background: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
                  >
            <ChartBarIcon style={{ width: '20px', height: '20px' }} />
                      </button>
                            <button
            style={{ padding: '0.5rem', color: '#71717A', background: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
          >
            <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                </div>

        {/* User Profile */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A1A'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.875rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </span>
                        </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ color: '#52525B', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
                    </div>
                            <button
            onClick={handleLogout}
            style={{ padding: '0.375rem', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            title="Logout"
            onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
          >
            <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                    </div>
    </aside>
  );
}
