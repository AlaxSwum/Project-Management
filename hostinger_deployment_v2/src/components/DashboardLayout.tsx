'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import GlobalMessageNotification from '@/components/GlobalMessageNotification';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Don't render sidebar on login/auth pages
  const noSidebarPages = ['/login', '/forgot-password', '/terms', '/privacy', '/oauth-test'];
  const showSidebar = !noSidebarPages.some(page => pathname?.startsWith(page));

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      <GlobalMessageNotification />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileHeader title="" isMobile={isMobile} />}
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px', 
          flex: 1, 
          minHeight: '100vh',
          width: isMobile ? '100%' : 'calc(100% - 256px)'
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
