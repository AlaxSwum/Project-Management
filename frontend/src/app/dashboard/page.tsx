'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { PlusIcon, UsersIcon, CalendarIcon, SparklesIcon, ChevronRightIcon, FolderIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import DatePicker from '@/components/DatePicker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: number;
  name: string;
  description: string;
  project_type?: string;
  status?: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: any[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by: any;
  timeline_folder_id?: number;
}

interface TimelineFolder {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
  item_count?: number;
  completed_count?: number;
  categories?: { id: number; name: string; color: string }[];
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timelineFolders, setTimelineFolders] = useState<TimelineFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'projects' | 'timeline'>('all');
  const [selectedTimelineFolder, setSelectedTimelineFolder] = useState<TimelineFolder | null>(null);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    project_type: 'general',
    color: '#FFB333',
  });
  const router = useRouter();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProjects();
    fetchTimelineFolders();
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err: any) {
      // Projects table may not exist, that's OK
      console.log('Projects table not available');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimelineItems = async (folderId: number) => {
    try {
      const { data, error } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('folder_id', folderId)
        .order('start_date');
      
      if (!error && data) {
        setTimelineItems(data);
      }
    } catch (error) {
      console.error('Error fetching timeline items:', error);
    }
  };

  // When a timeline folder is selected, fetch its items
  useEffect(() => {
    if (selectedTimelineFolder) {
      fetchTimelineItems(selectedTimelineFolder.id);
    }
  }, [selectedTimelineFolder]);

  const fetchTimelineFolders = async () => {
    if (!user?.id) return;
    
    try {
      const userId = parseInt(user.id.toString());
      
      // Get folders the user has access to
      const { data: memberData } = await supabase
        .from('timeline_folder_members')
        .select('folder_id')
        .eq('user_id', userId);
      
      const folderIds = memberData?.map(m => m.folder_id) || [];
      
      if (folderIds.length === 0) {
        setTimelineFolders([]);
        return;
      }
      
      // Get folder details
      const { data: folders, error } = await supabase
        .from('timeline_folders')
        .select('*')
        .in('id', folderIds)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      // Get item counts and categories for each folder
      const foldersWithCounts = await Promise.all(
        (folders || []).map(async (folder) => {
          const { data: items } = await supabase
            .from('timeline_items')
            .select('id, status')
            .eq('folder_id', folder.id);
          
          // Get categories for this folder
          const { data: categories } = await supabase
            .from('timeline_categories')
            .select('id, name, color')
            .eq('folder_id', folder.id)
            .eq('is_active', true)
            .is('parent_category_id', null)
            .order('display_order');
          
          return {
            ...folder,
            item_count: items?.length || 0,
            completed_count: items?.filter(i => i.status === 'completed').length || 0,
            categories: categories || []
          };
        })
      );
      
      setTimelineFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching timeline folders:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = parseInt(user?.id?.toString() || '0');
      
      // If project type is timeline, create timeline folder only
      if (newProject.project_type === 'timeline') {
        // Create timeline folder
        const { data: folderData, error: folderError } = await supabase
          .from('timeline_folders')
          .insert([{
            name: newProject.name,
            description: newProject.description || `Timeline project: ${newProject.name}`,
            created_by_id: userId,
            is_active: true,
            total_budget: 0,
            currency: 'USD'
          }])
          .select()
          .single();
        
        if (folderError) throw folderError;
        
        // Add user as folder owner
        await supabase
          .from('timeline_folder_members')
          .insert([{
            folder_id: folderData.id,
            user_id: userId,
            role: 'owner',
            can_edit: true,
            can_delete: true,
            can_manage_members: true,
            can_manage_budget: true
          }]);
        
        fetchTimelineFolders();
      } else {
        // For other project types, try to create in projects table
    try {
      const project = await projectService.createProject(newProject);
      setProjects([project, ...projects]);
        } catch (projectErr) {
          console.log('Projects table not available, skipping');
        }
      }
      
      setNewProject({ 
        name: '', 
        description: '', 
        project_type: 'general', 
        color: '#FFB333' 
      });
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <>
        <style jsx>{`
          .loading-container {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            position: relative;
            overflow: hidden;
          }
          
          .loading-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 179, 51, 0.1) 0%, transparent 70%);
            animation: float 8s ease-in-out infinite;
          }
          
          .spinner-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            z-index: 1;
          }
          
          .spinner {
            width: 3rem;
            height: 3rem;
            border: 4px solid rgba(255, 179, 51, 0.2);
            border-top: 4px solid #FFB333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          .loading-text {
            color: #6B7280;
            font-size: 1rem;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
          }
        `}</style>
        <div className="loading-container">
          <div className="spinner-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          position: relative;
          overflow: hidden;
        }
        
        .dashboard-container::before {
          content: '';
          position: absolute;
          top: -30%;
          left: -20%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle, rgba(255, 179, 51, 0.06) 0%, transparent 60%);
          animation: float 15s ease-in-out infinite;
        }
        
        .dashboard-container::after {
          content: '';
          position: absolute;
          bottom: -30%;
          right: -20%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(196, 131, 217, 0.05) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite reverse;
        }
        
        .main-content {
          flex: 1;
          margin-left: ${isMobile ? '0' : '280px'};
          background: transparent;
          position: relative;
          z-index: 1;
          padding: ${isMobile ? '0 12px' : '0'};
        }
        
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding: ${isMobile ? '1.5rem 1rem' : '3rem 2rem'};
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        
        .header-content {
          display: flex;
          align-items: ${isMobile ? 'flex-start' : 'center'};
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
          flex-direction: ${isMobile ? 'column' : 'row'};
          gap: ${isMobile ? '1rem' : '0'};
        }
        
        .welcome-section {
          position: relative;
        }
        
        .welcome-section::before {
          content: '';
          position: absolute;
          top: -0.5rem;
          left: -1rem;
          width: 4px;
          height: calc(100% + 1rem);
          background: linear-gradient(180deg, #FFB333, #FFD480);
          border-radius: 2px;
          opacity: 0.7;
        }
        
        .welcome-section h1 {
          font-size: 3rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1F2937 0%, #4B5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1rem 0;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.03em;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .welcome-section p {
          color: #6B7280;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          opacity: 0.9;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .project-count {
          background: rgba(255, 179, 51, 0.1);
          border: 1px solid rgba(255, 179, 51, 0.2);
          padding: 0.75rem 1.25rem;
          border-radius: 16px;
          color: #92400E;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .create-button {
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border: none;
          padding: 1rem 2rem;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.25);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
        }
        
        .create-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }
        
        .create-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255, 179, 51, 0.35);
        }
        
        .create-button:hover::before {
          left: 100%;
        }
        
        .main-content-area {
          padding: 4rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .content-header {
          margin-bottom: 3rem;
          text-align: center;
        }
        
        .content-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0 0 0.75rem 0;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.02em;
        }
        
        .content-subtitle {
          color: #6B7280;
          font-size: 1.125rem;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #DC2626;
          padding: 1.25rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal-content {
          background: #FFFFFF;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.2s ease-out;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #E5E7EB;
          background: #F9FAFB;
        }
        
        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .modal-close-btn {
          width: 2rem;
          height: 2rem;
          border: none;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 500;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-close-btn:hover {
          background: #F3F4F6;
          color: #374151;
          border-color: #D1D5DB;
        }
        
        .project-form {
          padding: 2rem;
          flex: 1;
          overflow-y: auto;
        }
        
        .form-section {
          margin-bottom: 1.5rem;
        }
        
        .section-header {
          margin-bottom: 1rem;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0 0 0.25rem 0;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .section-subtitle {
          font-size: 0.75rem;
          color: #9CA3AF;
          margin: 0;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          transition: all 0.2s ease;
          background: #FFFFFF;
          color: #1F2937;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
        }
        
        .form-input::placeholder {
          color: #9CA3AF;
        }
        
        .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          transition: all 0.2s ease;
          background: #FFFFFF;
          color: #1F2937;
          resize: vertical;
          min-height: 80px;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
        }
        
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          background: #FFFFFF;
          color: #1F2937;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .form-select:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
        }
        
        .color-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
        }
        
        .color-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #FFFFFF;
        }
        
        .color-option:hover {
          border-color: #FFB333;
          background: #FFFBF6;
        }
        
        .color-option.selected {
          border-color: #FFB333;
          background: rgba(255, 179, 51, 0.05);
        }
        
        .color-indicator {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }
        
        .color-label {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #E5E7EB;
        }
        
        .btn-primary {
          flex: 1;
          background: #FFB333;
          color: #FFFFFF;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .btn-primary:hover {
          background: #F29F0A;
        }
        
        .btn-secondary {
          flex: 1;
          background: #FFFFFF;
          color: #6B7280;
          border: 1px solid #D1D5DB;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .btn-secondary:hover {
          background: #F9FAFB;
          border-color: #9CA3AF;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 4rem 0;
        }
        
        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 4px solid rgba(255, 179, 51, 0.2);
          border-top: 4px solid #FFB333;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .empty-state {
          text-align: center;
          padding: 6rem 2rem;
          position: relative;
        }
        
        .empty-state::before {
          content: '';
          position: absolute;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255, 179, 51, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          z-index: -1;
        }
        
        .empty-icon {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, rgba(255, 179, 51, 0.1), rgba(255, 179, 51, 0.05));
          border: 2px solid rgba(255, 179, 51, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        
        .empty-icon::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 179, 51, 0.1), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
        
        .empty-icon:hover {
          background: linear-gradient(135deg, rgba(255, 179, 51, 0.15), rgba(255, 179, 51, 0.08));
          transform: scale(1.05);
          border-color: rgba(255, 179, 51, 0.3);
        }
        
        .empty-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 1rem;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.02em;
        }
        
        .empty-description {
          color: #6B7280;
          margin-bottom: 2.5rem;
          font-size: 1.125rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        
        .empty-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 2rem;
        }
        
        .project-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        
        .project-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FFB333, #FFD480);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .project-card::after {
          content: '';
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 24px;
          height: 24px;
          background: rgba(255, 179, 51, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .project-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        
        .project-card:hover::before {
          opacity: 1;
        }
        
        .project-card:hover::after {
          opacity: 1;
        }
        
        .project-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .project-title {
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.75rem;
          font-size: 1.375rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          line-height: 1.3;
          letter-spacing: -0.02em;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: normal;
          hyphens: auto;
          max-width: 100%;
        }
        
        .project-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.75rem;
        }
        
        .project-badge {
          background: rgba(255, 179, 51, 0.1);
          border: 1px solid rgba(255, 179, 51, 0.2);
          padding: 0.375rem 0.875rem;
          border-radius: 12px;
          text-transform: capitalize;
          font-weight: 500;
          color: #92400E;
          letter-spacing: 0.025em;
        }
        
        .project-description {
          color: #6B7280;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .progress-section {
          margin-bottom: 1.5rem;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
          color: #6B7280;
          font-weight: 500;
        }
        
        .progress-bar {
          width: 100%;
          height: 10px;
          background: rgba(229, 231, 235, 0.5);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFB333, #FFD480);
          border-radius: 6px;
          transition: width 0.6s ease;
          position: relative;
        }
        
        .project-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #6B7280;
          padding-top: 1rem;
          border-top: 1px solid rgba(229, 231, 235, 0.3);
        }
        
        .project-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .project-stat {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 500;
        }
        
        .project-due {
          font-size: 0.75rem;
          color: #92400E;
          background: rgba(255, 179, 51, 0.1);
          padding: 0.375rem 0.75rem;
          border-radius: 10px;
          font-weight: 500;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 0 12px !important;
          }
          
          .header {
            padding: 1.5rem 1rem !important;
          }
          
          .header-content {
            flex-direction: column !important;
            gap: 1rem !important;
            align-items: flex-start !important;
          }
          
          .sidebar {
            display: none !important;
          }
          
          .header-actions {
            justify-content: space-between;
          }
          
          .create-button {
            width: 100%;
            justify-content: center;
            padding: 1.25rem;
          }
          
          .main-content-area {
            padding: 2rem 1rem;
          }
          
          .projects-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .project-card {
            padding: 1.5rem;
          }
          
          .modal-content {
            max-width: 95vw;
            margin: 0.5rem;
            max-height: 95vh;
            border-radius: 16px;
          }
          
          .color-swatches {
            grid-template-columns: repeat(4, 1fr);
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .empty-state {
            padding: 4rem 1rem;
          }
          
          .empty-icon {
            width: 100px;
            height: 100px;
          }
          
          .empty-title {
            font-size: 1.75rem;
          }
        }
        
        @media (max-width: 480px) {
          .header {
            padding: 1.5rem 1rem;
          }
          
          .welcome-section h1 {
            font-size: 2rem;
          }
          
          .main-content-area {
            padding: 1.5rem 1rem;
          }
          
          .projects-grid {
            gap: 1rem;
          }
          
          .project-card {
            padding: 1.25rem;
          }
          
          .color-swatches {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .color-swatch {
            width: 40px;
            height: 40px;
          }
          
          .empty-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
      
      <div className="dashboard-container">
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'white',
            zIndex: 1000,
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>
              Dashboard
            </h1>
            <button
              onClick={() => {
                console.log('Mobile menu clicked, current state:', showMobileMenu);
                setShowMobileMenu(!showMobileMenu);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#1F2937',
                padding: '8px',
                minWidth: '40px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showMobileMenu ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {isMobile && showMobileMenu && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9999,
              padding: '70px 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column'
            }} 
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }} 
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                  Navigation Menu
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6B7280' }}>
                  Choose where you'd like to go:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={() => { router.push('/personal'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Personal Tasks
                  </button>
                  <button 
                    onClick={() => { router.push('/my-tasks'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    My Tasks
                  </button>
                  <button 
                    onClick={() => { router.push('/calendar'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Calendar
                  </button>
                  <button 
                    onClick={() => { router.push('/company-outreach'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Company Outreach
                  </button>
                  <button 
                    onClick={() => { router.push('/content-calendar'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Content Calendar
                  </button>
                  <button 
                    onClick={() => { router.push('/password-manager'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Password Manager
                  </button>
                  <button 
                    onClick={() => { router.push('/timetable'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Timetable
                  </button>
                  <button 
                    onClick={() => { router.push('/classes'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Classes
                  </button>
                  <button 
                    onClick={() => { router.push('/reporting'); setShowMobileMenu(false); }} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      background: '#F8FAFC', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      width: '100%',
                      minHeight: '48px'
                    }}
                  >
                    Reports
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: '#3B82F6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  minHeight: '48px'
                }}
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        {!isMobile && (
          <Sidebar 
            projects={projects} 
            onCreateProject={() => setShowCreateForm(true)} 
          />
        )}
        
        <div className="main-content" style={{ paddingTop: isMobile ? '70px' : '0' }}>
          <header className="header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Welcome back, {user?.name || 'User'}</h1>
                <p>Manage your projects with style and efficiency</p>
              </div>
              <div className="header-actions">
                {(projects.length > 0 || timelineFolders.length > 0) && (
                  <div className="project-count">
                    <SparklesIcon style={{ width: '16px', height: '16px' }} />
                    {projects.length + timelineFolders.length} Active Item{(projects.length + timelineFolders.length) !== 1 ? 's' : ''}
                  </div>
                )}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="create-button"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
                  Create Project
                </button>
              </div>
            </div>
            
            {/* View Mode Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1.5rem',
              maxWidth: '1400px',
              margin: '1.5rem auto 0'
            }}>
              {[
                { id: 'all', label: 'All', icon: SparklesIcon },
                { id: 'projects', label: 'Projects', icon: FolderIcon },
                { id: 'timeline', label: 'Timeline', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    background: viewMode === tab.id ? 'linear-gradient(135deg, #FFB333, #FFD480)' : 'rgba(255,255,255,0.8)',
                    color: viewMode === tab.id ? '#fff' : '#6B7280',
                    boxShadow: viewMode === tab.id ? '0 4px 12px rgba(255, 179, 51, 0.3)' : 'none'
                  }}
                >
                  <tab.icon style={{ width: '18px', height: '18px' }} />
                  {tab.label}
                  {tab.id === 'projects' && projects.length > 0 && (
                    <span style={{
                      background: viewMode === tab.id ? 'rgba(255,255,255,0.3)' : 'rgba(255, 179, 51, 0.2)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem'
                    }}>
                      {projects.length}
                    </span>
                  )}
                  {tab.id === 'timeline' && timelineFolders.length > 0 && (
                    <span style={{
                      background: viewMode === tab.id ? 'rgba(255,255,255,0.3)' : 'rgba(255, 179, 51, 0.2)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem'
                    }}>
                      {timelineFolders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </header>

          <main className="main-content-area">
            {error && (
              <div className="error-message">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {projects.length > 0 && (
              <div className="content-header">
              </div>
            )}

            {showCreateForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title">Create New Project</h2>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="modal-close-btn"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleCreateProject} className="project-form">
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Project Information</h3>
                        <p className="section-subtitle">Basic details about your project</p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Project Name *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Enter a descriptive project name..."
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          placeholder="What is this project about? What are the main goals?"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Project Settings</h3>
                        <p className="section-subtitle">Customize your project type and appearance</p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Project Type</label>
                        <select
                          className="form-select"
                          value={newProject.project_type}
                          onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                        >
                          <option value="general">General Project</option>
                          <option value="timeline">Timeline Project (Gantt Chart)</option>
                          <option value="team">Team Project</option>
                          <option value="marketing">Marketing Campaign</option>
                          <option value="product">Product Development</option>
                          <option value="design">Design Project</option>
                          <option value="engineering">Engineering</option>
                          <option value="sales">Sales Project</option>
                          <option value="hr">HR Initiative</option>
                          <option value="finance">Finance Project</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Project Color</label>
                        <div className="color-options">
                          {[
                            { name: 'Yellow', value: '#FFB333' },
                            { name: 'Blue', value: '#5884FD' },
                            { name: 'Purple', value: '#C483D9' },
                            { name: 'Orange', value: '#F87239' },
                            { name: 'Green', value: '#10B981' },
                            { name: 'Gray', value: '#6B7280' }
                          ].map((color) => (
                            <div
                              key={color.value}
                              className={`color-option ${newProject.color === color.value ? 'selected' : ''}`}
                              onClick={() => setNewProject({ ...newProject, color: color.value })}
                            >
                              <div 
                                className="color-indicator" 
                                style={{ backgroundColor: color.value }} 
                              />
                              <span className="color-label">{color.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : (projects.length === 0 && timelineFolders.length === 0) ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <SparklesIcon style={{ width: '60px', height: '60px', color: '#FFB333' }} />
                </div>
                <h3 className="empty-title">Ready to start something amazing?</h3>
                <p className="empty-description">
                  Create your first project or timeline and begin organizing your work with our powerful project management tools.
                </p>
                <div className="empty-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="create-button"
                  >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                    Create Project
                  </button>
                  <button
                    onClick={() => router.push('/timeline')}
                    style={{
                      background: 'linear-gradient(135deg, #5884FD, #8BA4FE)',
                      color: '#fff',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: '0 8px 25px rgba(88, 132, 253, 0.25)'
                    }}
                  >
                    <ChartBarIcon style={{ width: '20px', height: '20px' }} />
                    Create Timeline
                  </button>
                </div>
              </div>
            ) : (
              <div className="projects-grid">
                {/* Show Projects */}
                {(viewMode === 'all' || viewMode === 'projects') && projects.map((project) => (
                  <div
                    key={`project-${project.id}`}
                    className="project-card"
                    onClick={() => project.timeline_folder_id 
                      ? router.push('/timeline') 
                      : router.push(`/projects/${project.id}`)
                    }
                    style={{ borderTop: `4px solid ${project.color || '#FFB333'}` }}
                  >
                    <div className="project-header">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <FolderIcon style={{ width: '20px', height: '20px', color: project.color || '#FFB333' }} />
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Project</span>
                        </div>
                        <h3 className="project-title" style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          lineHeight: '1.3',
                          hyphens: 'auto'
                        }}>{project.name}</h3>
                        <div className="project-badges">
                          <span className="project-badge">
                            {project.project_type?.replace('_', ' ') || 'General'}
                          </span>
                          <span className="project-badge">
                            {project.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="project-description">
                      {project.description || 'No description provided'}
                    </p>
                    
                    {(project.task_count && project.task_count > 0) && (
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Progress</span>
                          <span>{project.completed_task_count || 0} / {project.task_count} tasks</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${project.task_count > 0 ? ((project.completed_task_count || 0) / project.task_count) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="project-footer">
                      <div className="project-stats">
                        <div className="project-stat">
                          <UsersIcon style={{ width: '16px', height: '16px' }} />
                          {project.members?.length || 0}
                        </div>
                        <div className="project-stat">
                          <CalendarIcon style={{ width: '16px', height: '16px' }} />
                          {project.task_count || 0} tasks
                        </div>
                      </div>
                      {project.due_date && (
                        <div className="project-due">
                          Due {new Date(project.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show Timeline Folders as Normal Projects */}
                {(viewMode === 'all' || viewMode === 'timeline') && timelineFolders.map((folder) => (
                  <div
                    key={`timeline-${folder.id}`}
                    className="project-card"
                    onClick={() => setSelectedTimelineFolder(folder)}
                    style={{ borderTop: `4px solid ${folder.categories?.[0]?.color || '#FFB333'}` }}
                  >
                    <div className="project-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="project-title" style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          lineHeight: '1.3',
                          hyphens: 'auto'
                        }}>{folder.name}</h3>
                        <div className="project-badges">
                          {/* Show categories as badges */}
                          {folder.categories && folder.categories.length > 0 ? (
                            folder.categories.slice(0, 4).map(cat => (
                              <span 
                                key={cat.id} 
                                className="project-badge" 
                                style={{ 
                                  background: `${cat.color}15`, 
                                  borderColor: `${cat.color}30`, 
                                  color: cat.color 
                                }}
                              >
                                {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="project-badge">
                              Project
                            </span>
                          )}
                          {folder.categories && folder.categories.length > 4 && (
                            <span className="project-badge" style={{ background: '#f0f0f0', color: '#666' }}>
                              +{folder.categories.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="project-description">
                      {folder.description || 'Project with tasks and timeline'}
                    </p>
                    
                    {(folder.item_count || 0) > 0 && (
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Progress</span>
                          <span>{folder.completed_count || 0} / {folder.item_count || 0} tasks</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${(folder.item_count || 0) > 0 ? ((folder.completed_count || 0) / (folder.item_count || 1)) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="project-footer">
                      <div className="project-stats">
                        <div className="project-stat">
                          <CalendarIcon style={{ width: '16px', height: '16px' }} />
                          {folder.item_count || 0} tasks
                        </div>
                        {folder.total_budget > 0 && (
                          <div className="project-stat">
                            <span style={{ fontSize: '0.75rem' }}>{folder.currency}</span>
                            {folder.total_budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                      {folder.end_date && (
                        <div className="project-due">
                          Due {new Date(folder.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty state for filtered view */}
                {viewMode === 'projects' && projects.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <FolderIcon style={{ width: '48px', height: '48px', color: '#D1D5DB', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6B7280' }}>No projects yet. Create one to get started!</p>
                  </div>
                )}
                
                {viewMode === 'timeline' && timelineFolders.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <ChartBarIcon style={{ width: '48px', height: '48px', color: '#D1D5DB', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6B7280' }}>No timeline projects yet.</p>
                    <button
                      onClick={() => router.push('/timeline')}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: '#5884FD',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Go to Timeline
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Timeline Project Detail Modal */}
      {selectedTimelineFolder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setSelectedTimelineFolder(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e5e7eb',
              background: `linear-gradient(135deg, ${selectedTimelineFolder.categories?.[0]?.color || '#FFB333'}15, #fff)`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                    {selectedTimelineFolder.name}
                  </h2>
                  <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    {selectedTimelineFolder.description || 'Project overview'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setSelectedTimelineFolder(null); router.push('/timeline'); }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #FFB333, #FFD480)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Open Timeline View
                  </button>
                  <button
                    onClick={() => setSelectedTimelineFolder(null)}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      color: '#6b7280'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Categories */}
              {selectedTimelineFolder.categories && selectedTimelineFolder.categories.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {selectedTimelineFolder.categories.map(cat => (
                    <span key={cat.id} style={{
                      padding: '0.375rem 0.875rem',
                      background: `${cat.color}15`,
                      color: cat.color,
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: `1px solid ${cat.color}30`
                    }}>
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              padding: '1.5rem 2rem',
              background: '#fafafa',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFB333' }}>
                  {selectedTimelineFolder.item_count || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Tasks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981' }}>
                  {selectedTimelineFolder.completed_count || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Completed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3B82F6' }}>
                  {(selectedTimelineFolder.item_count || 0) - (selectedTimelineFolder.completed_count || 0)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>In Progress</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8B5CF6' }}>
                  {selectedTimelineFolder.item_count && selectedTimelineFolder.completed_count 
                    ? Math.round((selectedTimelineFolder.completed_count / selectedTimelineFolder.item_count) * 100)
                    : 0}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Progress</div>
              </div>
            </div>
            
            {/* Tasks List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                Tasks
              </h3>
              {timelineItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <p>No tasks yet in this project.</p>
                  <button
                    onClick={() => { setSelectedTimelineFolder(null); router.push('/timeline'); }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      background: '#FFB333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Add Tasks in Timeline
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {timelineItems.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: item.status === 'completed' ? '#f0fdf4' : '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${item.color || '#FFB333'}`
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: item.status === 'completed' ? '#10B981' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {item.status === 'completed' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          color: item.status === 'completed' ? '#6b7280' : '#1f2937',
                          textDecoration: item.status === 'completed' ? 'line-through' : 'none'
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          {item.phase} • {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '20px',
                        background: item.status === 'completed' ? '#dcfce7' : 
                                   item.status === 'in_progress' ? '#dbeafe' : 
                                   item.status === 'on_hold' ? '#fef3c7' : '#f3f4f6',
                        color: item.status === 'completed' ? '#16a34a' : 
                               item.status === 'in_progress' ? '#2563eb' : 
                               item.status === 'on_hold' ? '#d97706' : '#6b7280'
                      }}>
                        {item.status.replace('_', ' ')}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#3B82F6'
                      }}>
                        {item.completion_percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 