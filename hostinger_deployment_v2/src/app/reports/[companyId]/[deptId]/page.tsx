'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { getSubordinateIds, type HierarchyMember } from '@/lib/hierarchy-utils';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface DeptMember {
  id: number;
  user_id: number;
  role: string;
  manager_id: number | null;
  user_name: string;
  user_email: string;
}

interface Report {
  id: number;
  department_id: number;
  user_id: number;
  report_type: string;
  report_date: string;
  content: string;
  tasks_completed: string;
  challenges: string;
  plans_for_next: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  user_name?: string;
}

export default function ReportsCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.companyId);
  const deptId = Number(params?.deptId);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Members
  const [members, setMembers] = useState<DeptMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null); // null = all
  const [canViewAll, setCanViewAll] = useState(false);
  const [viewableUserIds, setViewableUserIds] = useState<number[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportTab, setReportTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reports, setReports] = useState<Report[]>([]);

  // All reports for the month (for member list counts)
  const [allMonthReports, setAllMonthReports] = useState<Report[]>([]);

  // Modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalReports, setModalReports] = useState<Report[]>([]);

  // Member report detail modal
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<DeptMember | null>(null);
  const [memberDetailReports, setMemberDetailReports] = useState<Report[]>([]);

  const isAdmin = user?.role === 'admin';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setAccessDenied(false);
    try {
      // Fetch company and department names
      const [companyRes, deptRes] = await Promise.all([
        supabase.from('org_companies').select('name').eq('id', companyId).single(),
        supabase.from('org_departments').select('name, created_by').eq('id', deptId).single(),
      ]);
      setCompanyName(companyRes.data?.name || '');
      setDeptName(deptRes.data?.name || '');
      const deptCreatedBy = deptRes.data?.created_by || null;

      // Fetch user's company role
      const { data: membershipData } = await supabase
        .from('org_company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .single();
      const companyRole = membershipData?.role || null;

      // Fetch all department members
      const { data: allMembers } = await supabase
        .from('org_department_members')
        .select('*')
        .eq('department_id', deptId);
      const memberList = allMembers || [];

      // Check if current user is a member of this department
      const currentUserMember = memberList.find((m: any) => m.user_id === user.id);
      if (!currentUserMember && !isAdmin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Get user names
      const userIds = memberList.map((m: any) => m.user_id);
      let usersMap: Record<number, any> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('auth_user').select('id, name, email').in('id', userIds);
        (users || []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      const enrichedMembers: DeptMember[] = memberList.map((m: any) => ({
        ...m,
        manager_id: m.manager_id || null,
        user_name: usersMap[m.user_id]?.name || 'Unknown',
        user_email: usersMap[m.user_id]?.email || '',
      }));
      setMembers(enrichedMembers);

      // Determine access level
      const isDeptCreator = deptCreatedBy === user.id;
      const isCompanyAdmin = companyRole === 'admin';
      const isCompanyManager = companyRole === 'manager';
      const hasFullAccess = isAdmin || isCompanyAdmin || isCompanyManager || isDeptCreator;

      if (hasFullAccess) {
        setCanViewAll(true);
        setViewableUserIds(enrichedMembers.map((m) => m.user_id));
        setSelectedMemberId(null);
      } else {
        // Check hierarchy - can see self + subordinates
        const hierarchyMembers: HierarchyMember[] = enrichedMembers.map((m) => ({
          id: m.id,
          department_id: deptId,
          user_id: m.user_id,
          role: m.role,
          manager_id: m.manager_id,
          user_name: m.user_name,
          user_email: m.user_email,
        }));

        const viewable = [user.id];
        if (currentUserMember) {
          const subIds = getSubordinateIds(hierarchyMembers, currentUserMember.id);
          viewable.push(...subIds);
        }

        const hasSubordinates = viewable.length > 1;
        setCanViewAll(hasSubordinates);
        setViewableUserIds(viewable);
        setSelectedMemberId(hasSubordinates ? null : user.id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [user, companyId, deptId, isAdmin]);

  // Fetch reports for current month
  const fetchReports = useCallback(async () => {
    if (!user || viewableUserIds.length === 0) return;
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      // Fetch all viewable reports for the month (for member list counts)
      const { data: allData } = await supabase
        .from('org_employee_reports')
        .select('*')
        .eq('department_id', deptId)
        .in('user_id', viewableUserIds)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: true });

      const allEnriched = (allData || []).map((r: any) => {
        const member = members.find((m) => m.user_id === r.user_id);
        return { ...r, user_name: member?.user_name || 'Unknown' };
      });
      setAllMonthReports(allEnriched);

      // Filter for the active tab and selected member
      const targetUserIds = selectedMemberId ? [selectedMemberId] : viewableUserIds;
      const filtered = allEnriched.filter((r: Report) =>
        r.report_type === reportTab && targetUserIds.includes(r.user_id)
      );
      setReports(filtered);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, [user, currentDate, reportTab, deptId, selectedMemberId, viewableUserIds, members]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!loading && !accessDenied && viewableUserIds.length > 0) fetchReports();
  }, [loading, accessDenied, fetchReports, viewableUserIds]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getReportsForDate = (dateStr: string) => reports.filter((r) => r.report_date === dateStr);

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  const getReportsForWeek = (weekStart: string) => reports.filter((r) => r.report_date === weekStart);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (reportTab === 'daily') {
      const dayReports = getReportsForDate(dateStr);
      if (dayReports.length > 0) {
        setSelectedDate(dateStr);
        setModalReports(dayReports);
      }
    } else if (reportTab === 'weekly') {
      const date = new Date(year, month, day);
      const monday = getMonday(date);
      const mondayStr = monday.toISOString().split('T')[0];
      const weekReports = getReportsForWeek(mondayStr);
      if (weekReports.length > 0) {
        setSelectedDate(mondayStr);
        setModalReports(weekReports);
      }
    } else {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const monthReports = reports.filter((r) => r.report_date === monthStr);
      if (monthReports.length > 0) {
        setSelectedDate(monthStr);
        setModalReports(monthReports);
      }
    }
  };

  const dayHasReports = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (reportTab === 'daily') {
      return getReportsForDate(dateStr).length > 0;
    } else if (reportTab === 'weekly') {
      const date = new Date(year, month, day);
      const monday = getMonday(date);
      const mondayStr = monday.toISOString().split('T')[0];
      return getReportsForWeek(mondayStr).length > 0;
    } else {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      return reports.some((r) => r.report_date === monthStr);
    }
  };

  // Get report count per member for current month (daily reports)
  const getMemberReportCount = (userId: number): number => {
    return allMonthReports.filter((r) => r.user_id === userId && r.report_type === 'daily' && r.status === 'submitted').length;
  };

  // Handle clicking a member in the member list
  const handleMemberClick = (member: DeptMember) => {
    const memberReports = allMonthReports.filter((r) => r.user_id === member.user_id && r.report_type === 'daily');
    memberReports.sort((a, b) => b.report_date.localeCompare(a.report_date));
    setSelectedMemberDetail(member);
    setMemberDetailReports(memberReports);
  };

  // Filter viewable members for the member list
  const viewableMembers = members.filter((m) => viewableUserIds.includes(m.user_id));

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  // Access Denied
  if (accessDenied) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
        <Sidebar />
        <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <ShieldExclamationIcon style={{ width: '48px', height: '48px', color: '#EF4444', margin: '0 auto 1rem' }} />
            <h1 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h1>
            <p style={{ color: '#71717A', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              You are not a member of this department. Only assigned department members can view reports.
            </p>
            <button
              onClick={() => router.push(`/reports/${companyId}`)}
              style={{ padding: '0.625rem 1.5rem', background: '#3B82F6', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Departments
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
          <Link href="/reports" style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>Reports</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link href={`/reports/${companyId}`} style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>{companyName}</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{deptName}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{deptName} Reports</h1>
          <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>View employee reports on the calendar</p>
        </div>

        {loading ? (
          <div style={{ color: '#71717A', textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <>
            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {/* Member Filter */}
              {canViewAll && viewableMembers.length > 1 && (
                <select
                  value={selectedMemberId ?? 'all'}
                  onChange={(e) => setSelectedMemberId(e.target.value === 'all' ? null : Number(e.target.value))}
                  style={{
                    padding: '0.625rem 1rem',
                    background: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '180px',
                  }}
                >
                  <option value="all">All Members</option>
                  {viewableMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                  ))}
                </select>
              )}

              {/* Report Type Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #2D2D2D' }}>
                {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReportTab(tab)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: reportTab === tab ? '#10B981' : 'transparent',
                      color: reportTab === tab ? '#FFFFFF' : '#71717A',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-column layout: Calendar + Member List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
              {/* Calendar */}
              <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem' }}>
                {/* Month Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <button
                    onClick={prevMonth}
                    style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                  >
                    <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                  <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                    {monthNames[month]} {year}
                  </h2>
                  <button
                    onClick={nextMonth}
                    style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                  >
                    <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>

                {/* Day names header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {dayNames.map((d) => (
                    <div key={d} style={{ textAlign: 'center', color: '#71717A', fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 0', textTransform: 'uppercase' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                  {Array.from({ length: firstDayOfWeek }, (_, i) => (
                    <div key={`empty-${i}`} style={{ padding: '0.75rem', minHeight: '60px' }} />
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const hasReports = dayHasReports(day);
                    const today = new Date();
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                    return (
                      <div
                        key={day}
                        onClick={() => handleDayClick(day)}
                        style={{
                          padding: '0.5rem',
                          minHeight: '60px',
                          background: isToday ? '#141414' : 'transparent',
                          border: isToday ? '1px solid #3D3D3D' : '1px solid transparent',
                          borderRadius: '0.5rem',
                          cursor: hasReports ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (hasReports) {
                            e.currentTarget.style.background = '#141414';
                            e.currentTarget.style.borderColor = '#10B981';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isToday ? '#141414' : 'transparent';
                          e.currentTarget.style.borderColor = isToday ? '#3D3D3D' : 'transparent';
                        }}
                      >
                        <span style={{ color: isToday ? '#10B981' : '#FFFFFF', fontSize: '0.875rem', fontWeight: isToday ? 700 : 400 }}>
                          {day}
                        </span>
                        {hasReports && (
                          <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2D2D2D' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ color: '#71717A', fontSize: '0.75rem' }}>Has submitted reports</span>
                  <span style={{ color: '#52525B', fontSize: '0.75rem', marginLeft: 'auto' }}>
                    {reports.length} report{reports.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Members Panel */}
              <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem' }}>
                  Members ({viewableMembers.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {viewableMembers.map((member) => {
                    const reportCount = getMemberReportCount(member.user_id);
                    const isSelected = selectedMemberId === member.user_id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleMemberClick(member)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          background: isSelected ? '#141414' : 'transparent',
                          border: isSelected ? '1px solid #10B981' : '1px solid #2D2D2D',
                          borderRadius: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#141414';
                            e.currentTarget.style.borderColor = '#3D3D3D';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#2D2D2D';
                          }
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#FFF', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
                        }}>
                          {member.user_name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.user_name}
                          </div>
                          <div style={{ color: '#71717A', fontSize: '0.75rem' }}>
                            {member.role}
                          </div>
                        </div>
                        {/* Report Count Badge */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                          background: reportCount > 0 ? 'rgba(16,185,129,0.15)' : '#141414',
                          color: reportCount > 0 ? '#10B981' : '#52525B',
                          fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                        }}>
                          <DocumentTextIcon style={{ width: '12px', height: '12px' }} />
                          {reportCount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Calendar Day Report Detail Modal */}
        {selectedDate && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setSelectedDate(null)}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                  {reportTab === 'daily' ? 'Daily' : reportTab === 'weekly' ? 'Weekly' : 'Monthly'} Report{modalReports.length > 1 ? 's' : ''} — {selectedDate}
                </h3>
                <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {modalReports.length === 0 ? (
                <p style={{ color: '#71717A', fontSize: '0.875rem' }}>No reports for this date.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {modalReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Member Detail Modal - shows all reports for a member in this month */}
        {selectedMemberDetail && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setSelectedMemberDetail(null)}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFF', fontSize: '1rem', fontWeight: 600,
                  }}>
                    {selectedMemberDetail.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{selectedMemberDetail.user_name}</h3>
                    <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.125rem 0 0' }}>
                      Daily reports for {monthNames[month]} {year}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedMemberDetail(null)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {memberDetailReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#71717A' }}>
                  <DocumentTextIcon style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9375rem' }}>No reports submitted this month</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {memberDetailReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}

              {/* Filter calendar to this member */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #2D2D2D', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setSelectedMemberId(selectedMemberDetail.user_id);
                    setSelectedMemberDetail(null);
                  }}
                  style={{
                    padding: '0.5rem 1.25rem', background: '#141414', border: '1px solid #2D2D2D',
                    borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.8125rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                >
                  Filter calendar to {selectedMemberDetail.user_name}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Reusable report card component
function ReportCard({ report }: { report: Report }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
          {(report.user_name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600 }}>{report.user_name}</div>
          <div style={{ color: '#71717A', fontSize: '0.75rem' }}>{report.report_date}</div>
        </div>
        <span style={{
          padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
          background: report.status === 'submitted' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color: report.status === 'submitted' ? '#10B981' : '#F59E0B',
        }}>
          {report.status}
        </span>
      </div>

      {report.content && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>What I did</div>
          <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.content}</div>
        </div>
      )}

      {report.tasks_completed && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Tasks Completed</div>
          <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.tasks_completed}</div>
        </div>
      )}

      {report.challenges && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Challenges / Blockers</div>
          <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.challenges}</div>
        </div>
      )}

      {report.plans_for_next && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Plans for Next</div>
          <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.plans_for_next}</div>
        </div>
      )}

      {report.submitted_at && (
        <div style={{ color: '#52525B', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          Submitted: {new Date(report.submitted_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
