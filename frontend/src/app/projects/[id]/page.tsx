'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EllipsisHorizontalIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignees: User[];
  assignee?: User | null;
  created_by: User;
  tags_list: string[];
  created_at: string;
  updated_at: string;
  project_id: number;
  subtasks_total?: number;
  subtasks_completed?: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  members: User[];
  tasks: Task[];
  task_count: number;
  completed_task_count: number;
  created_by: User;
  created_at: string;
}

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#71717A' },
  { value: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { value: 'review', label: 'Review', color: '#F97316' },
  { value: 'done', label: 'Complete', color: '#10B981' },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'design': { bg: '#EC489920', text: '#EC4899' },
  'ui/ux': { bg: '#EC489920', text: '#EC4899' },
  'frontend': { bg: '#10B98120', text: '#10B981' },
  'backend': { bg: '#8B5CF620', text: '#8B5CF6' },
  'api': { bg: '#3B82F620', text: '#3B82F6' },
  'qa': { bg: '#06B6D420', text: '#06B6D4' },
  'auth': { bg: '#EF444420', text: '#EF4444' },
  'database': { bg: '#6366F120', text: '#6366F1' },
  'media': { bg: '#A855F720', text: '#A855F7' },
  'performance': { bg: '#14B8A620', text: '#14B8A6' },
  'research': { bg: '#F59E0B20', text: '#F59E0B' },
  'default': { bg: '#71717A20', text: '#A1A1AA' },
};

