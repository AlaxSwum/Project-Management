'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  isMobile: boolean;
}

export default function MobileHeader({ title, isMobile }: MobileHeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Header */}
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
          {title}
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

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div style={{
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
        }} onClick={() => setShowMobileMenu(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Navigation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => { router.push('/dashboard'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => { router.push('/personal'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Personal Tasks
                </button>
                <button 
                  onClick={() => { router.push('/my-tasks'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  My Tasks
                </button>
                <button 
                  onClick={() => { router.push('/calendar'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Calendar
                </button>
                <button 
                  onClick={() => { router.push('/company-outreach'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Company Outreach
                </button>
                <button 
                  onClick={() => { router.push('/content-calendar'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Content Calendar
                </button>
                <button 
                  onClick={() => { router.push('/password-manager'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Password Manager
                </button>
                <button 
                  onClick={() => { router.push('/timetable'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Timetable
                </button>
                <button 
                  onClick={() => { router.push('/classes'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Classes
                </button>
                <button 
                  onClick={() => { router.push('/reporting'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#374151', width: '100%', minHeight: '48px' }}
                >
                  Reports
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowMobileMenu(false)}
              style={{ width: '100%', padding: '12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
