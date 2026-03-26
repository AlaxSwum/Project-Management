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
  CheckCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ArrowPathIcon,
  PaperClipIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

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

  // Selected day on calendar (drives the sidebar)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Modal: clicked member report popup
  const [modalMember, setModalMember] = useState<DeptMember | null>(null);
  const [modalReport, setModalReport] = useState<Report | null>(null);

  // Page-level view toggle: 'reports' or 'checklists'
  const [pageView, setPageView] = useState<'reports' | 'checklists'>('reports');

  // Checklist progress data
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [checklistCategories, setChecklistCategories] = useState<any[]>([]);
  const [checklistAttachments, setChecklistAttachments] = useState<any[]>([]);
  const [expandedCheckMember, setExpandedCheckMember] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [checkCalDate, setCheckCalDate] = useState(new Date());
  const [checkSelectedDay, setCheckSelectedDay] = useState<string | null>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const isAdmin = user?.role === 'admin';

  const isImageType = (type: string) => type?.startsWith('image/');
  const isPdfType = (type: string) => type === 'application/pdf' || type?.endsWith('.pdf');
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setAccessDenied(false);
    try {
      const [companyRes, deptRes] = await Promise.all([
        supabase.from('org_companies').select('name').eq('id', companyId).single(),
        supabase.from('org_departments').select('name, created_by').eq('id', deptId).single(),
      ]);
      setCompanyName(companyRes.data?.name || '');
      setDeptName(deptRes.data?.name || '');
      const deptCreatedBy = deptRes.data?.created_by || null;

      const { data: membershipData } = await supabase
        .from('org_company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .single();
      const companyRole = membershipData?.role || null;

      const { data: allMembers } = await supabase
        .from('org_department_members')
        .select('*')
        .eq('department_id', deptId);
      const memberList = allMembers || [];

      const currentUserMember = memberList.find((m: any) => m.user_id === user.id);
      if (!currentUserMember && !isAdmin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

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

      const isDeptCreator = deptCreatedBy === user.id;
      const isCompanyAdmin = companyRole === 'admin';
      const isCompanyManager = companyRole === 'manager';
      const hasFullAccess = isAdmin || isCompanyAdmin || isCompanyManager || isDeptCreator;

      if (hasFullAccess) {
        setCanViewAll(true);
        setViewableUserIds(enrichedMembers.map((m) => m.user_id));
        setSelectedMemberId(null);
      } else {
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

  const fetchReports = useCallback(async () => {
    if (!user || viewableUserIds.length === 0) return;
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

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

  // Fetch checklist data when switching to checklist view
  const fetchChecklists = useCallback(async () => {
    if (!user || viewableUserIds.length === 0) return;
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('org_checklists').select('*').eq('department_id', deptId).in('user_id', viewableUserIds).order('created_at', { ascending: true }),
        supabase.from('org_checklist_categories').select('*').eq('company_id', companyId).order('created_at', { ascending: true }),
      ]);
      const items = (itemsRes.data || []).map((c: any) => ({
        ...c, reset_time: c.reset_time || '00:00',
        reset_day_of_week: c.reset_day_of_week ?? null, reset_day_of_month: c.reset_day_of_month ?? null,
        category_id: c.category_id ?? null,
      }));
      setChecklistItems(items);
      setChecklistCategories(catsRes.data || []);

      // Fetch attachments
      const checkIds = items.map((i: any) => i.id);
      if (checkIds.length > 0) {
        const { data: atts } = await supabase.from('org_checklist_attachments').select('*').in('checklist_id', checkIds);
        setChecklistAttachments(atts || []);
      }
    } catch (err) { console.error('Error fetching checklists:', err); }
  }, [user, deptId, companyId, viewableUserIds]);

  useEffect(() => {
    if (pageView === 'checklists' && !loading && !accessDenied && viewableUserIds.length > 0) fetchChecklists();
  }, [pageView, loading, accessDenied, fetchChecklists, viewableUserIds]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  // Reset selected day when month changes
  useEffect(() => {
    setSelectedCalendarDay(null);
    setModalMember(null);
    setModalReport(null);
  }, [currentDate, reportTab]);

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
    if (selectedCalendarDay === dateStr) {
      setSelectedCalendarDay(null);
    } else {
      setSelectedCalendarDay(dateStr);
    }
    setModalMember(null);
    setModalReport(null);
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

  const getMemberReportCount = (userId: number): number => {
    return allMonthReports.filter((r) => r.user_id === userId && r.report_type === 'daily' && r.status === 'submitted').length;
  };

  const getMemberReportForDay = (userId: number): Report | null => {
    if (!selectedCalendarDay) return null;
    return allMonthReports.find(
      (r) => r.user_id === userId && r.report_date === selectedCalendarDay && r.report_type === reportTab
    ) || null;
  };

  // Click member in sidebar -> open popup modal
  const handleSidebarMemberClick = (member: DeptMember) => {
    const report = getMemberReportForDay(member.user_id);
    setModalMember(member);
    setModalReport(report);
  };

  const viewableMembers = members.filter((m) => viewableUserIds.includes(m.user_id));

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNum = d.getDate();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    return `${dayOfWeek}, ${monthNames[d.getMonth()]} ${dayNum}`;
  };

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

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
          <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{deptName}</h1>
          <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>View daily reports and checklist progress</p>
        </div>

        {/* Page View Toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid #2D2D2D', marginBottom: '1.5rem', width: 'fit-content' }}>
          <button onClick={() => setPageView('reports')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: pageView === 'reports' ? '#10B981' : 'transparent', color: pageView === 'reports' ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <DocumentTextIcon style={{ width: '16px', height: '16px' }} /> Daily Reports
          </button>
          <button onClick={() => setPageView('checklists')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: pageView === 'checklists' ? '#8B5CF6' : 'transparent', color: pageView === 'checklists' ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <ClipboardDocumentListIcon style={{ width: '16px', height: '16px' }} /> Checklist Progress
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#71717A', textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : pageView === 'reports' ? (
          <>
            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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

            {/* Two-column layout: Calendar + Sidebar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
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
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedCalendarDay === dateStr;

                    return (
                      <div
                        key={day}
                        onClick={() => handleDayClick(day)}
                        style={{
                          padding: '0.5rem',
                          minHeight: '60px',
                          background: isSelected ? '#10B981' : isToday ? '#141414' : 'transparent',
                          border: isSelected ? '1px solid #10B981' : isToday ? '1px solid #3D3D3D' : '1px solid transparent',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#141414';
                            e.currentTarget.style.borderColor = hasReports ? '#10B981' : '#3D3D3D';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = isToday ? '#141414' : 'transparent';
                            e.currentTarget.style.borderColor = isToday ? '#3D3D3D' : 'transparent';
                          }
                        }}
                      >
                        <span style={{ color: isSelected ? '#FFFFFF' : isToday ? '#10B981' : '#FFFFFF', fontSize: '0.875rem', fontWeight: isSelected || isToday ? 700 : 400 }}>
                          {day}
                        </span>
                        {hasReports && (
                          <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#FFFFFF' : '#10B981' }} />
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
                    {reports.length} report{reports.length !== 1 ? 's' : ''} this month
                  </span>
                </div>
              </div>

              {/* Right Sidebar Panel */}
              <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', position: 'sticky', top: '2rem' }}>
                {!selectedCalendarDay ? (
                  /* DEFAULT: Show members with monthly report count */
                  <>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                      Members ({viewableMembers.length})
                    </h3>
                    <p style={{ color: '#52525B', fontSize: '0.75rem', marginBottom: '1rem' }}>
                      Select a day to view reports
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {viewableMembers.map((member) => {
                        const reportCount = getMemberReportCount(member.user_id);
                        return (
                          <div
                            key={member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              background: 'transparent',
                              border: '1px solid #2D2D2D',
                              borderRadius: '0.75rem',
                            }}
                          >
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#FFF', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
                            }}>
                              {member.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.user_name}
                              </div>
                              <div style={{ color: '#71717A', fontSize: '0.75rem' }}>
                                {member.role}
                              </div>
                            </div>
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
                  </>
                ) : (
                  /* DAY SELECTED: Show members with report status for that day */
                  <>
                    {/* Date header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarDaysIcon style={{ width: '18px', height: '18px', color: '#10B981' }} />
                        <h3 style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>
                          {formatSelectedDate(selectedCalendarDay)}
                        </h3>
                      </div>
                      <button
                        onClick={() => { setSelectedCalendarDay(null); setModalMember(null); setModalReport(null); }}
                        style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <XMarkIcon style={{ width: '18px', height: '18px' }} />
                      </button>
                    </div>

                    {/* Summary bar */}
                    {(() => {
                      const submittedCount = viewableMembers.filter((m) => getMemberReportForDay(m.user_id) !== null).length;
                      return (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.625rem 0.75rem', background: '#141414', borderRadius: '0.5rem',
                          marginBottom: '1rem', border: '1px solid #2D2D2D',
                        }}>
                          <span style={{ color: '#10B981', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {submittedCount}/{viewableMembers.length}
                          </span>
                          <span style={{ color: '#71717A', fontSize: '0.8125rem' }}>submitted</span>
                        </div>
                      );
                    })()}

                    {/* Members list for this day */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
                      {viewableMembers.map((member) => {
                        const dayReport = getMemberReportForDay(member.user_id);
                        const hasReport = dayReport !== null;

                        return (
                          <div
                            key={member.id}
                            onClick={() => handleSidebarMemberClick(member)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              background: 'transparent',
                              border: '1px solid #2D2D2D',
                              borderRadius: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#141414';
                              e.currentTarget.style.borderColor = '#3D3D3D';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = '#2D2D2D';
                            }}
                          >
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#FFF', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
                            }}>
                              {member.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.user_name}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: hasReport ? '#10B981' : '#71717A',
                                fontWeight: hasReport ? 500 : 400,
                              }}>
                                {hasReport ? 'Submitted' : 'No report yet'}
                              </div>
                            </div>
                            {hasReport ? (
                              <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#10B981', flexShrink: 0 }} />
                            ) : (
                              <DocumentTextIcon style={{ width: '18px', height: '18px', color: '#52525B', flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ═══ CHECKLIST PROGRESS VIEW ═══ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {checklistItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', background: '#1A1A1A', borderRadius: '0.75rem', border: '1px solid #2D2D2D' }}>
                <ClipboardDocumentListIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>No checklists assigned in this department</p>
              </div>
            ) : (
              <>
                {(() => {
                  const total = checklistItems.length;
                  const done = checklistItems.filter((c: any) => c.is_completed).length;
                  const pctTotal = total > 0 ? Math.round((done / total) * 100) : 0;
                  const uniqueStaff = new Set(checklistItems.map((c: any) => c.user_id)).size;

                  // Calendar helpers
                  const calYear = checkCalDate.getFullYear();
                  const calMonth = checkCalDate.getMonth();
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const firstDow = new Date(calYear, calMonth, 1).getDay();
                  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

                  // Check which days have completed items or uploads
                  const dayHasActivity = (day: number) => {
                    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const hasCompletion = checklistItems.some((c: any) => c.completed_at && c.completed_at.startsWith(ds));
                    const hasUpload = checklistAttachments.some((a: any) => a.created_at && a.created_at.startsWith(ds));
                    return { hasCompletion, hasUpload, any: hasCompletion || hasUpload };
                  };

                  // Get items for selected day
                  const selectedDayItems = checkSelectedDay ? checklistItems.filter((c: any) =>
                    c.completed_at && c.completed_at.startsWith(checkSelectedDay)
                  ) : [];
                  const selectedDayUploads = checkSelectedDay ? checklistAttachments.filter((a: any) =>
                    a.created_at && a.created_at.startsWith(checkSelectedDay)
                  ) : [];

                  return null;
                  return (<div id="checklist-calendar" style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem', width: '260px', flexShrink: 0 }}>
                        {/* Month nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                          <button onClick={() => setCheckCalDate(new Date(calYear, calMonth - 1, 1))}
                            style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', lineHeight: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#FFF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                            <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                          <span style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700 }}>{monthNames[calMonth]} {calYear}</span>
                          <button onClick={() => setCheckCalDate(new Date(calYear, calMonth + 1, 1))}
                            style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', lineHeight: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#FFF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                            <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                        {/* Day names */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          {dayNames.map(d => (
                            <div key={d} style={{ textAlign: 'center', color: '#52525B', fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem' }}>{d}</div>
                          ))}
                        </div>
                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const isToday = ds === todayStr;
                            const isSelected = ds === checkSelectedDay;
                            const activity = dayHasActivity(day);
                            return (
                              <button key={day} onClick={() => setCheckSelectedDay(isSelected ? null : ds)}
                                style={{
                                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.125rem',
                                  borderRadius: '0.5rem', border: isSelected ? '2px solid #8B5CF6' : isToday ? '1px solid #3B82F6' : '1px solid transparent',
                                  background: isSelected ? '#8B5CF620' : isToday ? '#141414' : 'transparent',
                                  color: isSelected ? '#FFFFFF' : isToday ? '#3B82F6' : '#A1A1AA',
                                  fontSize: '0.8125rem', fontWeight: isToday || isSelected ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#141414'; }}
                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isToday ? '#141414' : 'transparent'; }}>
                                {day}
                                {activity.any && (
                                  <div style={{ display: 'flex', gap: '0.125rem' }}>
                                    {activity.hasCompletion && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />}
                                    {activity.hasUpload && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3B82F6' }} />}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                            <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>Tasks completed</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                            <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>Files uploaded</span>
                          </div>
                        </div>
                      </div>);
                })()}

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Employee cards */}
                {(() => {
                  const TC: Record<string, string> = { daily: '#3B82F6', weekly: '#8B5CF6', monthly: '#F59E0B' };
                  const viewableMembers2 = members.filter(m => viewableUserIds.includes(m.user_id));
                  const empData = viewableMembers2.map(m => {
                    const allItems = checklistItems.filter((c: any) => c.user_id === m.user_id);
                    if (allItems.length === 0) return null;
                    // If a day is selected, only show items with activity on that day
                    const dayItems = checkSelectedDay
                      ? allItems.filter((c: any) => c.completed_at?.startsWith(checkSelectedDay))
                      : allItems;
                    const dayAtts = checkSelectedDay
                      ? checklistAttachments.filter((a: any) => a.created_at?.startsWith(checkSelectedDay) && allItems.some((i: any) => i.id === a.checklist_id))
                      : checklistAttachments.filter((a: any) => allItems.some((i: any) => i.id === a.checklist_id));
                    if (checkSelectedDay && dayItems.length === 0 && dayAtts.length === 0) return null;
                    const done = checkSelectedDay ? dayItems.length : allItems.filter((c: any) => c.is_completed).length;
                    const total = checkSelectedDay ? dayItems.length + (allItems.length - allItems.filter((c: any) => c.is_completed).length) : allItems.length;
                    const pct = allItems.length > 0 ? Math.round((allItems.filter((c: any) => c.is_completed).length / allItems.length) * 100) : 0;
                    return { member: m, items: checkSelectedDay ? dayItems : allItems, done, total: allItems.length, pct, allAtts: dayAtts, dayFiltered: !!checkSelectedDay };
                  }).filter(Boolean).sort((a: any, b: any) => b.pct - a.pct) as any[];

                  const selectedDayLabel = checkSelectedDay ? new Date(checkSelectedDay + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

                  return (<>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      {/* Day filter label */}
                      {checkSelectedDay && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#8B5CF610', border: '1px solid #8B5CF620', borderRadius: '0.5rem' }}>
                          <span style={{ color: '#8B5CF6', fontSize: '0.8125rem', fontWeight: 600 }}>Showing activity for {selectedDayLabel}</span>
                          <button onClick={() => setCheckSelectedDay(null)} style={{ padding: '0.125rem 0.5rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.25rem', color: '#A1A1AA', fontSize: '0.6875rem', cursor: 'pointer' }}>Clear</button>
                        </div>
                      )}
                      {empData.length === 0 && checkSelectedDay && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#52525B', fontSize: '0.8125rem' }}>No activity on {selectedDayLabel}</div>
                      )}
                      {empData.map(({ member: m, done, total, pct, allAtts }: any) => {
                        const sc = pct === 100 ? '#10B981' : pct > 0 ? '#F59E0B' : '#EF4444';
                        const sl = pct === 100 ? 'Complete' : pct > 0 ? 'In Progress' : 'Not Started';
                        return (
                          <div key={m.user_id} onClick={() => setExpandedCheckMember(m.user_id)}
                            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = sc; e.currentTarget.style.background = '#1F1F1F'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.background = '#1A1A1A'; }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${sc}, ${sc}90)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.9375rem', fontWeight: 700, flexShrink: 0 }}>
                              {m.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600 }}>{m.user_name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                                <div style={{ width: '120px', height: '6px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: sc, borderRadius: '3px' }} />
                                </div>
                                <span style={{ color: sc, fontSize: '0.75rem', fontWeight: 700 }}>{pct}%</span>
                                <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{done}/{total}</span>
                                {allAtts.length > 0 && <span style={{ color: '#3B82F6', fontSize: '0.6875rem' }}>{allAtts.length} files</span>}
                              </div>
                            </div>
                            <div style={{ padding: '0.1875rem 0.625rem', borderRadius: '2rem', background: `${sc}15`, flexShrink: 0 }}>
                              <span style={{ color: sc, fontSize: '0.625rem', fontWeight: 700 }}>{sl}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Employee Detail Modal */}
                    {expandedCheckMember && (() => {
                      const ed = empData.find((e: any) => e.member.user_id === expandedCheckMember);
                      if (!ed) return null;
                      const { member: m, items, done, total, pct, allAtts } = ed;
                      const sc = pct === 100 ? '#10B981' : pct > 0 ? '#F59E0B' : '#EF4444';
                      const catGroups = checklistCategories.map((cat: any) => {
                        const ci = items.filter((c: any) => c.category_id === cat.id);
                        if (ci.length === 0) return null;
                        return { cat, items: ci, done: ci.filter((c: any) => c.is_completed).length, total: ci.length };
                      }).filter(Boolean);
                      return (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250 }}
                          onClick={() => setExpandedCheckMember(null)}>
                          <div style={{ background: '#1A1A1A', borderRadius: '1rem', width: '600px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
                            onClick={(e) => e.stopPropagation()}>
                            {/* Modal header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D', position: 'sticky', top: 0, background: '#1A1A1A', zIndex: 1 }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${sc}, ${sc}90)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '1.125rem', fontWeight: 700, flexShrink: 0 }}>
                                {m.user_name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700 }}>{m.user_name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  <div style={{ width: '100px', height: '6px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: sc, borderRadius: '3px' }} />
                                  </div>
                                  <span style={{ color: sc, fontSize: '0.8125rem', fontWeight: 700 }}>{done}/{total} done</span>
                                </div>
                              </div>
                              <button onClick={() => setExpandedCheckMember(null)}
                                style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', lineHeight: 0 }}>
                                <XMarkIcon style={{ width: '18px', height: '18px' }} />
                              </button>
                            </div>

                            {/* Modal body */}
                            <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                              {catGroups.map((cg: any) => (
                                <div key={cg.cat.id} style={{ marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: cg.cat.color }} />
                                    <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 700 }}>{cg.cat.name}</span>
                                    <span style={{ color: cg.done === cg.total ? '#10B981' : '#52525B', fontSize: '0.75rem', fontWeight: 600, marginLeft: 'auto' }}>{cg.done}/{cg.total}</span>
                                  </div>
                                  {cg.items.map((item: any) => {
                                    const itemAtts = checklistAttachments.filter((a: any) => a.checklist_id === item.id);
                                    return (
                                      <div key={item.id} style={{ background: item.is_completed ? '#0F1F15' : '#141414', border: item.is_completed ? '1px solid #10B98120' : '1px solid #2D2D2D', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', marginBottom: '0.375rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          {item.is_completed ? <CheckCircleSolidIcon style={{ width: '18px', height: '18px', color: '#10B981', flexShrink: 0 }} /> : <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#3D3D3D', flexShrink: 0 }} />}
                                          <span style={{ flex: 1, color: item.is_completed ? '#52525B' : '#FFFFFF', fontSize: '0.8125rem', textDecoration: item.is_completed ? 'line-through' : 'none' }}>{item.title}</span>
                                          <span style={{ color: TC[item.type], fontSize: '0.5625rem', fontWeight: 600 }}>{item.type}</span>
                                        </div>
                                        {itemAtts.length > 0 && (
                                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                            {itemAtts.map((a: any) => (
                                              <button key={a.id}
                                                onClick={() => setPreviewFile({ url: a.file_url, name: a.file_name, type: a.file_type || '' })}
                                                style={{ padding: 0, border: '1px solid #2D2D2D', borderRadius: '0.5rem', background: '#0D0D0D', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2D2D2D')}>
                                                {isImageType(a.file_type)
                                                  ? <img src={a.file_url} alt="" style={{ width: '100px', height: '75px', objectFit: 'cover', display: 'block' }} />
                                                  : <div style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                      {isPdfType(a.file_type) ? <DocumentTextIcon style={{ width: '14px', height: '14px', color: '#EF4444' }} /> : <PaperClipIcon style={{ width: '14px', height: '14px', color: '#71717A' }} />}
                                                      <span style={{ color: '#A1A1AA', fontSize: '0.75rem' }}>{a.file_name}</span>
                                                    </div>
                                                }
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Calendar - right side */}
                    {(() => {
                      const calYear = checkCalDate.getFullYear();
                      const calMonth = checkCalDate.getMonth();
                      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                      const firstDow = new Date(calYear, calMonth, 1).getDay();
                      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      const dNames = ['S','M','T','W','T','F','S'];
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                      const dayActivity = (day: number) => {
                        const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        return {
                          done: checklistItems.some((c: any) => c.completed_at?.startsWith(ds)),
                          upload: checklistAttachments.some((a: any) => a.created_at?.startsWith(ds)),
                        };
                      };
                      return (
                        <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem', width: '220px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <button onClick={() => setCheckCalDate(new Date(calYear, calMonth - 1, 1))} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', lineHeight: 0 }}><ChevronLeftIcon style={{ width: '14px', height: '14px' }} /></button>
                            <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 700 }}>{mNames[calMonth]} {calYear}</span>
                            <button onClick={() => setCheckCalDate(new Date(calYear, calMonth + 1, 1))} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', lineHeight: 0 }}><ChevronRightIcon style={{ width: '14px', height: '14px' }} /></button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem', marginBottom: '0.25rem' }}>
                            {dNames.map((d, i) => <div key={i} style={{ textAlign: 'center', color: '#52525B', fontSize: '0.5625rem', fontWeight: 600 }}>{d}</div>)}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem' }}>
                            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                              const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                              const isToday = ds === todayStr;
                              const a = dayActivity(day);
                              return (
                                <div key={day} onClick={() => setCheckSelectedDay(checkSelectedDay === ds ? null : ds)}
                                  style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.15s',
                                    border: checkSelectedDay === ds ? '1px solid #8B5CF6' : isToday ? '1px solid #3B82F6' : '1px solid transparent',
                                    background: checkSelectedDay === ds ? '#8B5CF620' : isToday ? '#141414' : 'transparent',
                                    color: checkSelectedDay === ds ? '#FFFFFF' : isToday ? '#3B82F6' : '#A1A1AA',
                                    fontSize: '0.6875rem', fontWeight: checkSelectedDay === ds || isToday ? 700 : 400 }}>
                                  {day}
                                  {(a.done || a.upload) && (
                                    <div style={{ display: 'flex', gap: '1px', marginTop: '1px' }}>
                                      {a.done && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#10B981' }} />}
                                      {a.upload && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#3B82F6' }} />}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981' }} /><span style={{ color: '#52525B', fontSize: '0.5rem' }}>Done</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3B82F6' }} /><span style={{ color: '#52525B', fontSize: '0.5rem' }}>Upload</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </>);
                })()}
                </div>{/* end flex wrapper */}
              </>
            )}
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
            onClick={() => setPreviewFile(null)}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', width: '90vw', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #2D2D2D', overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #2D2D2D', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  {isImageType(previewFile.type)
                    ? <PhotoIcon style={{ width: '18px', height: '18px', color: '#3B82F6', flexShrink: 0 }} />
                    : isPdfType(previewFile.type)
                      ? <DocumentTextIcon style={{ width: '18px', height: '18px', color: '#EF4444', flexShrink: 0 }} />
                      : <PaperClipIcon style={{ width: '18px', height: '18px', color: '#71717A', flexShrink: 0 }} />
                  }
                  <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {previewFile.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#3B82F6', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    <ArrowDownTrayIcon style={{ width: '14px', height: '14px' }} /> Download
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', lineHeight: 0 }}
                  >
                    <XMarkIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#0D0D0D', minHeight: '400px' }}>
                {isImageType(previewFile.type) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '0.5rem' }}
                  />
                ) : isPdfType(previewFile.type) ? (
                  <iframe
                    src={previewFile.url}
                    style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.5rem' }}
                    title={previewFile.name}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <PaperClipIcon style={{ width: '48px', height: '48px', color: '#52525B', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
                      {previewFile.name}
                    </p>
                    <p style={{ color: '#71717A', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
                      Preview not available for this file type
                    </p>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#3B82F6', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} /> Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member Report Popup Modal */}
        {modalMember && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => { setModalMember(null); setModalReport(null); }}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '560px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFF', fontSize: '1.125rem', fontWeight: 600,
                  }}>
                    {modalMember.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                      {modalMember.user_name}
                    </h3>
                    <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.125rem 0 0' }}>
                      {selectedCalendarDay && formatSelectedDate(selectedCalendarDay)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setModalMember(null); setModalReport(null); }}
                  style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <XMarkIcon style={{ width: '22px', height: '22px' }} />
                </button>
              </div>

              {/* Modal Body */}
              {!modalReport ? (
                /* No report */
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <DocumentTextIcon style={{ width: '48px', height: '48px', color: '#52525B', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 500, margin: '0 0 0.375rem' }}>No report yet</p>
                  <p style={{ color: '#71717A', fontSize: '0.875rem', margin: 0 }}>
                    {modalMember.user_name} has not submitted a report for this day.
                  </p>
                </div>
              ) : (
                /* Has report */
                <div>
                  {/* Status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{
                      padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                      background: modalReport.status === 'submitted' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: modalReport.status === 'submitted' ? '#10B981' : '#F59E0B',
                      textTransform: 'capitalize',
                    }}>
                      {modalReport.status}
                    </span>
                    {modalReport.submitted_at && (
                      <span style={{ color: '#52525B', fontSize: '0.75rem' }}>
                        Submitted at {new Date(modalReport.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {modalReport.content && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>What I did</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#141414', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                        {modalReport.content}
                      </div>
                    </div>
                  )}

                  {modalReport.tasks_completed && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Tasks Completed</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#141414', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                        {modalReport.tasks_completed}
                      </div>
                    </div>
                  )}

                  {modalReport.challenges && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Challenges / Blockers</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#141414', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                        {modalReport.challenges}
                      </div>
                    </div>
                  )}

                  {modalReport.plans_for_next && (
                    <div>
                      <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>Plans for Next</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#141414', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                        {modalReport.plans_for_next}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
