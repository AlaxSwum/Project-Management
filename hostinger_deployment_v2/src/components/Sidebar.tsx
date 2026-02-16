'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarData } from '@/contexts/SidebarContext';
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
  ChevronDownIcon,
  FolderIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon
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
  { name: 'Personal', href: '/personal', icon: UserCircleIcon },
  { name: 'Password Vault', href: '/password-vault', icon: KeyIcon },
  { name: 'Meeting Schedule', href: '/calendar', icon: CalendarIcon },
  { name: 'Content Calendar', href: '/content-calendar', icon: CalendarDaysIcon },
];

const PERSONAL_ITEMS = [
  { name: 'Notifications', href: '/notifications', icon: BellIcon, badge: true },
];

export default function Sidebar({ projects: propsProjects, onCreateProject }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { projects: myProjects, teamMembers, loadingProjects, unreadNotifications, unreadMessages, totalUnreadMessages, clearUnreadForUser, refreshProjects } = useSidebarData();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  const [creatingProject, setCreatingProject] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
      await logout();
      router.push('/login');
  };

  // Create new project function
  const handleCreateProject = async () => {
    if (!user?.id || !newProjectName.trim()) return;
    
    setCreatingProject(true);
    try {
      const { data: newProject, error: projectError } = await supabase
        .from('projects_project')
        .insert({
          name: newProjectName.trim(),
          description: '',
          color: newProjectColor,
          project_type: 'general',
          status: 'active',
          created_by_id: user.id,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Error creating project:', projectError);
        alert('Failed to create project: ' + (projectError.message || 'Unknown error'));
        setCreatingProject(false);
        return;
      }
      
      const { error: memberError } = await supabase
        .from('projects_project_members')
        .insert({
          project_id: newProject.id,
          user_id: user.id
        });
      
      if (memberError) {
        console.error('Error adding member:', memberError);
        try {
          await supabase.rpc('add_project_member', {
            p_project_id: newProject.id,
            p_user_id: user.id,
            p_role: 'admin'
          });
        } catch (rpcError) {
          console.error('RPC fallback also failed:', rpcError);
        }
      }
      
      await refreshProjects();
      setNewProjectName('');
      setShowCreateProject(false);
      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
    setCreatingProject(false);
  };

  // The sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <>
      {/* Workspace Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.125rem' }}>F</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Focus</span>
              <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
            </div>
          </div>
          {/* Close button - only visible on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            style={{ display: 'none', padding: '0.375rem', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Dashboard Link */}
        <Link
          href="/dashboard"
          className="sidebar-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            background: pathname === '/dashboard' ? '#10B981' : 'transparent',
            color: pathname === '/dashboard' ? '#FFFFFF' : '#A1A1AA',
            textDecoration: 'none',
            transition: 'all 0.2s',
            marginBottom: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/dashboard') {
              e.currentTarget.style.background = '#1A1A1A';
              e.currentTarget.style.color = '#FFFFFF';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/dashboard') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#A1A1AA';
            }
          }}
        >
          <HomeIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Mabry Pro, sans-serif' }}>Dashboard</span>
        </Link>

        {/* Projects Section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Mabry Pro, sans-serif' }}>
              Projects ({myProjects.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {loadingProjects ? (
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#52525B', fontFamily: 'Mabry Pro, sans-serif' }}>
                Loading projects...
              </div>
            ) : myProjects.length > 0 ? myProjects.map((project) => {
              const isActive = pathname === `/projects/${project.id}`;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="sidebar-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: isActive ? '#1A1A1A' : 'transparent',
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
                  <div style={{ width: '8px', height: '8px', borderRadius: '0.125rem', flexShrink: 0, backgroundColor: project.color || '#71717A' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'Mabry Pro, sans-serif' }}>
                    {project.name}
                  </span>
                </Link>
              );
            }) : (
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#52525B', fontFamily: 'Mabry Pro, sans-serif' }}>
                No projects yet
              </div>
            )}
            
            <button
              onClick={() => setShowCreateProject(true)}
              className="sidebar-create-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: '#71717A',
                border: '1px dashed #3D3D3D',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                marginTop: '0.5rem',
                fontSize: '0.8125rem',
                fontFamily: 'Mabry Pro, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1A1A1A';
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.color = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#3D3D3D';
                e.currentTarget.style.color = '#71717A';
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="sidebar-link"
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
              const showBadge = item.badge && unreadNotifications > 0;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="sidebar-link"
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
                      fontSize: '0.6875rem', 
                      fontWeight: 700, 
                      color: '#FFFFFF', 
                      background: '#EF4444',
                      minWidth: '20px',
                      height: '20px',
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
        </div>

        {/* Messages Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages</span>
            {totalUnreadMessages > 0 && (
              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#FFFFFF', background: '#3B82F6', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.25rem' }}>
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {teamMembers.length > 0 ? teamMembers.map((member) => {
              const isActiveChat = pathname === '/messages' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('user') === String(member.id);
              const memberUnread = unreadMessages[member.id] || 0;
              return (
                <Link
                  key={member.id}
                  href={`/messages?user=${member.id}`}
                  onClick={() => clearUnreadForUser(member.id)}
                  className="sidebar-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', color: isActiveChat ? '#FFFFFF' : '#A1A1AA', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', background: isActiveChat ? '#1A1A1A' : 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { if (!isActiveChat) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; } }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', background: '#10B981', border: '2px solid #0D0D0D', borderRadius: '50%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#52525B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>member</div>
                  </div>
                  {memberUnread > 0 && (
                    <span style={{ minWidth: '20px', height: '20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.375rem', flexShrink: 0 }}>
                      {memberUnread > 9 ? '9+' : memberUnread}
                    </span>
                  )}
                </Link>
              );
            }) : (
              <div style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#52525B', fontSize: '0.8125rem' }}>
                No team members yet
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <Link
          href="/settings"
          className="sidebar-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            background: pathname === '/settings' ? '#10B981' : 'transparent',
            color: pathname === '/settings' ? '#FFFFFF' : '#A1A1AA',
            textDecoration: 'none',
            transition: 'all 0.2s',
            marginBottom: '0.75rem'
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.background = '#1A1A1A';
              e.currentTarget.style.color = '#FFFFFF';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#A1A1AA';
            }
          }}
        >
          <Cog6ToothIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Settings</span>
        </Link>

        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A1A'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: user?.avatar_url 
              ? `url(${user.avatar_url}) center/cover` 
              : 'linear-gradient(135deg, #8B5CF6, #EC4899)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {!user?.avatar_url && (
              <span style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.875rem' }}>
                {user?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ color: '#52525B', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            style={{ padding: '0.375rem', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            title="Logout"
            onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
          >
            <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar - visible only on mobile/tablet */}
      <div className="mobile-topbar" id="mobile-topbar">
        <button
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Bars3Icon style={{ width: '24px', height: '24px' }} />
          {(unreadNotifications > 0 || totalUnreadMessages > 0) && (
            <span className="mobile-hamburger-badge" />
          )}
        </button>
        <div className="mobile-topbar-title">
          <div style={{ width: '28px', height: '28px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem' }}>F</span>
          </div>
          <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '1rem', fontFamily: 'Mabry Pro, sans-serif' }}>Focus</span>
        </div>
        <Link href="/notifications" style={{ position: 'relative', color: '#A1A1AA', padding: '0.375rem' }}>
          <BellIcon style={{ width: '24px', height: '24px' }} />
          {unreadNotifications > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid #0D0D0D' }} />
          )}
        </Link>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`sidebar-panel ${mobileOpen ? 'sidebar-open' : ''}`} id="sidebar-panel">
        {sidebarContent}
      </aside>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div
          className="create-project-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => setShowCreateProject(false)}
        >
          <div
            className="create-project-modal"
            style={{
              background: '#1A1A1A',
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
              border: '1px solid #2D2D2D',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', fontFamily: 'Mabry Pro, sans-serif' }}>
              Create New Project
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '8px', fontFamily: 'Mabry Pro, sans-serif' }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                className="sidebar-modal-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#141414',
                  border: '1px solid #3D3D3D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  fontFamily: 'Mabry Pro, sans-serif',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '8px', fontFamily: 'Mabry Pro, sans-serif' }}>
                Project Color
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    className="sidebar-color-btn"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: color,
                      border: newProjectColor === color ? '3px solid #FFFFFF' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      padding: 0,
                      minHeight: '32px',
                      minWidth: '32px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateProject(false)}
                className="sidebar-cancel-btn"
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #3D3D3D',
                  borderRadius: '8px',
                  color: '#A1A1AA',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Mabry Pro, sans-serif',
                  minHeight: 'auto',
                  minWidth: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2D2D2D';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#A1A1AA';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creatingProject}
                className="sidebar-submit-btn"
                style={{
                  padding: '10px 20px',
                  background: newProjectName.trim() ? '#10B981' : '#3D3D3D',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  fontFamily: 'Mabry Pro, sans-serif',
                  opacity: creatingProject ? 0.7 : 1,
                  minHeight: 'auto',
                  minWidth: 'auto',
                }}
                onMouseEnter={(e) => {
                  if (newProjectName.trim() && !creatingProject) {
                    e.currentTarget.style.background = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.background = '#10B981';
                  }
                }}
              >
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
