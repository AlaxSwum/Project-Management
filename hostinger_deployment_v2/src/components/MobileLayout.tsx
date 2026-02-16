'use client';

import { useState, useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function MobileLayout({ children, title }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar,
          [class*="sidebar"],
          aside,
          nav[class*="side"] {
            display: none !important;
          }
          
          .main-content,
          .content,
          [class*="main-content"],
          [class*="content"] {
            margin-left: 0 !important;
            padding: 12px !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          
          .dashboard-container,
          .my-tasks-container,
          .calendar-container {
            flex-direction: column !important;
          }
          
          * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
      
      {isMobile && (
        <>
          {/* Mobile Header */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#0D0D0D',
            zIndex: 1000,
            padding: '12px 16px',
            borderBottom: '1px solid #1F1F1F',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
              {title}
            </h1>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: '8px',
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {showMobileMenu && (
            <div style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              padding: '16px'
            }} onClick={() => setShowMobileMenu(false)}>
              <div style={{
                background: '#1A1A1A',
                borderRadius: '12px',
                padding: '20px',
                maxHeight: '80vh',
                overflowY: 'auto',
                border: '1px solid #2D2D2D'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>Navigation</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="/dashboard" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Dashboard</a>
                    <a href="/personal" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Personal Tasks</a>
                    <a href="/my-tasks" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>My Tasks</a>
                    <a href="/calendar" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Calendar</a>
                    <a href="/company-outreach" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Company Outreach</a>
                    <a href="/content-calendar" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Content Calendar</a>
                    <a href="/password-manager" style={{ padding: '12px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', textDecoration: 'none', color: '#A1A1AA', display: 'block' }}>Password Manager</a>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10B981, #10B981)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      <div style={{ paddingTop: isMobile ? '70px' : '0' }}>
        {children}
      </div>
    </>
  );
}
