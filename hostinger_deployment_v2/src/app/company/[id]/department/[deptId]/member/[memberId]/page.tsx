'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { isManagerOf, type HierarchyMember } from '@/lib/hierarchy-utils';
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  PencilIcon,
  CheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface Responsibility {
  id: number;
  content: string;
}

interface ChecklistItem {
  id: number;
  title: string;
  type: string;
  is_completed: boolean;
  completed_at: string | null;
}

// Check if a completed_at timestamp is still within the current period
function isWithinCurrentPeriod(completedAt: string | null, type: string): boolean {
  if (!completedAt) return false;
  const completed = new Date(completedAt);
  const now = new Date();

  if (type === 'daily') {
    // Same calendar day (in local timezone)
    return (
      completed.getFullYear() === now.getFullYear() &&
      completed.getMonth() === now.getMonth() &&
      completed.getDate() === now.getDate()
    );
  }

  if (type === 'weekly') {
    // Same ISO week: get Monday of both weeks and compare
    const getMonday = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
    };
    const completedMonday = getMonday(completed).getTime();
    const nowMonday = getMonday(now).getTime();
    return completedMonday === nowMonday;
  }

  if (type === 'monthly') {
    // Same calendar month
    return (
      completed.getFullYear() === now.getFullYear() &&
      completed.getMonth() === now.getMonth()
    );
  }

  return false;
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.id);
  const deptId = Number(params?.deptId);
  const memberId = Number(params?.memberId);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDeptRole, setMemberDeptRole] = useState('');
  const [userCompanyRole, setUserCompanyRole] = useState<string | null>(null);
  const [deptCreatedBy, setDeptCreatedBy] = useState<number | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Hierarchy-based permissions
  const [isHierarchyManager, setIsHierarchyManager] = useState(false);

  // Data
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Add forms
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit checklist
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [editChecklistValue, setEditChecklistValue] = useState('');

  // Daily Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportTasksCompleted, setReportTasksCompleted] = useState('');
  const [reportChallenges, setReportChallenges] = useState('');
  const [reportPlans, setReportPlans] = useState('');
  const [reportStatus, setReportStatus] = useState<'draft' | 'submitted'>('draft');
  const [reportId, setReportId] = useState<number | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [todayReportExists, setTodayReportExists] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isDeptCreator = deptCreatedBy !== null && user?.id === deptCreatedBy;
  const isSelf = user?.id === memberId;
  const canManage =
    isAdmin ||
    userCompanyRole === 'admin' ||
    userCompanyRole === 'manager' ||
    isDeptCreator ||
    isHierarchyManager;

  // Auto-reset expired checklists
  const autoResetChecklists = useCallback(async (items: ChecklistItem[]) => {
    const idsToReset: number[] = [];
    for (const item of items) {
      if (item.is_completed && !isWithinCurrentPeriod(item.completed_at, item.type)) {
        idsToReset.push(item.id);
      }
    }
    if (idsToReset.length > 0) {
      await supabase
        .from('org_checklists')
        .update({ is_completed: false, completed_at: null })
        .in('id', idsToReset);
    }
    return idsToReset.length > 0;
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setAccessDenied(false);
    try {
      // Fetch company, dept (with created_by), member info, and user's company role in parallel
      const [companyRes, deptRes, memberRes, membershipRes] = await Promise.all([
        supabase.from('org_companies').select('name').eq('id', companyId).single(),
        supabase.from('org_departments').select('name, created_by').eq('id', deptId).single(),
        supabase.from('auth_user').select('name, email').eq('id', memberId).single(),
        supabase
          .from('org_company_members')
          .select('role')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .single(),
      ]);

      setCompanyName(companyRes.data?.name || '');
      setDeptName(deptRes.data?.name || '');
      setMemberName(memberRes.data?.name || 'Unknown');
      setMemberEmail(memberRes.data?.email || '');
      setUserCompanyRole(membershipRes.data?.role || null);
      const createdBy = deptRes.data?.created_by || null;
      setDeptCreatedBy(createdBy);

      // Fetch ALL department members to build hierarchy for access check
      const { data: allMembers } = await supabase
        .from('org_department_members')
        .select('*')
        .eq('department_id', deptId);
      const memberList: HierarchyMember[] = (allMembers || []).map((m: any) => ({
        ...m,
        manager_id: m.manager_id || null,
        user_name: '',
        user_email: '',
      }));

      // Find the target member's row and current user's row
      const targetMemberRow = memberList.find((m) => m.user_id === memberId);
      const currentUserRow = memberList.find((m) => m.user_id === user.id);

      // Get member's department role
      setMemberDeptRole(targetMemberRow?.role || 'member');

      // Check hierarchy-based manager status
      let hierarchyManager = false;
      if (currentUserRow && targetMemberRow && currentUserRow.id !== targetMemberRow.id) {
        hierarchyManager = isManagerOf(memberList, currentUserRow.id, targetMemberRow.id);
      }
      setIsHierarchyManager(hierarchyManager);

      // Resolve "Reports to" manager name
      if (targetMemberRow?.manager_id) {
        const managerRow = memberList.find((m) => m.id === targetMemberRow.manager_id);
        if (managerRow) {
          const { data: managerUser } = await supabase
            .from('auth_user')
            .select('name')
            .eq('id', managerRow.user_id)
            .single();
          setManagerName(managerUser?.name || null);
        } else {
          setManagerName(null);
        }
      } else {
        setManagerName(null);
      }

      // Access control gate
      const userIsAdmin = user.role === 'admin';
      const companyRole = membershipRes.data?.role || null;
      const userIsDeptCreator = createdBy === user.id;
      const userIsSelf = user.id === memberId;
      const canView =
        userIsAdmin ||
        companyRole === 'admin' ||
        companyRole === 'manager' ||
        userIsDeptCreator ||
        userIsSelf ||
        hierarchyManager;

      if (!canView) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch responsibilities and checklists
      const [respRes, checkRes] = await Promise.all([
        supabase
          .from('org_member_responsibilities')
          .select('*')
          .eq('department_id', deptId)
          .eq('user_id', memberId)
          .order('created_at', { ascending: true }),
        supabase
          .from('org_checklists')
          .select('*')
          .eq('department_id', deptId)
          .eq('user_id', memberId)
          .order('created_at', { ascending: true }),
      ]);
      setResponsibilities(respRes.data || []);

      const checkItems: ChecklistItem[] = checkRes.data || [];

      // Auto-reset expired checklists then re-fetch if any were reset
      const didReset = await autoResetChecklists(checkItems);
      if (didReset) {
        const { data: refreshed } = await supabase
          .from('org_checklists')
          .select('*')
          .eq('department_id', deptId)
          .eq('user_id', memberId)
          .order('created_at', { ascending: true });
        setChecklists(refreshed || []);
      } else {
        setChecklists(checkItems);
      }
    } catch (err) {
      console.error('Error fetching member data:', err);
    }
    setLoading(false);
  }, [user, companyId, deptId, memberId, autoResetChecklists]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleAddResponsibility = async () => {
    if (!newResponsibility.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_member_responsibilities').insert({
        department_id: deptId,
        user_id: memberId,
        content: newResponsibility.trim(),
      });
      if (error) throw error;
      setNewResponsibility('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add responsibility');
    }
    setSaving(false);
  };

  const handleDeleteResponsibility = async (id: number) => {
    try {
      await supabase.from('org_member_responsibilities').delete().eq('id', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim() || !user) return;
    setSaving(true);
    const title = newChecklistTitle.trim();
    setNewChecklistTitle('');
    try {
      const { data, error } = await supabase.from('org_checklists').insert({
        department_id: deptId,
        user_id: memberId,
        type: activeTab,
        title,
        is_completed: false,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      // Add new item to local state without full re-fetch
      if (data) setChecklists(prev => [...prev, data as ChecklistItem]);
    } catch (err) {
      console.error(err);
      alert('Failed to add checklist item');
      setNewChecklistTitle(title); // restore on error
    }
    setSaving(false);
  };

  const handleToggleChecklist = async (item: ChecklistItem) => {
    if (!isSelf && !canManage) return;
    const newCompleted = !item.is_completed;
    // Optimistic update - flip state immediately, no page reload
    setChecklists(prev =>
      prev.map(c =>
        c.id === item.id
          ? { ...c, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : c
      )
    );
    try {
      await supabase
        .from('org_checklists')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', item.id);
    } catch (err) {
      console.error(err);
      // Revert on DB error
      setChecklists(prev => prev.map(c => (c.id === item.id ? item : c)));
    }
  };

  const handleEditChecklist = async (id: number) => {
    if (!editChecklistValue.trim()) return;
    const newTitle = editChecklistValue.trim();
    setEditingChecklistId(null);
    setEditChecklistValue('');
    // Update local state immediately
    setChecklists(prev => prev.map(c => (c.id === id ? { ...c, title: newTitle } : c)));
    try {
      await supabase
        .from('org_checklists')
        .update({ title: newTitle })
        .eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklist = async (id: number) => {
    // Remove from local state immediately
    setChecklists(prev => prev.filter(c => c.id !== id));
    try {
      await supabase.from('org_checklists').delete().eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-submit old draft reports and load today's report
  const loadTodayReport = useCallback(async () => {
    if (!user || !isSelf) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      // Auto-submit any draft reports from previous days
      await supabase
        .from('org_employee_reports')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('department_id', deptId)
        .eq('user_id', memberId)
        .eq('report_type', 'daily')
        .eq('status', 'draft')
        .lt('report_date', today);

      // Load today's report if it exists
      const { data } = await supabase
        .from('org_employee_reports')
        .select('*')
        .eq('department_id', deptId)
        .eq('user_id', memberId)
        .eq('report_type', 'daily')
        .eq('report_date', today)
        .single();

      if (data) {
        setReportId(data.id);
        setReportContent(data.content || '');
        setReportTasksCompleted(data.tasks_completed || '');
        setReportChallenges(data.challenges || '');
        setReportPlans(data.plans_for_next || '');
        setReportStatus(data.status || 'draft');
        setTodayReportExists(true);
      } else {
        setReportId(null);
        setReportContent('');
        setReportTasksCompleted('');
        setReportChallenges('');
        setReportPlans('');
        setReportStatus('draft');
        setTodayReportExists(false);
      }
    } catch {
      // No report for today yet
    }
  }, [user, deptId, memberId, isSelf]);

  useEffect(() => {
    if (!loading && !accessDenied && isSelf) loadTodayReport();
  }, [loading, accessDenied, isSelf, loadTodayReport]);

  const handleSaveReport = async (submitNow: boolean) => {
    if (!user) return;
    setSavingReport(true);
    const today = new Date().toISOString().split('T')[0];
    const reportData = {
      department_id: deptId,
      user_id: memberId,
      report_type: 'daily' as const,
      report_date: today,
      content: reportContent,
      tasks_completed: reportTasksCompleted,
      challenges: reportChallenges,
      plans_for_next: reportPlans,
      status: submitNow ? 'submitted' : 'draft',
      submitted_at: submitNow ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (reportId) {
        // Update existing
        const { error } = await supabase
          .from('org_employee_reports')
          .update(reportData)
          .eq('id', reportId);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('org_employee_reports')
          .insert(reportData)
          .select()
          .single();
        if (error) throw error;
        setReportId(data.id);
      }
      setReportStatus(submitNow ? 'submitted' : 'draft');
      setTodayReportExists(true);
      if (submitNow) {
        setShowReportModal(false);
      }
    } catch (err) {
      console.error('Error saving report:', err);
      alert('Failed to save report');
    }
    setSavingReport(false);
  };

  const filteredChecklists = checklists.filter((c) => c.type === activeTab);

  if (authLoading || !user || loading) {
    return (
      <div
        style={{
          background: '#0D0D0D',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A1A1AA',
          fontFamily: 'Mabry Pro, sans-serif',
        }}
      >
        Loading...
      </div>
    );
  }

  // Access Denied screen
  if (accessDenied) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#0D0D0D',
          fontFamily: 'Mabry Pro, sans-serif',
        }}
      >
        <Sidebar />
        <main
          className="page-main"
          style={{
            flex: 1,
            marginLeft: '280px',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <ShieldExclamationIcon
              style={{ width: '48px', height: '48px', color: '#EF4444', margin: '0 auto 1rem' }}
            />
            <h1 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Access Denied
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              You do not have permission to view this member&apos;s dashboard. Only their managers,
              department creators, and company admins can access this page.
            </p>
            <button
              onClick={() => router.push(`/company/${companyId}/department/${deptId}`)}
              style={{
                padding: '0.625rem 1.5rem',
                background: '#3B82F6',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Department
            </button>
          </div>
        </main>
      </div>
    );
  }

  const tabs: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0D0D0D',
        fontFamily: 'Mabry Pro, sans-serif',
      }}
    >
      <Sidebar />
      <main
        className="page-main"
        style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/company"
            style={{ color: '#71717A', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
          >
            Company
          </Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link
            href={`/company/${companyId}`}
            style={{ color: '#71717A', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
          >
            {companyName}
          </Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link
            href={`/company/${companyId}/department/${deptId}`}
            style={{ color: '#71717A', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
          >
            {deptName}
          </Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{memberName}</span>
        </div>

        {/* Member Header */}
        <div
          style={{
            background: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontSize: '1.5rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {memberName}
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', margin: '0.125rem 0 0' }}>
              {memberEmail}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.625rem',
                  background: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '0.375rem',
                  color: '#A1A1AA',
                  fontSize: '0.8125rem',
                }}
              >
                {memberDeptRole}
              </span>
              {managerName && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.125rem 0.625rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '0.375rem',
                    color: '#71717A',
                    fontSize: '0.8125rem',
                  }}
                >
                  Reports to: <span style={{ color: '#A1A1AA' }}>{managerName}</span>
                </span>
              )}
            </div>
          </div>
          {isSelf && (
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: todayReportExists && reportStatus === 'submitted' ? '#1A1A1A' : '#10B981',
                color: '#FFFFFF',
                border: todayReportExists && reportStatus === 'submitted' ? '1px solid #2D2D2D' : 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (todayReportExists && reportStatus === 'submitted') {
                  e.currentTarget.style.borderColor = '#3D3D3D';
                } else {
                  e.currentTarget.style.background = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (todayReportExists && reportStatus === 'submitted') {
                  e.currentTarget.style.borderColor = '#2D2D2D';
                } else {
                  e.currentTarget.style.background = '#10B981';
                }
              }}
            >
              <DocumentTextIcon style={{ width: '18px', height: '18px' }} />
              {todayReportExists
                ? reportStatus === 'submitted'
                  ? 'View Today\'s Report'
                  : 'Edit Draft Report'
                : 'Write Daily Report'}
            </button>
          )}
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Responsibilities */}
          <div
            style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Roles & Responsibilities
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {responsibilities.length === 0 && (
                <p style={{ color: '#71717A', fontSize: '0.875rem' }}>
                  No responsibilities added yet
                </p>
              )}
              {responsibilities.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    background: '#141414',
                    borderRadius: '0.5rem',
                    border: '1px solid #2D2D2D',
                  }}
                >
                  <span style={{ color: '#FFFFFF', fontSize: '0.875rem', flex: 1 }}>
                    {r.content}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteResponsibility(r.id)}
                      style={{
                        padding: '0.125rem',
                        background: 'none',
                        border: 'none',
                        color: '#71717A',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                    >
                      <TrashIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddResponsibility();
                  }}
                  placeholder="Add a responsibility..."
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')}
                />
                <button
                  onClick={handleAddResponsibility}
                  disabled={!newResponsibility.trim() || saving}
                  style={{
                    padding: '0.625rem',
                    background: newResponsibility.trim() ? '#10B981' : '#3D3D3D',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    cursor: newResponsibility.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <PlusIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            )}
          </div>

          {/* Checklists */}
          <div
            style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Checklists
            </h2>
            <p style={{ color: '#52525B', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              Tasks auto-reset at the end of each day / week / month
            </p>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '1rem',
                background: '#141414',
                borderRadius: '0.5rem',
                padding: '0.25rem',
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: activeTab === tab ? '#10B981' : 'transparent',
                    color: activeTab === tab ? '#FFFFFF' : '#71717A',
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

            {/* Checklist items */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                marginBottom: '1rem',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {filteredChecklists.length === 0 && (
                <p style={{ color: '#71717A', fontSize: '0.875rem' }}>
                  No {activeTab} items yet
                </p>
              )}
              {filteredChecklists.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    background: '#141414',
                    borderRadius: '0.5rem',
                    border: '1px solid #2D2D2D',
                  }}
                >
                  {/* Toggle checkbox */}
                  <button
                    onClick={() => handleToggleChecklist(item)}
                    disabled={!isSelf && !canManage}
                    style={{
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      cursor: isSelf || canManage ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    {item.is_completed ? (
                      <CheckCircleSolidIcon
                        style={{ width: '20px', height: '20px', color: '#10B981' }}
                      />
                    ) : (
                      <CheckCircleIcon
                        style={{ width: '20px', height: '20px', color: '#3D3D3D' }}
                      />
                    )}
                  </button>

                  {/* Title - editable inline */}
                  {editingChecklistId === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                      <input
                        value={editChecklistValue}
                        onChange={(e) => setEditChecklistValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditChecklist(item.id);
                          if (e.key === 'Escape') setEditingChecklistId(null);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '0.25rem 0.5rem',
                          background: '#0D0D0D',
                          border: '1px solid #3B82F6',
                          borderRadius: '0.375rem',
                          color: '#FFFFFF',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleEditChecklist(item.id)}
                        style={{ padding: '0.125rem', background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}
                      >
                        <CheckIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => setEditingChecklistId(null)}
                        style={{ padding: '0.125rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}
                      >
                        <XMarkIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        color: item.is_completed ? '#71717A' : '#FFFFFF',
                        fontSize: '0.875rem',
                        textDecoration: item.is_completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </span>
                  )}

                  {/* Edit & Delete buttons */}
                  {(canManage || isSelf) && editingChecklistId !== item.id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setEditingChecklistId(item.id);
                          setEditChecklistValue(item.title);
                        }}
                        style={{
                          padding: '0.125rem',
                          background: 'none',
                          border: 'none',
                          color: '#71717A',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#3B82F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Edit"
                      >
                        <PencilIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteChecklist(item.id)}
                        style={{
                          padding: '0.125rem',
                          background: 'none',
                          border: 'none',
                          color: '#71717A',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Delete"
                      >
                        <TrashIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            {(canManage || isSelf) && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChecklist();
                  }}
                  placeholder={`Add ${activeTab} item...`}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')}
                />
                <button
                  onClick={handleAddChecklist}
                  disabled={!newChecklistTitle.trim() || saving}
                  style={{
                    padding: '0.625rem',
                    background: newChecklistTitle.trim() ? '#10B981' : '#3D3D3D',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    cursor: newChecklistTitle.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <PlusIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Daily Report Modal */}
        {showReportModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setShowReportModal(false)}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '560px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Daily Report</h3>
                  <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {reportStatus === 'submitted' && (
                    <span style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                      Submitted
                    </span>
                  )}
                  {reportStatus === 'draft' && todayReportExists && (
                    <span style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      Draft
                    </span>
                  )}
                  <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                    <XMarkIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </div>

              {/* Report Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>What did you do today?</label>
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Describe your main activities and accomplishments..."
                    rows={4}
                    disabled={reportStatus === 'submitted'}
                    style={{
                      width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D',
                      borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Mabry Pro, sans-serif',
                      opacity: reportStatus === 'submitted' ? 0.7 : 1,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Tasks Completed</label>
                  <textarea
                    value={reportTasksCompleted}
                    onChange={(e) => setReportTasksCompleted(e.target.value)}
                    placeholder="List the tasks you completed today..."
                    rows={3}
                    disabled={reportStatus === 'submitted'}
                    style={{
                      width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D',
                      borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Mabry Pro, sans-serif',
                      opacity: reportStatus === 'submitted' ? 0.7 : 1,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Challenges / Blockers</label>
                  <textarea
                    value={reportChallenges}
                    onChange={(e) => setReportChallenges(e.target.value)}
                    placeholder="Any issues or blockers you encountered..."
                    rows={2}
                    disabled={reportStatus === 'submitted'}
                    style={{
                      width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D',
                      borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Mabry Pro, sans-serif',
                      opacity: reportStatus === 'submitted' ? 0.7 : 1,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Plans for Tomorrow</label>
                  <textarea
                    value={reportPlans}
                    onChange={(e) => setReportPlans(e.target.value)}
                    placeholder="What do you plan to work on next..."
                    rows={2}
                    disabled={reportStatus === 'submitted'}
                    style={{
                      width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D',
                      borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Mabry Pro, sans-serif',
                      opacity: reportStatus === 'submitted' ? 0.7 : 1,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  />
                </div>
              </div>

              {/* Actions */}
              {reportStatus !== 'submitted' && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    onClick={() => setShowReportModal(false)}
                    style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveReport(false)}
                    disabled={savingReport}
                    style={{
                      padding: '0.625rem 1.25rem', background: '#1A1A1A', border: '1px solid #3D3D3D',
                      borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500,
                      cursor: 'pointer', opacity: savingReport ? 0.7 : 1,
                    }}
                  >
                    {savingReport ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSaveReport(true)}
                    disabled={savingReport || !reportContent.trim()}
                    style={{
                      padding: '0.625rem 1.25rem', background: reportContent.trim() ? '#10B981' : '#3D3D3D',
                      border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem',
                      fontWeight: 500, cursor: reportContent.trim() ? 'pointer' : 'not-allowed',
                      opacity: savingReport ? 0.7 : 1,
                    }}
                  >
                    {savingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
