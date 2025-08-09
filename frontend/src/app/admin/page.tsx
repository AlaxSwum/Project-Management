'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user?.role || (user as any)?.user_metadata?.role;
    const isAdmin = role === 'admin' || role === 'hr' || (user as any)?.is_superuser || (user as any)?.is_staff;
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) return null;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
      <p style={{ color: '#6b7280' }}>Internal tools and overviews will appear here.</p>
    </div>
  );
}


