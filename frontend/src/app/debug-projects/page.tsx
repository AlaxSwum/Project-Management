'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { supabaseAuth } from '@/lib/supabase';

export default function DebugProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDebugInfo();
    }
  }, [isAuthenticated]);

  const fetchDebugInfo = async () => {
    try {
      console.log('Starting debug...');
      
      // Test authentication
      const authUser = await supabaseAuth.getUser();
      console.log('Auth User:', authUser);
      
      // Test projects
      const projectsData = await projectService.getProjects();
      console.log('Projects Data:', projectsData);
      
      setDebugInfo({
        user: user,
        authUser: authUser.user,
        projectsCount: projectsData.length
      });
      setProjects(projectsData);
      
    } catch (err: any) {
      console.error('Debug error:', err);
      setError(err.message);
    }
  };

  const testSingleProject = async (projectId: number) => {
    try {
      console.log('Testing project ID:', projectId);
      const project = await projectService.getProject(projectId);
      console.log('Single project result:', project);
      alert(`Project fetched successfully: ${project.name}`);
    } catch (err: any) {
      console.error('Single project error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Debug Projects Page</h1>
      
      <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
        <h3>Authentication Status:</h3>
        <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>User Email: {user?.email || 'None'}</p>
      </div>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
        <h3>Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
        <h3>Projects ({projects.length}):</h3>
        {projects.map(project => (
          <div key={project.id} style={{ background: 'white', padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px' }}>
            <p>ID: {project.id} | Name: {project.name}</p>
            <button 
              onClick={() => testSingleProject(project.id)}
              style={{ background: '#000', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Test This Project
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={fetchDebugInfo}
          style={{ background: '#000', color: 'white', padding: '1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh Debug Info
        </button>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{ background: '#666', color: 'white', padding: '1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '1rem' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
} 