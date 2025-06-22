'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { PlusIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
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
    color: '#000000',
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
        color: '#000000' 
      });
      setShowCreateForm(false);
    } catch (err: any) {
      setError('Failed to create project');
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="loading-container" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
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
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
          }
          .dashboard-container {
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
            position: sticky;
            top: 0;
            z-index: 20;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-title {
            font-size: 1.75rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .header-subtitle {
            color: #666666;
            margin-top: 0.25rem;
            font-size: 0.95rem;
          }
          .create-button {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
          }
          .create-button:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .main-content-area {
            padding: 2rem;
          }
          .error-message {
            background: #ffffff;
            border: 2px solid #000000;
            color: #000000;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            font-weight: 500;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.2s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .modal-close-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: bold;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .modal-close-btn:hover {
            background: #e5e7eb;
            color: #374151;
          }
          .project-form {
            padding: 0 2rem 2rem 2rem;
            flex: 1;
            overflow-y: auto;
          }
          .form-section {
            margin-bottom: 2rem;
          }
          .form-section:last-child {
            margin-bottom: 0;
          }
          .section-header {
            margin-bottom: 1.5rem;
          }
          .section-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #000000;
            margin: 0 0 0.25rem 0;
          }
          .section-subtitle {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
          }
          .settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
          }
          .color-swatches {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.5rem;
          }
          .color-swatch {
            width: 40px;
            height: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }
          .color-swatch:hover {
            transform: scale(1.1);
            border-color: #000000;
          }
          .color-swatch.selected {
            border-color: #000000;
            border-width: 3px;
            transform: scale(1.05);
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

          .select-wrapper {
            position: relative;
          }
          .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
          }
          .form-select:focus {
            outline: none;
            border-color: #000000;
            background: #f9f9f9;
          }

          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            background: #f9f9f9;
          }
          .form-input::placeholder {
            color: #666666;
          }
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            resize: none;
            font-family: inherit;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
          }
          .btn-primary {
            flex: 1;
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 1rem;
          }
          .btn-primary:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .btn-secondary {
            flex: 1;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
          }
          .btn-secondary:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
          }
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #cccccc;
            border-top: 3px solid #000000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .empty-state {
            text-align: center;
            padding: 3rem 0;
          }
          .empty-icon {
            width: 64px;
            height: 64px;
            background: #f0f0f0;
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
          }
          .empty-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .empty-description {
            color: #666666;
            margin-bottom: 1.5rem;
          }
          .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
          }
          .project-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 4px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }
          .project-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .project-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .project-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }
          .project-badges {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
          }
          .project-badge {
            background: #f0f0f0;
            border: 1px solid #000000;
            padding: 0.25rem 0.5rem;
            border-radius: 2px;
            text-transform: capitalize;
            font-weight: 500;
          }
          .project-description {
            color: #666666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            line-height: 1.4;
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
            color: #666666;
          }
          .progress-bar {
            width: 100%;
            height: 6px;
            background: #f0f0f0;
            border: 1px solid #000000;
            border-radius: 0;
          }
          .progress-fill {
            height: 100%;
            background: #000000;
            transition: width 0.3s ease;
          }
          .project-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #666666;
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
          }
          /* Mobile First Responsive Design */
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
            .header-title {
              font-size: 1.5rem;
            }
            .create-button {
              width: 100%;
              justify-content: center;
              padding: 1rem;
            }
            .main-content-area {
              padding: 1rem;
            }
            .projects-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .project-card {
              padding: 1rem;
            }
            .project-header {
              flex-direction: column;
              gap: 0.5rem;
              align-items: flex-start;
            }
            .modal-content {
              max-width: 95vw;
              margin: 0.5rem;
              max-height: 95vh;
            }
            .modal-header {
              padding: 1rem 1rem 0.5rem 1rem;
            }
            .modal-title {
              font-size: 1.25rem;
            }
            .project-form {
              padding: 0 1rem 1rem 1rem;
            }
            .settings-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }
            .color-swatches {
              grid-template-columns: repeat(4, 1fr);
            }
            .color-swatch {
              width: 35px;
              height: 35px;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.25rem;
            }
            .main-content-area {
              padding: 0.75rem;
            }
            .project-card {
              padding: 0.75rem;
            }
            .project-title {
              font-size: 1rem;
            }
            .modal-content {
              max-width: 98vw;
              margin: 0.25rem;
            }
            .modal-header {
              padding: 0.75rem;
            }
            .project-form {
              padding: 0 0.75rem 0.75rem 0.75rem;
            }
            .color-swatches {
              grid-template-columns: repeat(3, 1fr);
            }
            .color-swatch {
              width: 30px;
              height: 30px;
            }
          }
          
          @media (min-width: 769px) and (max-width: 1024px) {
            .main-content {
              margin-left: 200px;
            }
            .projects-grid {
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }
            .modal-content {
              max-width: 80vw;
            }
          }
          
          @media (min-width: 1025px) {
            .projects-grid {
              grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            }
            .modal-content {
              max-width: 600px;
            }
          }
          .project-form {
              padding: 0 1.5rem 1.5rem 1.5rem;
            }
            .settings-grid {
              grid-template-columns: 1fr;
            }

            .color-swatches {
              grid-template-columns: repeat(5, 1fr);
              gap: 0.375rem;
            }
            .color-swatch {
              width: 32px;
              height: 32px;
            }
            .form-actions {
              flex-direction: column;
            }
            .btn-primary,
            .btn-secondary {
              width: 100%;
            }
          }
        `
      }} />
      
      <div className="dashboard-container">
      <Sidebar 
        projects={projects} 
        onCreateProject={() => setShowCreateForm(true)} 
      />
      
        <div className="main-content">
          <header className="header">
            <div className="header-content">
              <div>
                <h1 className="header-title">Home</h1>
                <p className="header-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="create-button"
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Create
                </button>
            </div>
          </div>
        </header>

          <main className="main-content-area">
          {error && (
              <div className="error-message">
                {error}
            </div>
          )}

          {showCreateForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                                <div className="modal-header">
                <h2 className="modal-title">
                  Create New Project
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="modal-close-btn"
                >
                  ×
                </button>
              </div>

                  <form onSubmit={handleCreateProject} className="project-form">
                    {/* Project Basics */}
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Project Information</h3>
                        <p className="section-subtitle">Basic details about your project</p>
                      </div>

                                        <div className="form-group">
                    <label className="form-label">
                      Project Name *
                    </label>
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
                    <label className="form-label">
                      Description
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="What is this project about? What are the main goals?"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                    </div>

                    {/* Project Settings */}
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Project Settings</h3>
                        <p className="section-subtitle">Customize your project type and appearance</p>
                      </div>

                      <div className="settings-grid">
                                            <div className="form-group">
                      <label className="form-label">
                        Project Type
                      </label>
                      <div className="select-wrapper">
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
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Project Color
                      </label>
                          <div className="color-swatches">
                            {[
                              { name: 'Blue', value: '#3B82F6' },
                              { name: 'Green', value: '#10B981' },
                              { name: 'Purple', value: '#8B5CF6' },
                              { name: 'Red', value: '#EF4444' },
                              { name: 'Orange', value: '#F59E0B' },
                              { name: 'Pink', value: '#EC4899' },
                              { name: 'Teal', value: '#14B8A6' },
                              { name: 'Indigo', value: '#6366F1' },
                              { name: 'Gray', value: '#6B7280' },
                              { name: 'Black', value: '#000000' }
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
                    </div>



                    {/* Form Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                                        <button
                    type="submit"
                    className="btn-primary"
                  >
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
                  <PlusIcon style={{ width: '32px', height: '32px', color: '#000000' }} />
                </div>
                <h3 className="empty-title">No projects yet</h3>
                <p className="empty-description">Create your first project to get started</p>
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
                    {project.description || 'No description'}
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
    </div>
  );
} 