'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function AbsencePage() {
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
          .absence-container {
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
          .hr-note {
            background: #f0f9ff;
            border: 2px solid #0369a1;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
            max-width: 600px;
          }
          .hr-note-title {
            font-size: 1.125rem;
            font-weight: bold;
            color: #0369a1;
            margin-bottom: 0.5rem;
          }
          .hr-note-text {
            color: #0c4a6e;
            line-height: 1.5;
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
            
            .hr-note {
              margin: 1rem;
              padding: 1rem;
            }
          }
        `
      }} />

      <div className="absence-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <main className="main-content">
          <header className="header">
            <h1 className="header-title">
              <DocumentTextIcon style={{ width: '32px', height: '32px' }} />
              Absence Management
            </h1>
            <p style={{ color: '#666666', marginTop: '0.25rem' }}>
              {user?.role === 'hr' || user?.role === 'admin' 
                ? 'Review and manage employee leave requests'
                : 'View your leave requests and balance'
              }
            </p>
          </header>

          <div className="coming-soon">
            <DocumentTextIcon className="coming-soon-icon" />
            <h2 className="coming-soon-title">Absence Management Coming Soon</h2>
            <p className="coming-soon-text">
              The absence management system is currently under development. This will provide a comprehensive 
              solution for managing employee leave requests, tracking leave balances, and streamlining the 
              approval process.
            </p>
            
            {user?.role === 'hr' || user?.role === 'admin' ? (
              <div className="hr-note">
                <div className="hr-note-title">🏢 HR Features Coming Soon</div>
                <div className="hr-note-text">
                  As an HR administrator, you'll have access to:
                  <br />• Review and approve/reject leave requests
                  <br />• View team absence calendar
                  <br />• Manage leave policies and balances
                  <br />• Generate absence reports and analytics
                  <br />• Set up automated notifications and reminders
                </div>
              </div>
            ) : (
              <div className="hr-note">
                <div className="hr-note-title">📝 Employee Features Coming Soon</div>
                <div className="hr-note-text">
                  As a team member, you'll be able to:
                  <br />• View your current leave balance
                  <br />• Submit leave requests with ease
                  <br />• Track the status of your requests
                  <br />• View upcoming team absences
                  <br />• Receive notifications about request updates
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 