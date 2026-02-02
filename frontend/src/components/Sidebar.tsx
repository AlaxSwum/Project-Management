'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  CalendarIcon,
  CalendarDaysIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  InboxIcon,
  DocumentTextIcon,
  KeyIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
}

interface SidebarProps {
  projects: Project[];
  onCreateProject: () => void;
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Personal', href: '/personal', icon: UserCircleIcon },
  { name: 'My Tasks', href: '/my-tasks', icon: ClipboardDocumentListIcon },
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
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);

  const handleLogout = async () => {
      await logout();
      router.push('/login');
  };

  const toggleProjectExpand = (projectId: number) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Task counts for categories
  const todoCount = projects.reduce((acc, p) => acc + (p.task_count || 0) - (p.completed_task_count || 0), 0);
  const completedCount = projects.reduce((acc, p) => acc + (p.completed_task_count || 0), 0);

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

        {/* Projects Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A1A'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects & Companies</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateProject();
                }}
                style={{ padding: '0.25rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <PlusIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
              </button>
              <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#71717A', transform: isProjectsExpanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            </div>
          </button>

          {isProjectsExpanded && (
            <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {projects.map((project) => {
                const isExpanded = expandedProjects.includes(project.id);
                const isActive = pathname === `/projects/${project.id}`;
                
                return (
                  <div key={project.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: isActive ? '#1A1A1A' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#A1A1AA',
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
                      <button
                        onClick={() => toggleProjectExpand(project.id)}
                        style={{ padding: '0.125rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                      >
                        <ChevronRightIcon style={{ width: '12px', height: '12px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      <div
                        style={{ width: '8px', height: '8px', borderRadius: '0.125rem', flexShrink: 0, backgroundColor: project.color || '#71717A' }}
                      />
                      <Link
                        href={`/projects/${project.id}`}
                        style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', color: 'inherit' }}
                      >
                        {project.name}
                      </Link>
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                  <p style={{ color: '#52525B', fontSize: '0.875rem' }}>No projects yet</p>
                  <button
                    onClick={onCreateProject}
                    style={{ marginTop: '0.5rem', color: '#10B981', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#34D399'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#10B981'}
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          )}
            </div>
            
        {/* Categories Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[
              { name: 'To Do', color: '#EF4444', count: todoCount || 0 },
              { name: 'In Progress', color: '#F59E0B', count: 0 },
              { name: 'Review', color: '#F97316', count: 0 },
              { name: 'Completed', color: '#10B981', count: completedCount || 0 }
            ].map((category) => (
              <div
                key={category.name}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: '#A1A1AA', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: category.color }} />
                  <span style={{ fontSize: '0.875rem' }}>{category.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#2D2D2D', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>{category.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {['Michael Anderson', 'Sophia Carter', 'Daniel Johnson', 'James Wilson'].map((name, i) => (
              <div
                key={name}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', color: '#A1A1AA', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; }}
              >
                <div
                  style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i] }}
                >
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#52525B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {['UI/UX Designer', 'Graphic Designer', 'Frontend Developer', 'Backend Programmer'][i]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
