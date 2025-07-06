'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { PlusIcon, UsersIcon, CalendarIcon, ChartBarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import DatePicker from '@/components/DatePicker';

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
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    project_type: 'general',
    color: '#FFB333',
  });
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProjects();
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = await projectService.createProject(newProject);
      setProjects([project, ...projects]);
      setNewProject({ 
        name: '', 
        description: '', 
        project_type: 'general', 
        color: '#FFB333' 
      });
      setShowCreateForm(false);
    } catch (err: any) {
      setError('Failed to create project');
    }
  };

  // Calculate dashboard stats
  const totalProjects = projects.length;
  const activeTasks = projects.reduce((sum, project) => sum + (project.task_count || 0), 0);
  const completedTasks = projects.reduce((sum, project) => sum + (project.completed_task_count || 0), 0);
  const teamMembers = projects.reduce((sum, project) => sum + (project.members?.length || 0), 0);

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
          }
          .spinner {
            width: 2rem;
            height: 2rem;
            border: 3px solid transparent;
            border-top: 3px solid #FFB333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container">
          <div className="spinner"></div>
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
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 179, 51, 0.05) 0%, transparent 70%);
          animation: float 12s ease-in-out infinite;
        }
        
        .dashboard-container::after {
          content: '';
          position: absolute;
          top: 20%;
          right: -30%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(196, 131, 217, 0.04) 0%, transparent 70%);
          animation: float 15s ease-in-out infinite reverse;
        }
        
        .main-content {
          flex: 1;
          margin-left: 280px;
          background: transparent;
          position: relative;
          z-index: 1;
        }
        
        .header {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .welcome-section h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0 0 0.5rem 0;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.025em;
        }
        
        .welcome-section p {
          color: #6B7280;
          margin: 0;
          font-size: 1rem;
        }
        
        .header-stats {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        
        .quick-stat {
          text-align: center;
        }
        
        .quick-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0;
        }
        
        .quick-stat-label {
          font-size: 0.75rem;
          color: #6B7280;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        
        .create-button {
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border: none;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        
        .create-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .create-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.4);
        }
        
        .create-button:hover::before {
          left: 100%;
        }
        
        .main-content-area {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          transition: opacity 0.3s ease;
        }
        
        .stat-card.primary::before {
          background: linear-gradient(90deg, #FFB333, #FFD480);
        }
        
        .stat-card.blue::before {
          background: linear-gradient(90deg, #5884FD, #8BA4FE);
        }
        
        .stat-card.purple::before {
          background: linear-gradient(90deg, #C483D9, #D9A3E6);
        }
        
        .stat-card.orange::before {
          background: linear-gradient(90deg, #F87239, #FBA173);
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
        }
        
        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .stat-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }
        
        .stat-icon.primary {
          background: linear-gradient(135deg, #FFB333, #FFD480);
        }
        
        .stat-icon.blue {
          background: linear-gradient(135deg, #5884FD, #8BA4FE);
        }
        
        .stat-icon.purple {
          background: linear-gradient(135deg, #C483D9, #D9A3E6);
        }
        
        .stat-icon.orange {
          background: linear-gradient(135deg, #F87239, #FBA173);
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0;
          font-family: 'Inter', sans-serif;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
          margin: 0;
          font-weight: 500;
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #DC2626;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 50;
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease-out;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 1px solid rgba(229, 231, 235, 0.3);
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0;
          font-family: 'Inter', sans-serif;
        }
        
        .modal-close-btn {
          width: 2rem;
          height: 2rem;
          border: none;
          background: rgba(243, 244, 246, 0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: bold;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-close-btn:hover {
          background: rgba(229, 231, 235, 0.8);
          color: #374151;
          transform: scale(1.1);
        }
        
        .project-form {
          padding: 0 2rem 2rem 2rem;
          flex: 1;
          overflow-y: auto;
        }
        
        .form-section {
          margin-bottom: 2rem;
        }
        
        .section-header {
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0 0 0.25rem 0;
          font-family: 'Inter', sans-serif;
        }
        
        .section-subtitle {
          font-size: 0.875rem;
          color: #6B7280;
          margin: 0;
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
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
          color: #1F2937;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .form-input:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .form-input::placeholder {
          color: #9CA3AF;
        }
        
        .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
          color: #1F2937;
          resize: vertical;
          min-height: 80px;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .form-select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          background: rgba(255, 255, 255, 0.8);
          color: #1F2937;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .form-select:focus {
          outline: none;
          border-color: #FFB333;
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
        }
        
        .color-swatches {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
        }
        
        .color-swatch {
          width: 40px;
          height: 40px;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .color-swatch:hover {
          transform: scale(1.1);
          border-color: #FFB333;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .color-swatch.selected {
          border-color: #FFB333;
          border-width: 3px;
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.2);
        }
        
        .color-swatch.selected::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: 0.875rem;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(229, 231, 235, 0.3);
        }
        
        .btn-primary {
          flex: 1;
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.4);
        }
        
        .btn-secondary {
          flex: 1;
          background: rgba(255, 255, 255, 0.8);
          color: #6B7280;
          border: 2px solid #E5E7EB;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-family: 'Inter', sans-serif;
        }
        
        .btn-secondary:hover {
          background: rgba(243, 244, 246, 0.8);
          border-color: #D1D5DB;
          transform: translateY(-1px);
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 3rem 0;
        }
        
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(255, 179, 51, 0.2);
          border-top: 3px solid #FFB333;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 179, 51, 0.1);
          border: 2px solid rgba(255, 179, 51, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          transition: all 0.3s ease;
        }
        
        .empty-icon:hover {
          background: rgba(255, 179, 51, 0.15);
          transform: scale(1.05);
        }
        
        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.5rem;
          font-family: 'Inter', sans-serif;
        }
        
        .empty-description {
          color: #6B7280;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .project-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .project-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #FFB333, #FFD480);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
        }
        
        .project-card:hover::before {
          opacity: 1;
        }
        
        .project-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .project-title {
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.5rem;
          font-size: 1.125rem;
          font-family: 'Inter', sans-serif;
          line-height: 1.4;
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
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          text-transform: capitalize;
          font-weight: 500;
          color: #92400E;
        }
        
        .project-description {
          color: #6B7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .progress-section {
          margin-bottom: 1rem;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(229, 231, 235, 0.5);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFB333, #FFD480);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        
        .project-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #6B7280;
        }
        
        .project-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .project-stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .project-due {
          font-size: 0.75rem;
          color: #92400E;
          background: rgba(255, 179, 51, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
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
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }
          
          .header {
            padding: 1rem;
          }
          
          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .header-stats {
            justify-content: space-around;
          }
          
          .create-button {
            width: 100%;
            justify-content: center;
            padding: 1rem;
          }
          
          .main-content-area {
            padding: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .projects-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .project-card {
            padding: 1rem;
          }
          
          .modal-content {
            max-width: 95vw;
            margin: 0.5rem;
            max-height: 95vh;
          }
          
          .color-swatches {
            grid-template-columns: repeat(4, 1fr);
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
        
        @media (max-width: 480px) {
          .header {
            padding: 0.75rem;
          }
          
          .main-content-area {
            padding: 0.75rem;
          }
          
          .project-card {
            padding: 0.75rem;
          }
          
          .color-swatches {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .color-swatch {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
      
      <div className="dashboard-container">
        <Sidebar 
          projects={projects} 
          onCreateProject={() => setShowCreateForm(true)} 
        />
        
        <div className="main-content">
          <header className="header">
            <div className="header-content">
              <div className="header-left">
                <div className="welcome-section">
                  <h1>Welcome back, {user?.name || 'User'}</h1>
                  <p>Here's what's happening with your projects today</p>
                </div>
                <div className="header-stats">
                  <div className="quick-stat">
                    <p className="quick-stat-value">{totalProjects}</p>
                    <p className="quick-stat-label">Projects</p>
                  </div>
                  <div className="quick-stat">
                    <p className="quick-stat-value">{activeTasks}</p>
                    <p className="quick-stat-label">Active Tasks</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="create-button"
              >
                <PlusIcon style={{ width: '20px', height: '20px' }} />
                Create Project
              </button>
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

            {/* Dashboard Stats */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-header">
                  <div className="stat-icon primary">
                    <ChartBarIcon style={{ width: '24px', height: '24px' }} />
                  </div>
                </div>
                <p className="stat-value">{totalProjects}</p>
                <p className="stat-label">Total Projects</p>
              </div>
              
              <div className="stat-card blue">
                <div className="stat-header">
                  <div className="stat-icon blue">
                    <ClockIcon style={{ width: '24px', height: '24px' }} />
                  </div>
                </div>
                <p className="stat-value">{activeTasks}</p>
                <p className="stat-label">Active Tasks</p>
              </div>
              
              <div className="stat-card orange">
                <div className="stat-header">
                  <div className="stat-icon orange">
                    <CheckCircleIcon style={{ width: '24px', height: '24px' }} />
                  </div>
                </div>
                <p className="stat-value">{completedTasks}</p>
                <p className="stat-label">Completed Tasks</p>
              </div>
              
              <div className="stat-card purple">
                <div className="stat-header">
                  <div className="stat-icon purple">
                    <UsersIcon style={{ width: '24px', height: '24px' }} />
                  </div>
                </div>
                <p className="stat-value">{teamMembers}</p>
                <p className="stat-label">Team Members</p>
              </div>
            </div>

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
                        <div className="color-swatches">
                          {[
                            { name: 'Primary Yellow', value: '#FFB333' },
                            { name: 'Blue', value: '#5884FD' },
                            { name: 'Purple', value: '#C483D9' },
                            { name: 'Orange', value: '#F87239' },
                            { name: 'Green', value: '#10B981' },
                            { name: 'Red', value: '#EF4444' },
                            { name: 'Teal', value: '#14B8A6' },
                            { name: 'Indigo', value: '#6366F1' },
                            { name: 'Pink', value: '#EC4899' },
                            { name: 'Gray', value: '#6B7280' }
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={`color-swatch ${newProject.color === color.value ? 'selected' : ''}`}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setNewProject({ ...newProject, color: color.value })}
                              title={color.name}
                            />
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
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <PlusIcon style={{ width: '40px', height: '40px', color: '#FFB333' }} />
                </div>
                <h3 className="empty-title">No projects yet</h3>
                <p className="empty-description">Create your first project to get started with project management</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="create-button"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="project-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="project-title">{project.name}</h3>
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
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
} 