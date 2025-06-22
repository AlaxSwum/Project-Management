'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function WeeklyReportPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
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
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
          }
          .weekly-report-container {
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
          }
          .header-title {
            font-size: 1.75rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .coming-soon {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            padding: 2rem;
          }
          .coming-soon-icon {
            width: 120px;
            height: 120px;
            color: #e5e7eb;
            margin-bottom: 2rem;
          }
          .coming-soon-title {
            font-size: 2rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 1rem;
          }
          .coming-soon-text {
            font-size: 1.125rem;
            color: #666666;
            line-height: 1.6;
            max-width: 600px;
          }
          
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .header {
              padding: 1rem;
            }
            
            .header-title {
              font-size: 1.5rem;
            }
            
            .coming-soon {
              padding: 1rem;
              min-height: 50vh;
            }
            
            .coming-soon-icon {
              width: 80px;
              height: 80px;
            }
            
            .coming-soon-title {
              font-size: 1.5rem;
            }
            
            .coming-soon-text {
              font-size: 1rem;
            }
          }
        `
      }} />

      <div className="weekly-report-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <ClipboardDocumentListIcon style={{ width: '32px', height: '32px' }} />
              Weekly Report
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              Submit and view weekly progress reports
            </p>
          </header>

          <div className="coming-soon">
            <ClipboardDocumentListIcon className="coming-soon-icon" />
            <h2 className="coming-soon-title">Weekly Reports Coming Soon</h2>
            <p className="coming-soon-text">
              The weekly report feature is currently under development. This will allow team members to submit 
              weekly progress reports and enable HR to review team productivity, accomplishments, and challenges. 
              Reports will include task completion metrics, project updates, and goal progress tracking.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
} 