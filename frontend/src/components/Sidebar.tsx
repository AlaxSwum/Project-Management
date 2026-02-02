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
  BuildingOfficeIcon,
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
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0D0D0D] border-r border-[#1F1F1F] flex flex-col z-40">
      {/* Workspace Header */}
      <div className="p-4 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-3 p-2 hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold truncate">Focus</span>
              <ChevronDownIcon className="w-4 h-4 text-[#71717A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main Navigation */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Personal Section */}
        <div className="mt-6">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">Personal</span>
          </div>
          <div className="space-y-1">
            {PERSONAL_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-6">
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">Projects & Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateProject();
                }}
                className="p-1 hover:bg-[#2D2D2D] rounded transition-colors"
              >
                <PlusIcon className="w-4 h-4 text-[#71717A] hover:text-white" />
              </button>
              <ChevronDownIcon className={`w-4 h-4 text-[#71717A] transition-transform ${isProjectsExpanded ? '' : '-rotate-90'}`} />
            </div>
          </button>

          {isProjectsExpanded && (
            <div className="mt-1 space-y-0.5">
              {projects.map((project) => {
                const isExpanded = expandedProjects.includes(project.id);
                const isActive = pathname === `/projects/${project.id}`;
                
                return (
                  <div key={project.id}>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleProjectExpand(project.id)}
                        className="p-0.5"
                      >
                        <ChevronRightIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <div
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: project.color || '#71717A' }}
                      />
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 text-sm font-medium truncate"
                      >
                        {project.name}
                      </Link>
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <p className="text-[#52525B] text-sm">No projects yet</p>
                  <button
                    onClick={onCreateProject}
                    className="mt-2 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="mt-6">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">Categories</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="text-sm">To Do</span>
              </div>
              <span className="text-xs bg-[#2D2D2D] px-2 py-0.5 rounded">{todoCount || 0}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-sm">In Progress</span>
              </div>
              <span className="text-xs bg-[#2D2D2D] px-2 py-0.5 rounded">0</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                <span className="text-sm">Review</span>
              </div>
              <span className="text-xs bg-[#2D2D2D] px-2 py-0.5 rounded">0</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="text-xs bg-[#2D2D2D] px-2 py-0.5 rounded">{completedCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className="mt-6">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">Messages</span>
          </div>
          <div className="space-y-1">
            {['Michael Anderson', 'Sophia Carter', 'Daniel Johnson', 'James Wilson'].map((name, i) => (
              <div
                key={name}
                className="flex items-center gap-3 px-3 py-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-all"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i] }}
                >
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{name}</div>
                  <div className="text-xs text-[#52525B] truncate">
                    {['UI/UX Designer', 'Graphic Designer', 'Frontend Developer', 'Backend Programmer'][i]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[#1F1F1F] p-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button className="p-2 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name || 'User'}</div>
            <div className="text-[#52525B] text-xs truncate">{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-[#71717A] hover:text-red-400 transition-colors"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
