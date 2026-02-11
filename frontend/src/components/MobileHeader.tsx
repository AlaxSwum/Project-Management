'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import WorldClock from './WorldClock';

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
        background: 'rgba(13, 13, 13, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        padding: '12px 16px',
        borderBottom: '1px solid #1F1F1F',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
            {title}
          </h1>
          <button
            onClick={() => {
              console.log('Mobile menu clicked, current state:', showMobileMenu);
              setShowMobileMenu(!showMobileMenu);
            }}
            style={{
              background: showMobileMenu ? 'linear-gradient(135deg, #10B981, #10B981)' : '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '12px',
              cursor: 'pointer',
              color: showMobileMenu ? '#FFFFFF' : '#FFFFFF',
              padding: '10px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: showMobileMenu ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {showMobileMenu ? (
              <XMarkIcon style={{ width: '24px', height: '24px' }} />
            ) : (
              <Bars3Icon style={{ width: '24px', height: '24px' }} />
            )}
          </button>
        </div>
        <WorldClock isMobile={true} />
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
            background: '#1A1A1A',
            borderRadius: '12px',
            padding: '24px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '1px solid #2D2D2D'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>Navigation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => { router.push('/dashboard'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => { router.push('/personal'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Personal Tasks
                </button>
                <button 
                  onClick={() => { router.push('/my-tasks'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  My Tasks
                </button>
                <button 
                  onClick={() => { router.push('/calendar'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Calendar
                </button>
                <button 
                  onClick={() => { router.push('/company-outreach'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Company Outreach
                </button>
                <button 
                  onClick={() => { router.push('/content-calendar'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Content Calendar
                </button>
                <button 
                  onClick={() => { router.push('/daily-reports'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Daily Reports
                </button>
                <button 
                  onClick={() => { router.push('/expenses'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Expenses
                </button>
                <button 
                  onClick={() => { router.push('/password-manager'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Password Manager
                </button>
                <button 
                  onClick={() => { router.push('/timetable'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Timetable
                </button>
                <button 
                  onClick={() => { router.push('/classes'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
                >
                  Classes
                </button>
                <button 
                  onClick={() => { router.push('/reporting'); setShowMobileMenu(false); }} 
                  style={{ padding: '16px', textAlign: 'left', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', color: '#A1A1AA', width: '100%', minHeight: '48px' }}
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
                background: 'linear-gradient(135deg, #10B981, #10B981)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
