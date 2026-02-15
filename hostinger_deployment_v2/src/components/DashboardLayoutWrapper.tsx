'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsProvider } from '@/contexts/ProjectsContext';
import DashboardLayout from '@/components/DashboardLayout';

// Pages that should NOT have the sidebar
const NO_SIDEBAR_PAGES = ['/login', '/forgot-password', '/terms', '/privacy', '/oauth-test'];

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // Don't wrap with sidebar on auth/public pages
  const isPublicPage = NO_SIDEBAR_PAGES.some(page => pathname?.startsWith(page));
  
  if (isPublicPage || !isAuthenticated) {
    return <div className="min-h-full" style={{ background: '#F5F5ED' }}>{children}</div>;
  }

  return (
    <ProjectsProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ProjectsProvider>
  );
}