function getTagColor(tag: string) {
  const normalizedTag = tag.toLowerCase();
  for (const key of Object.keys(TAG_COLORS)) {
    if (normalizedTag.includes(key)) {
      return TAG_COLORS[key];
    }
  }
  return TAG_COLORS.default;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium',
    tags: '',
    assignee_ids: [] as number[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProject();
  }, [isAuthenticated, authLoading, params?.id, router]);

  const fetchProject = async () => {
    try {
      const [projectData, tasksData, projectsData] = await Promise.all([
        projectService.getProject(Number(params?.id)),
        taskService.getProjectTasks(Number(params?.id)),
        projectService.getProjects()
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setAllProjects(projectsData);
    } catch (err: any) {
      if (err.response?.status === 404) {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData: any = {
        name: newTask.name.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: 'todo',
        assignee_ids: newTask.assignee_ids,
        tags_list: newTask.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      
      const createdTask = await taskService.createTask(Number(params?.id), taskData);
      setTasks([...tasks, createdTask]);
      setNewTask({ name: '', description: '', priority: 'medium', tags: '', assignee_ids: [] });
      setShowCreateTask(false);
    } catch (err) {
      // Failed to create task
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.status === newStatus) return;
    
    try {
      await taskService.updateTask(draggedTask.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      // Failed to update task
    }
    setDraggedTask(null);
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid rgba(16, 185, 129, 0.2)', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated || !project) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar projects={allProjects} onCreateProject={() => {}} />
      
      {/* Main Content */}
      <div className="flex-1 ml-[280px] flex flex-col">
        {/* Top Header */}
        <header className="h-14 bg-[#0D0D0D] border-b border-[#1F1F1F] flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-[#71717A]">
            <span>Project</span>
            <span className="text-[#3D3D3D]">&gt;</span>
            <span className="text-white">{project.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {project.members?.slice(0, 3).map((member, i) => (
                <div 
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0D0D0D] flex items-center justify-center text-xs font-medium text-white"
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              {project.members?.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-[#0D0D0D] flex items-center justify-center text-xs text-[#71717A]">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowMembersModal(true)}
              className="text-[#71717A] hover:text-white transition-colors"
            >
              <UserGroupIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Project Header */}
        <div className="px-6 py-5 border-b border-[#1F1F1F]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                <span className="text-lg">📁</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {project.members?.slice(0, 4).map((member, i) => (
                  <div 
                    key={member.id}
                    className="w-8 h-8 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i % 4] }}
                  >
                    {member.name.charAt(0)}
                  </div>
                ))}
                {project.members?.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-[#2D2D2D] border-2 border-[#0D0D0D] flex items-center justify-center text-xs text-white font-medium">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>
          
          {/* Tabs and Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1">
              <button className="px-4 py-2 bg-[#2D2D2D] text-white text-sm font-medium rounded-md flex items-center gap-2">
                <span>📋</span> Kanban
              </button>
              <button className="px-4 py-2 text-[#71717A] hover:text-white text-sm font-medium rounded-md flex items-center gap-2 transition-colors">
                <span>📊</span> Board
              </button>
              <button className="px-4 py-2 text-[#71717A] hover:text-white text-sm font-medium rounded-md flex items-center gap-2 transition-colors">
                <span>📝</span> List
              </button>
              <button className="px-4 py-2 text-[#71717A] hover:text-white text-sm font-medium rounded-md flex items-center gap-2 transition-colors">
                <span>📅</span> Calendar
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9 pr-4 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#3D3D3D]"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg text-sm text-[#A1A1AA] hover:text-white transition-colors">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-5 min-w-max">
            {TASK_STATUSES.map((status) => {
              const statusTasks = filteredTasks.filter(t => t.status === status.value);
              
              return (
                <div
                  key={status.value}
                  className={`w-[300px] flex flex-col rounded-xl transition-all ${
                    dragOverColumn === status.value ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, status.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status.value)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-white font-medium text-sm">{status.label}</span>
                      <span className="px-2 py-0.5 bg-[#2D2D2D] rounded-md text-xs text-[#A1A1AA] font-medium">
                        {statusTasks.length}
                      </span>
                    </div>
                    <button className="text-[#52525B] hover:text-white transition-colors">
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="flex flex-col gap-3 min-h-[200px]">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-[#3D3D3D] transition-all group"
                      >
                        {/* Tags */}
                        {task.tags_list && task.tags_list.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {task.tags_list.slice(0, 3).map((tag, i) => {
                              const tagColor = getTagColor(tag);
                              return (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Title and Menu */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-white font-medium text-sm leading-snug">{task.name}</h3>
                          <button className="text-[#52525B] hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-[#71717A] text-xs mb-4 line-clamp-2">{task.description}</p>
                        )}

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[#71717A]">Progress</span>
                            <span className="text-[#A1A1AA]">
                              {task.subtasks_completed || 0}/{task.subtasks_total || 4}
                            </span>
                          </div>
                          <div className="h-1 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${((task.subtasks_completed || 0) / (task.subtasks_total || 4)) * 100}%`,
                                backgroundColor: status.color
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#2D2D2D]">
                          {/* Toggle Switch */}
                          <div className="w-10 h-5 bg-[#2D2D2D] rounded-full relative cursor-pointer">
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-[#52525B] rounded-full transition-transform" />
                          </div>
                          
                          {/* Attachments and Comments */}
                          <div className="flex items-center gap-3 text-[#71717A] text-xs">
                            <div className="flex items-center gap-1">
                              <PaperClipIcon className="w-3.5 h-3.5" />
                              <span>{Math.floor(Math.random() * 5) + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                              <span>{Math.floor(Math.random() * 20) + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {statusTasks.length === 0 && (
                      <div className="flex-1 flex items-center justify-center min-h-[150px] border-2 border-dashed border-[#2D2D2D] rounded-xl">
                        <span className="text-[#52525B] text-sm">No tasks yet</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2D2D2D]">
              <h2 className="text-lg font-semibold text-white">Create New Task</h2>
              <button
                onClick={() => setShowCreateTask(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2D2D2D] text-[#71717A] hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Task Name *</label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white placeholder-[#52525B] focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter task name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white placeholder-[#52525B] focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  rows={3}
                  placeholder="Describe the task..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white placeholder-[#52525B] focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Design, Frontend, API..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 px-4 py-3 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#A1A1AA] rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2D2D2D]">
              <h2 className="text-lg font-semibold text-white">Team Members</h2>
              <button
                onClick={() => setShowMembersModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2D2D2D] text-[#71717A] hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {project.members?.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{member.name}</div>
                    <div className="text-[#71717A] text-sm">{member.email}</div>
                  </div>
                  <span className="px-2 py-1 bg-[#2D2D2D] rounded-md text-xs text-[#A1A1AA]">
                    {member.role || 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
