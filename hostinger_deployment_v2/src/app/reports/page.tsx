'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface Company {
  id: number;
  name: string;
  description: string;
  created_by: number;
  member_count?: number;
  dept_count?: number;
}

export default function ReportsCompanyListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let companiesData: any[] = [];

      if (isAdmin) {
        const { data, error } = await supabase.from('org_companies').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        companiesData = data || [];
      } else {
        const { data: memberships } = await supabase.from('org_company_members').select('company_id').eq('user_id', user.id);
        const companyIds = (memberships || []).map((m: any) => m.company_id);
        if (companyIds.length > 0) {
          const { data } = await supabase.from('org_companies').select('*').in('id', companyIds).order('created_at', { ascending: false });
          companiesData = data || [];
        }
      }

      if (companiesData.length > 0) {
        const ids = companiesData.map((c: any) => c.id);
        const [membersRes, deptsRes] = await Promise.all([
          supabase.from('org_company_members').select('company_id').in('company_id', ids),
          supabase.from('org_departments').select('company_id').in('company_id', ids),
        ]);

        const memberCounts: Record<number, number> = {};
        const deptCounts: Record<number, number> = {};
        (membersRes.data || []).forEach((m: any) => { memberCounts[m.company_id] = (memberCounts[m.company_id] || 0) + 1; });
        (deptsRes.data || []).forEach((d: any) => { deptCounts[d.company_id] = (deptCounts[d.company_id] || 0) + 1; });

        companiesData = companiesData.map((c: any) => ({
          ...c,
          member_count: memberCounts[c.id] || 0,
          dept_count: deptCounts[c.id] || 0,
        }));
      }

      setCompanies(companiesData);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!authLoading && user) fetchCompanies();
  }, [authLoading, user, fetchCompanies]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Reports</h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>View employee daily reports by company</p>
          </div>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div style={{ color: '#71717A', textAlign: 'center', padding: '3rem' }}>Loading companies...</div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A' }}>
            <ChartBarIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem' }}>No companies available</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>You need to be a member of a company to view reports.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {companies.map((company) => (
              <div
                key={company.id}
                style={{
                  background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem',
                  padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => router.push(`/reports/${company.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.0625rem', fontWeight: 600, margin: 0 }}>{company.name}</h3>
                    {company.description && (
                      <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{company.description}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                    <UsersIcon style={{ width: '14px', height: '14px' }} />
                    {company.member_count || 0} members
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                    <FolderIcon style={{ width: '14px', height: '14px' }} />
                    {company.dept_count || 0} departments
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
