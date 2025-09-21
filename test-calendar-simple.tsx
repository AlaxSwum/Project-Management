'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';

export default function TestCalendar() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | '15min'>('month');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="calendar-container">
      {isMobile && <MobileHeader title="Calendar" isMobile={isMobile} />}
      
      <div style={{ display: 'flex', width: '100%' }}>
        {!isMobile && <Sidebar />}
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ background: '#ffffff', padding: '2rem', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                <CalendarIcon style={{ width: '32px', height: '32px' }} />
                Enhanced Calendar
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* View Toggle */}
                <div style={{
                  display: 'flex',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '2px solid #e5e7eb',
                  gap: '2px'
                }}>
                  {[
                    { key: 'month', label: 'Month' },
                    { key: 'week', label: 'Week' },
                    { key: 'day', label: 'Day' },
                    { key: '15min', label: '15 Min' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCalendarView(key as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: calendarView === key ? '#3b82f6' : 'transparent',
                        color: calendarView === key ? '#ffffff' : '#6b7280',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <main style={{ padding: '2rem', flex: 1 }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                {calendarView.toUpperCase()} VIEW
              </h2>
              <p>Calendar view: {calendarView}</p>
              <p>This is where the {calendarView} calendar content will be displayed.</p>
              
              {calendarView === 'day' && (
                <div style={{ marginTop: '2rem' }}>
                  <h3>Day View Features:</h3>
                  <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                    <li>15-minute time blocks</li>
                    <li>Drag & drop task scheduling</li>
                    <li>Side panel for unscheduled tasks</li>
                    <li>Visual time blocking</li>
                  </ul>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
