'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ChevronRightIcon,
  FolderIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Department {
  id: number;
  name: string;
  description: string;
  member_count: number;
}

export default function ReportsDepartmentListPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.companyId);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch company name
      const { data: companyData } = await supabase.from('org_companies').select('name').eq('id', companyId).single();
      setCompanyName(companyData?.name || '');

      // Fetch departments
      const { data: deptData } = await supabase.from('org_departments').select('*').eq('company_id', companyId).order('created_at', { ascending: true });
      let deptList = deptData || [];

      if (deptList.length > 0) {
        const deptIds = deptList.map((d: any) => d.id);

        // Get department member counts
        const { data: deptMembers } = await supabase.from('org_department_members').select('department_id').in('department_id', deptIds);
        const countMap: Record<number, number> = {};
        (deptMembers || []).forEach((dm: any) => { countMap[dm.department_id] = (countMap[dm.department_id] || 0) + 1; });

        // Only show departments the user is assigned to
        const { data: myDeptMemberships } = await supabase.from('org_department_members').select('department_id').eq('user_id', user.id).in('department_id', deptIds);
        const myDeptIds = (myDeptMemberships || []).map((m: any) => m.department_id);
        deptList = deptList.filter((d: any) => myDeptIds.includes(d.id));

        const enrichedDepts = deptList.map((d: any) => ({ ...d, member_count: countMap[d.id] || 0 }));
        setDepartments(enrichedDepts);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

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
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href="/reports" style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>Reports</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{companyName}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{companyName}</h1>
          <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>Select a department to view reports</p>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div style={{ color: '#71717A', textAlign: 'center', padding: '3rem' }}>Loading departments...</div>
        ) : departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A', background: '#1A1A1A', borderRadius: '1rem', border: '1px solid #2D2D2D' }}>
            <ChartBarIcon style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p>No departments available</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {departments.map((dept) => (
              <div
                key={dept.id}
                style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => router.push(`/reports/${companyId}/${dept.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderIcon style={{ width: '18px', height: '18px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{dept.name}</h3>
                    {dept.description && <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.125rem 0 0' }}>{dept.description}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                  <UsersIcon style={{ width: '14px', height: '14px' }} />
                  {dept.member_count} members
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
