'use client';

import { useState, useEffect } from 'react';

interface WorldClockProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
}

export default function WorldClock({ isMobile = false, isCollapsed = false }: WorldClockProps) {
  const [ukTime, setUkTime] = useState('');
  const [myanmarTime, setMyanmarTime] = useState('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      // Format UK time (Europe/London)
      const ukFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      // Format Myanmar time (Asia/Yangon)
      const myanmarFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Yangon',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      setUkTime(ukFormatter.format(now));
      setMyanmarTime(myanmarFormatter.format(now));
    };

    // Update immediately
    updateTimes();

    // Update every second
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 12px',
        background: 'rgba(255, 179, 51, 0.08)',
        borderRadius: '8px',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: '600',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '10px' }}>🇬🇧 UK:</span>
          <span style={{ 
            color: '#1F2937', 
            fontFamily: 'monospace',
            letterSpacing: '0.5px'
          }}>{ukTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '10px' }}>🇲🇲 Myanmar:</span>
          <span style={{ 
            color: '#1F2937', 
            fontFamily: 'monospace',
            letterSpacing: '0.5px'
          }}>{myanmarTime}</span>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 8px',
        background: 'rgba(255, 179, 51, 0.08)',
        borderRadius: '8px',
        marginTop: '8px',
        fontSize: '10px',
        fontWeight: '600',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ color: '#666', fontSize: '9px' }}>🇬🇧</span>
          <span style={{ 
            color: '#1F2937', 
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.3px'
          }}>{ukTime}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ color: '#666', fontSize: '9px' }}>🇲🇲</span>
          <span style={{ 
            color: '#1F2937', 
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.3px'
          }}>{myanmarTime}</span>
        </div>
      </div>
    );
  }

  // Desktop non-collapsed view
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      background: 'rgba(255, 179, 51, 0.08)',
      borderRadius: '10px',
      marginTop: '8px',
      fontSize: '13px',
      fontWeight: '600',
      border: '1px solid rgba(255, 179, 51, 0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666', fontSize: '11px' }}>🇬🇧 UK:</span>
        <span style={{ 
          color: '#1F2937', 
          fontFamily: 'monospace',
          letterSpacing: '0.5px',
          fontSize: '14px'
        }}>{ukTime}</span>
      </div>
      <div style={{ 
        height: '1px', 
        background: 'rgba(255, 179, 51, 0.2)',
        margin: '0 -4px'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666', fontSize: '11px' }}>🇲🇲 Myanmar:</span>
        <span style={{ 
          color: '#1F2937', 
          fontFamily: 'monospace',
          letterSpacing: '0.5px',
          fontSize: '14px'
        }}>{myanmarTime}</span>
      </div>
    </div>
  );
}

