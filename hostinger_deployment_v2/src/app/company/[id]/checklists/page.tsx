'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ChevronRightIcon,
  CheckIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  UserIcon,
  UserGroupIcon,
  UserPlusIcon,
  FolderPlusIcon,
  FolderIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

/* ─── Types ────────────────────────────────────────────── */

interface Category {
  id: number;
  company_id: number;
  name: string;
  description: string;
  color: string;
  created_by: number;
}

interface DeptInfo { id: number; name: string; }

interface StaffMember {
  memberId: number;
  user_id: number;
  department_id: number;
  department_name: string;
  user_name: string;
  user_email: string;
  role: string;
}

interface ChecklistItem {
  id: number;
  department_id: number;
  user_id: number;
  category_id: number | null;
  type: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  reset_time: string;
  reset_day_of_week: number | null;
  reset_day_of_month: number | null;
  created_by: number;
  created_at: string;
}

/* ─── Schedule Helpers ─────────────────────────────────── */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#F97316', '#14B8A6', '#A855F7'];

function getLastResetTime(type: string, resetTime: string, dayOfWeek: number | null, dayOfMonth: number | null): Date {
  const now = new Date();
  const [h, m] = (resetTime || '00:00').split(':').map(Number);
  if (type === 'daily') {
    const resetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    return now >= resetToday ? resetToday : new Date(resetToday.getTime() - 86400000);
  }
  if (type === 'weekly') {
    const target = dayOfWeek ?? 1;
    const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    const currentDay = now.getDay();
    let daysBack = (currentDay - target + 7) % 7;
    if (daysBack === 0 && now < todayReset) daysBack = 7;
    return new Date(todayReset.getTime() - daysBack * 86400000);
  }
  if (type === 'monthly') {
    const target = dayOfMonth ?? 1;
    const candidate = new Date(now.getFullYear(), now.getMonth(), target, h, m, 0, 0);
    if (now < candidate) candidate.setMonth(candidate.getMonth() - 1);
    return candidate;
  }
  return new Date(0);
}

function shouldReset(item: ChecklistItem): boolean {
  if (!item.is_completed || !item.completed_at) return false;
  const lastReset = getLastResetTime(item.type, item.reset_time, item.reset_day_of_week, item.reset_day_of_month);
  return new Date(item.completed_at) < lastReset;
}

function formatSchedule(type: string, resetTime: string, dayOfWeek: number | null, dayOfMonth: number | null): string {
  const time = formatTime12(resetTime || '00:00');
  if (type === 'daily') return `Daily at ${time}`;
  if (type === 'weekly') return `${SHORT_DAYS[dayOfWeek ?? 1]} at ${time}`;
  if (type === 'monthly') return `${ordinal(dayOfMonth ?? 1)} of month at ${time}`;
  return type;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function scheduleKey(item: ChecklistItem): string {
  return `${item.type}-${item.reset_time || '00:00'}-${item.reset_day_of_week ?? ''}-${item.reset_day_of_month ?? ''}`;
}

const TYPE_COLORS: Record<string, string> = { daily: '#3B82F6', weekly: '#8B5CF6', monthly: '#F59E0B' };

/* ─── Component ────────────────────────────────────────── */

export default function CompanyChecklistsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.id);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<DeptInfo[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (inside open folder)
  const [filterDept, setFilterDept] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Folder navigation
  const [openCatId, setOpenCatId] = useState<number | null>(null);
  const [collapsedStaff, setCollapsedStaff] = useState<Set<string>>(new Set());

  // Inline add
  const [inlineAddKey, setInlineAddKey] = useState<string | null>(null);
  const [inlineAddTitle, setInlineAddTitle] = useState('');

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#3B82F6');

  // Delete category
  const [showDeleteCat, setShowDeleteCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  // Create checklist modal
  const [showCreate, setShowCreate] = useState(false);
  const [createCat, setCreateCat] = useState<number | ''>('');
  const [createDept, setCreateDept] = useState<number | ''>('');
  const [createStaffIds, setCreateStaffIds] = useState<Set<number>>(new Set());
  const [createType, setCreateType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [createTime, setCreateTime] = useState('09:00');
  const [createDayOfWeek, setCreateDayOfWeek] = useState(1);
  const [createDayOfMonth, setCreateDayOfMonth] = useState(1);
  const [createTitle, setCreateTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Inline edit (kept for quick title edits)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Full edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editTime, setEditTime] = useState('09:00');
  const [editDayOfWeek, setEditDayOfWeek] = useState(1);
  const [editDayOfMonth, setEditDayOfMonth] = useState(1);
  const [editAssignIds, setEditAssignIds] = useState<Set<number>>(new Set());
  const [editDeptFilter, setEditDeptFilter] = useState<number | ''>('');

  // Assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignItem, setAssignItem] = useState<ChecklistItem | null>(null);
  const [assignDept, setAssignDept] = useState<number | ''>('');
  const [assignStaffIds, setAssignStaffIds] = useState<Set<number>>(new Set());

  // View mode & Team Progress
  const [viewMode, setViewMode] = useState<'checklists' | 'team-progress'>('checklists');
  const [progressDate, setProgressDate] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [calendarEmployee, setCalendarEmployee] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  /* ─── Data Fetching ──────────────────────────────────── */

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: co } = await supabase.from('org_companies').select('name').eq('id', companyId).single();
      setCompanyName(co?.name || '');

      const [catsRes, deptsRes] = await Promise.all([
        supabase.from('org_checklist_categories').select('*').eq('company_id', companyId).order('created_at', { ascending: true }),
        supabase.from('org_departments').select('id, name').eq('company_id', companyId).order('created_at', { ascending: true }),
      ]);
      setCategories(catsRes.data || []);
      const deptList = deptsRes.data || [];
      setDepartments(deptList);

      if (deptList.length === 0) { setStaff([]); setChecklists([]); setLoading(false); return; }

      const deptIds = deptList.map((d: any) => d.id);
      const deptMap: Record<number, string> = {};
      deptList.forEach((d: any) => { deptMap[d.id] = d.name; });

      const [membersRes, checklistsRes] = await Promise.all([
        supabase.from('org_department_members').select('id, department_id, user_id, role').in('department_id', deptIds),
        supabase.from('org_checklists').select('*').in('department_id', deptIds).order('created_at', { ascending: true }),
      ]);

      const memberList = membersRes.data || [];
      const allUserIds = [...new Set(memberList.map((m: any) => m.user_id))];
      let usersMap: Record<number, any> = {};
      if (allUserIds.length > 0) {
        const { data: users } = await supabase.from('auth_user').select('id, name, email').in('id', allUserIds);
        (users || []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      setStaff(memberList.map((m: any) => ({
        memberId: m.id, user_id: m.user_id, department_id: m.department_id,
        department_name: deptMap[m.department_id] || '', user_name: usersMap[m.user_id]?.name || 'Unknown',
        user_email: usersMap[m.user_id]?.email || '', role: m.role,
      })));

      const items: ChecklistItem[] = (checklistsRes.data || []).map((c: any) => ({
        ...c, reset_time: c.reset_time || '00:00',
        reset_day_of_week: c.reset_day_of_week ?? null, reset_day_of_month: c.reset_day_of_month ?? null,
        category_id: c.category_id ?? null,
      }));

      const idsToReset = items.filter(shouldReset).map((i) => i.id);
      if (idsToReset.length > 0) {
        await supabase.from('org_checklists').update({ is_completed: false, completed_at: null }).in('id', idsToReset);
        items.forEach((i) => { if (idsToReset.includes(i.id)) { i.is_completed = false; i.completed_at = null; } });
      }
      setChecklists(items);
    } catch (err) { console.error('Error fetching checklists:', err); }
    setLoading(false);
  }, [user, companyId]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);

  /* ─── Category Handlers ──────────────────────────────── */

  const handleSaveCat = async () => {
    if (!catName.trim() || !user) return;
    setSaving(true);
    try {
      if (editingCat) {
        await supabase.from('org_checklist_categories').update({ name: catName.trim(), description: catDesc.trim(), color: catColor }).eq('id', editingCat.id);
      } else {
        await supabase.from('org_checklist_categories').insert({ company_id: companyId, name: catName.trim(), description: catDesc.trim(), color: catColor, created_by: user.id });
      }
      setShowCatModal(false); setEditingCat(null); setCatName(''); setCatDesc(''); setCatColor('#3B82F6');
      fetchData();
    } catch (err) { console.error(err); alert('Failed to save category'); }
    setSaving(false);
  };

  const handleDeleteCat = async () => {
    if (!deletingCat) return;
    setSaving(true);
    try {
      // Unlink checklists first (set category_id to null), then delete
      await supabase.from('org_checklists').update({ category_id: null }).eq('category_id', deletingCat.id);
      await supabase.from('org_checklist_categories').delete().eq('id', deletingCat.id);
      setShowDeleteCat(false); setDeletingCat(null);
      fetchData();
    } catch (err) { console.error(err); alert('Failed to delete category'); }
    setSaving(false);
  };

  /* ─── Checklist Handlers ─────────────────────────────── */

  const handleCreate = async () => {
    if (!createTitle.trim() || createStaffIds.size === 0 || !createDept || !createCat || !user) return;
    setSaving(true);
    try {
      const targetUsers = [...createStaffIds];

      const insertRows = targetUsers.map(uid => {
        const row: Record<string, unknown> = {
          department_id: createDept, user_id: uid, type: createType,
          title: createTitle.trim(), is_completed: false, created_by: user.id, reset_time: createTime,
          category_id: createCat || null,
        };
        if (createType === 'weekly') row.reset_day_of_week = createDayOfWeek;
        if (createType === 'monthly') row.reset_day_of_month = createDayOfMonth;
        return row;
      });

      const { data, error } = await supabase.from('org_checklists').insert(insertRows).select();
      if (error) throw error;
      if (data) setChecklists((prev) => [...prev, ...data.map((d: any) => ({ ...d, reset_time: d.reset_time || '00:00', reset_day_of_week: d.reset_day_of_week ?? null, reset_day_of_month: d.reset_day_of_month ?? null, category_id: d.category_id ?? null } as ChecklistItem))]);
      setCreateTitle('');
    } catch (err) { console.error(err); alert('Failed to create checklist'); }
    setSaving(false);
  };

  const handleInlineAdd = async (userId: number, deptId: number, refItem: ChecklistItem) => {
    if (!inlineAddTitle.trim() || !user) return;
    setSaving(true);
    const title = inlineAddTitle.trim();
    setInlineAddTitle('');
    try {
      const insertData: Record<string, unknown> = {
        department_id: deptId, user_id: userId, type: refItem.type, title,
        is_completed: false, created_by: user.id, reset_time: refItem.reset_time,
        category_id: refItem.category_id || null,
      };
      if (refItem.type === 'weekly') insertData.reset_day_of_week = refItem.reset_day_of_week;
      if (refItem.type === 'monthly') insertData.reset_day_of_month = refItem.reset_day_of_month;

      const { data, error } = await supabase.from('org_checklists').insert(insertData).select().single();
      if (error) throw error;
      if (data) setChecklists((prev) => [...prev, { ...data, reset_time: data.reset_time || '00:00', reset_day_of_week: data.reset_day_of_week ?? null, reset_day_of_month: data.reset_day_of_month ?? null, category_id: data.category_id ?? null } as ChecklistItem]);
    } catch (err) { console.error(err); alert('Failed to add item'); setInlineAddTitle(title); }
    setSaving(false);
  };

  const handleToggle = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    setChecklists((prev) => prev.map((c) => c.id === item.id ? { ...c, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : c));
    try { await supabase.from('org_checklists').update({ is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }).eq('id', item.id); }
    catch (err) { console.error(err); setChecklists((prev) => prev.map((c) => (c.id === item.id ? item : c))); }
  };

  const handleEdit = async (id: number) => {
    if (!editValue.trim()) return;
    const newTitle = editValue.trim();
    setEditingId(null); setEditValue('');
    setChecklists((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    try { await supabase.from('org_checklists').update({ title: newTitle }).eq('id', id); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    try { await supabase.from('org_checklists').delete().eq('id', id); } catch (err) { console.error(err); }
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditType(item.type as 'daily' | 'weekly' | 'monthly');
    setEditTime(item.reset_time || '09:00');
    setEditDayOfWeek(item.reset_day_of_week ?? 1);
    setEditDayOfMonth(item.reset_day_of_month ?? 1);
    setEditDeptFilter(item.department_id);
    // Find all users who have this same checklist (same title, category, schedule)
    const assigned = new Set(
      checklists.filter(c => c.title === item.title && c.category_id === item.category_id && c.type === item.type && c.reset_time === item.reset_time).map(c => c.user_id)
    );
    setEditAssignIds(assigned);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editItem || !user || !editTitle.trim()) return;
    setSaving(true);
    try {
      // 1. Update existing items (title + schedule)
      const siblingItems = checklists.filter(c =>
        c.title === editItem.title && c.category_id === editItem.category_id &&
        c.type === editItem.type && c.reset_time === editItem.reset_time
      );
      const siblingIds = siblingItems.map(c => c.id);
      const updateData: Record<string, unknown> = {
        title: editTitle.trim(), type: editType, reset_time: editTime,
        reset_day_of_week: editType === 'weekly' ? editDayOfWeek : null,
        reset_day_of_month: editType === 'monthly' ? editDayOfMonth : null,
      };
      if (siblingIds.length > 0) {
        await supabase.from('org_checklists').update(updateData).in('id', siblingIds);
      }

      // 2. Add new assignments
      const alreadyAssigned = new Set(siblingItems.map(c => c.user_id));
      const newUserIds = [...editAssignIds].filter(uid => !alreadyAssigned.has(uid));
      if (newUserIds.length > 0) {
        const insertRows = newUserIds.map(uid => ({
          department_id: editItem.department_id, user_id: uid, type: editType,
          title: editTitle.trim(), is_completed: false, created_by: user.id,
          reset_time: editTime, category_id: editItem.category_id || null,
          ...(editType === 'weekly' ? { reset_day_of_week: editDayOfWeek } : {}),
          ...(editType === 'monthly' ? { reset_day_of_month: editDayOfMonth } : {}),
        }));
        await supabase.from('org_checklists').insert(insertRows);
      }

      // 3. Remove unassigned users
      const removedUserIds = [...alreadyAssigned].filter(uid => !editAssignIds.has(uid));
      if (removedUserIds.length > 0) {
        const removeIds = siblingItems.filter(c => removedUserIds.includes(c.user_id)).map(c => c.id);
        if (removeIds.length > 0) await supabase.from('org_checklists').delete().in('id', removeIds);
      }

      setShowEditModal(false);
      fetchData(); // Refresh all data
    } catch (err) { console.error(err); alert('Failed to save'); }
    setSaving(false);
  };

  const openAssignModal = (item: ChecklistItem) => {
    setAssignItem(item);
    setAssignDept(item.department_id);
    // Pre-check users who already have this exact checklist
    const alreadyAssigned = new Set(
      checklists.filter(c => c.title === item.title && c.category_id === item.category_id && c.type === item.type && c.reset_time === item.reset_time).map(c => c.user_id)
    );
    setAssignStaffIds(alreadyAssigned);
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!assignItem || !user) return;
    setSaving(true);
    try {
      // Find ALL items in this schedule group (same category, type, schedule)
      const groupItems = checklists.filter(c =>
        c.category_id === assignItem.category_id && c.type === assignItem.type &&
        c.reset_time === assignItem.reset_time &&
        c.reset_day_of_week === assignItem.reset_day_of_week &&
        c.reset_day_of_month === assignItem.reset_day_of_month &&
        c.user_id === assignItem.user_id
      );
      // Find who already has this checklist group
      const alreadyHas = new Set(
        checklists.filter(c =>
          c.category_id === assignItem.category_id && c.type === assignItem.type &&
          c.reset_time === assignItem.reset_time
        ).map(c => c.user_id)
      );
      // New users to assign
      const newUserIds = [...assignStaffIds].filter(uid => !alreadyHas.has(uid));
      if (newUserIds.length === 0) { setShowAssign(false); setSaving(false); return; }

      // Copy ALL items in the group for each new user
      const insertRows: Record<string, unknown>[] = [];
      for (const uid of newUserIds) {
        for (const item of groupItems) {
          const row: Record<string, unknown> = {
            department_id: item.department_id, user_id: uid, type: item.type,
            title: item.title, is_completed: false, created_by: user.id,
            reset_time: item.reset_time, category_id: item.category_id || null,
          };
          if (item.type === 'weekly') row.reset_day_of_week = item.reset_day_of_week;
          if (item.type === 'monthly') row.reset_day_of_month = item.reset_day_of_month;
          insertRows.push(row);
        }
      }

      const { data, error } = await supabase.from('org_checklists').insert(insertRows).select();
      if (error) throw error;
      if (data) setChecklists(prev => [...prev, ...data.map((d: any) => ({ ...d, reset_time: d.reset_time || '00:00', reset_day_of_week: d.reset_day_of_week ?? null, reset_day_of_month: d.reset_day_of_month ?? null, category_id: d.category_id ?? null } as ChecklistItem))]);
      setShowAssign(false);
    } catch (err) { console.error(err); alert('Failed to assign'); }
    setSaving(false);
  };

  /* ─── Computed Data ──────────────────────────────────── */

  type ScheduleGroup = { key: string; type: string; resetTime: string; dayOfWeek: number | null; dayOfMonth: number | null; items: ChecklistItem[] };
  type StaffGroup = { staff: StaffMember; schedules: ScheduleGroup[] };

  const buildStaffGroups = (items: ChecklistItem[]): StaffGroup[] => {
    const result: StaffGroup[] = [];
    const userIdsSeen = new Set<number>();
    for (const s of staff) {
      const userItems = items.filter((c) => c.user_id === s.user_id && c.department_id === s.department_id);
      if (userItems.length === 0) continue;
      if (userIdsSeen.has(s.user_id)) continue;
      userIdsSeen.add(s.user_id);
      const schedMap = new Map<string, ScheduleGroup>();
      for (const item of userItems) {
        const k = scheduleKey(item);
        if (!schedMap.has(k)) schedMap.set(k, { key: k, type: item.type, resetTime: item.reset_time, dayOfWeek: item.reset_day_of_week, dayOfMonth: item.reset_day_of_month, items: [] });
        schedMap.get(k)!.items.push(item);
      }
      result.push({ staff: s, schedules: Array.from(schedMap.values()) });
    }
    return result;
  };

  // Per-category stats for folder grid
  const categoryStats = categories.map(cat => {
    const catItems = checklists.filter(c => c.category_id === cat.id);
    const completed = catItems.filter(c => c.is_completed).length;
    const staffCount = new Set(catItems.map(c => c.user_id)).size;
    return { cat, total: catItems.length, completed, staffCount };
  });

  // Open folder data
  const openCat = openCatId !== null ? categories.find(c => c.id === openCatId) || null : null;
  const openCatItems = openCatId !== null
    ? checklists.filter(c => {
        if (c.category_id !== openCatId) return false;
        if (filterDept !== 'all' && c.department_id !== filterDept) return false;
        if (filterType !== 'all' && c.type !== filterType) return false;
        return true;
      })
    : [];
  const openCatStaffGroups = openCatId !== null ? buildStaffGroups(openCatItems) : [];
  const openCatTotalAll = openCatId !== null ? checklists.filter(c => c.category_id === openCatId).length : 0;
  const openCatCompletedAll = openCatId !== null ? checklists.filter(c => c.category_id === openCatId && c.is_completed).length : 0;

  const totalItems = checklists.length;
  const completedItems = checklists.filter((c) => c.is_completed).length;
  const staffForDept = createDept ? staff.filter((s) => s.department_id === Number(createDept)) : [];
  const uniqueStaffForDept = staffForDept.filter((s, i, arr) => arr.findIndex((x) => x.user_id === s.user_id) === i);

  /* ─── Toggle helpers ─────────────────────────────────── */

  const toggleStaff = (key: string) => {
    setCollapsedStaff((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  };

  /* ─── Team Progress Data ─────────────────────────────── */

  // Check if an item is "active" for a given date based on its schedule
  const isItemActiveForDate = (item: ChecklistItem, dateStr: string): boolean => {
    const date = new Date(dateStr + 'T12:00:00');
    if (item.type === 'daily') return true;
    if (item.type === 'weekly') {
      const target = item.reset_day_of_week ?? 1;
      // Item is active every day until next reset day
      return true; // weekly items are always relevant
    }
    if (item.type === 'monthly') return true; // monthly items are always relevant
    return true;
  };

  // Check if an item was completed during the active period for a given date
  const isItemCompletedForDate = (item: ChecklistItem, dateStr: string): boolean => {
    if (!item.completed_at) return false;
    if (!item.is_completed && dateStr === progressDate) return false;
    const completedAt = new Date(item.completed_at);
    const lastReset = getLastResetTime(item.type, item.reset_time, item.reset_day_of_week, item.reset_day_of_month);
    // For current date: use actual state
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) return item.is_completed;
    // For past dates: check if completed_at falls within that date's active period
    const viewDate = new Date(dateStr + 'T23:59:59');
    return completedAt <= viewDate && completedAt >= lastReset;
  };

  // Get unique employees
  const uniqueEmployees = staff.filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i);

  // Build team progress data
  const teamProgressData = uniqueEmployees.map(s => {
    const userItems = checklists.filter(c => c.user_id === s.user_id);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = progressDate === todayStr;
    const completed = isToday
      ? userItems.filter(c => c.is_completed).length
      : userItems.filter(c => isItemCompletedForDate(c, progressDate)).length;
    const total = userItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Per-category breakdown
    const catBreakdown: { cat: Category | null; items: ChecklistItem[]; completed: number; total: number }[] = [];
    for (const cat of categories) {
      const catItems = userItems.filter(c => c.category_id === cat.id);
      if (catItems.length === 0) continue;
      const catCompleted = isToday
        ? catItems.filter(c => c.is_completed).length
        : catItems.filter(c => isItemCompletedForDate(c, progressDate)).length;
      catBreakdown.push({ cat, items: catItems, completed: catCompleted, total: catItems.length });
    }
    const uncatItems = userItems.filter(c => c.category_id === null);
    if (uncatItems.length > 0) {
      const ucCompleted = isToday
        ? uncatItems.filter(c => c.is_completed).length
        : uncatItems.filter(c => isItemCompletedForDate(c, progressDate)).length;
      catBreakdown.push({ cat: null, items: uncatItems, completed: ucCompleted, total: uncatItems.length });
    }

    return { staff: s, completed, total, percentage, catBreakdown };
  }).filter(d => d.total > 0).sort((a, b) => b.percentage - a.percentage);

  // Calendar helpers
  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  // Get completion percentage for a specific employee on a specific date
  const getEmployeeDayCompletion = (userId: number, year: number, month: number, day: number): number => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const userItems = checklists.filter(c => c.user_id === userId);
    if (userItems.length === 0) return -1; // no items
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isFuture = dateStr > todayStr;
    if (isFuture) return -1;
    const isToday = dateStr === todayStr;
    const completed = isToday
      ? userItems.filter(c => c.is_completed).length
      : userItems.filter(c => isItemCompletedForDate(c, dateStr)).length;
    return Math.round((completed / userItems.length) * 100);
  };

  const getCompletionColor = (pct: number): string => {
    if (pct < 0) return 'transparent';
    if (pct === 100) return '#10B981';
    if (pct >= 75) return '#34D399';
    if (pct >= 50) return '#F59E0B';
    if (pct >= 25) return '#F97316';
    if (pct > 0) return '#EF4444';
    return '#2D2D2D';
  };

  const formatDateLabel = (dateStr: string): string => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navigateDate = (dir: -1 | 1) => {
    const d = new Date(progressDate + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setProgressDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* ─── Render ─────────────────────────────────────────── */

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href="/company" style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>Company</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link href={`/company/${companyId}`} style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>{companyName}</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>Checklists</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Checklists</h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage recurring tasks by category for your team</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setEditingCat(null); setCatName(''); setCatDesc(''); setCatColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]); setShowCatModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
              <FolderPlusIcon style={{ width: '16px', height: '16px' }} /> New Category
            </button>
            <button onClick={() => { setCreateCat(openCatId !== null ? openCatId : (categories.length > 0 ? categories[0].id : '')); setCreateDept(departments.length === 1 ? departments[0].id : ''); setCreateStaffIds(new Set()); setCreateType('daily'); setCreateTime('09:00'); setCreateDayOfWeek(1); setCreateDayOfMonth(1); setCreateTitle(''); setShowCreate(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}>
              <PlusIcon style={{ width: '18px', height: '18px' }} /> New Checklist
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid #2D2D2D', marginBottom: '1.5rem', width: 'fit-content' }}>
          <button onClick={() => setViewMode('checklists')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: viewMode === 'checklists' ? '#3B82F6' : 'transparent', color: viewMode === 'checklists' ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <ClipboardDocumentListIcon style={{ width: '16px', height: '16px' }} /> Checklists
          </button>
          <button onClick={() => setViewMode('team-progress')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: viewMode === 'team-progress' ? '#8B5CF6' : 'transparent', color: viewMode === 'team-progress' ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <UserGroupIcon style={{ width: '16px', height: '16px' }} /> Team Progress
          </button>
        </div>

        {/* Stats */}
        {!loading && totalItems > 0 && viewMode === 'checklists' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', value: totalItems, color: '#FFFFFF' },
              { label: 'Completed', value: completedItems, color: '#10B981' },
              { label: 'Remaining', value: totalItems - completedItems, color: '#F59E0B' },
              { label: 'Progress', value: `${totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%`, color: '#3B82F6' },
            ].map((s) => (
              <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', flex: 1 }}>
                <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TEAM PROGRESS VIEW ─────────────────────── */}
        {viewMode === 'team-progress' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Date Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}>
              <button onClick={() => navigateDate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.8125rem', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                <ChevronLeftIcon style={{ width: '14px', height: '14px' }} /> Previous
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700 }}>{formatDateLabel(progressDate)}</div>
                <div style={{ color: '#52525B', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                  {teamProgressData.length} employee{teamProgressData.length !== 1 ? 's' : ''} with checklists
                </div>
              </div>
              <button onClick={() => navigateDate(1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.8125rem', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                Next <ChevronRightIcon style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* Overall Stats */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { label: 'Employees', value: teamProgressData.length, color: '#FFFFFF' },
                { label: 'Avg Completion', value: `${teamProgressData.length > 0 ? Math.round(teamProgressData.reduce((a, b) => a + b.percentage, 0) / teamProgressData.length) : 0}%`, color: '#3B82F6' },
                { label: 'Fully Done', value: teamProgressData.filter(d => d.percentage === 100).length, color: '#10B981' },
                { label: 'Not Started', value: teamProgressData.filter(d => d.percentage === 0).length, color: '#EF4444' },
              ].map((s) => (
                <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', flex: 1 }}>
                  <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Employee Cards */}
            {teamProgressData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A' }}>
                <UserGroupIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem' }}>No employees with checklists</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {teamProgressData.map(({ staff: emp, completed, total, percentage, catBreakdown }) => {
                  const isExpanded = expandedEmployee === emp.user_id;
                  const showCalendar = calendarEmployee === emp.user_id;
                  return (
                    <div key={emp.user_id} style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', overflow: 'hidden' }}>
                      {/* Employee header */}
                      <div
                        onClick={() => setExpandedEmployee(isExpanded ? null : emp.user_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${percentage === 100 ? '#10B981' : percentage > 0 ? '#3B82F6' : '#3D3D3D'}, ${percentage === 100 ? '#059669' : percentage > 0 ? '#2563EB' : '#2D2D2D'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0 }}>
                          {emp.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600 }}>{emp.user_name}</span>
                            <span style={{ color: '#52525B', fontSize: '0.75rem' }}>{emp.department_name}</span>
                            <span style={{ padding: '0.0625rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{emp.role}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                            <div style={{ flex: 1, maxWidth: '200px', height: '6px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#10B981' : percentage >= 50 ? '#3B82F6' : '#F59E0B', borderRadius: '3px', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ color: percentage === 100 ? '#10B981' : '#A1A1AA', fontSize: '0.75rem', fontWeight: 600 }}>{percentage}%</span>
                            <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{completed}/{total} tasks</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {/* Calendar toggle */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setCalendarEmployee(showCalendar ? null : emp.user_id); }}
                            style={{ padding: '0.375rem', background: showCalendar ? 'rgba(139,92,246,0.15)' : 'none', border: showCalendar ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent', borderRadius: '0.375rem', color: showCalendar ? '#8B5CF6' : '#52525B', cursor: 'pointer', lineHeight: 0 }}
                            onMouseEnter={(e) => { if (!showCalendar) e.currentTarget.style.color = '#8B5CF6'; }}
                            onMouseLeave={(e) => { if (!showCalendar) e.currentTarget.style.color = '#52525B'; }}
                            title="View calendar"
                          >
                            <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                          <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#52525B', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        </div>
                      </div>

                      {/* Calendar View */}
                      {showCalendar && (
                        <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid #2D2D2D' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0 0.5rem' }}>
                            <button onClick={() => setCalendarMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })}
                              style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', lineHeight: 0 }}>
                              <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                            <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>{monthNames[calendarMonth.month]} {calendarMonth.year}</span>
                            <button onClick={() => setCalendarMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })}
                              style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', lineHeight: 0 }}>
                              <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                          {/* Day headers */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem', marginBottom: '0.25rem' }}>
                            {SHORT_DAYS.map(d => (
                              <div key={d} style={{ textAlign: 'center', color: '#52525B', fontSize: '0.625rem', fontWeight: 600, padding: '0.25rem' }}>{d}</div>
                            ))}
                          </div>
                          {/* Calendar grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem' }}>
                            {getCalendarDays(calendarMonth.year, calendarMonth.month).map((day, idx) => {
                              if (day === null) return <div key={`e-${idx}`} />;
                              const pct = getEmployeeDayCompletion(emp.user_id, calendarMonth.year, calendarMonth.month, day);
                              const bg = getCompletionColor(pct);
                              const today = new Date();
                              const isToday = day === today.getDate() && calendarMonth.month === today.getMonth() && calendarMonth.year === today.getFullYear();
                              return (
                                <div key={day}
                                  onClick={() => {
                                    const ds = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    setProgressDate(ds);
                                  }}
                                  style={{
                                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer',
                                    background: pct >= 0 ? `${bg}20` : '#141414',
                                    border: isToday ? '1px solid #3B82F6' : '1px solid transparent',
                                    color: pct >= 0 ? bg : '#3D3D3D',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                  title={pct >= 0 ? `${pct}% complete` : 'No data'}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                          {/* Legend */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                            {[{ label: '0%', color: '#2D2D2D' }, { label: '25%', color: '#EF4444' }, { label: '50%', color: '#F59E0B' }, { label: '75%', color: '#34D399' }, { label: '100%', color: '#10B981' }].map(l => (
                              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: `${l.color}30`, border: `1px solid ${l.color}50` }} />
                                <span style={{ color: '#52525B', fontSize: '0.5625rem' }}>{l.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{ padding: '0 1.25rem 1rem', borderTop: showCalendar ? 'none' : '1px solid #2D2D2D' }}>
                          {catBreakdown.length === 0 ? (
                            <p style={{ color: '#52525B', fontSize: '0.8125rem', padding: '0.75rem 0', textAlign: 'center' }}>No checklist items</p>
                          ) : catBreakdown.map(({ cat, items, completed: cc, total: ct }) => (
                            <div key={cat ? cat.id : 'uncat'} style={{ marginTop: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: cat?.color || '#52525B' }} />
                                <span style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600 }}>{cat?.name || 'Uncategorized'}</span>
                                <div style={{ flex: 1, height: '3px', background: '#2D2D2D', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${ct > 0 ? (cc / ct) * 100 : 0}%`, height: '100%', background: cat?.color || '#52525B', borderRadius: '2px' }} />
                                </div>
                                <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{cc}/{ct}</span>
                              </div>
                              {items.map(item => {
                                const today = new Date();
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                const isDone = progressDate === todayStr ? item.is_completed : isItemCompletedForDate(item, progressDate);
                                return (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}>
                                    {isDone ? <CheckCircleSolidIcon style={{ width: '15px', height: '15px', color: '#10B981', flexShrink: 0 }} /> : <CheckCircleIcon style={{ width: '15px', height: '15px', color: '#3D3D3D', flexShrink: 0 }} />}
                                    <span style={{ color: isDone ? '#52525B' : '#FFFFFF', fontSize: '0.75rem', textDecoration: isDone ? 'line-through' : 'none', flex: 1 }}>{item.title}</span>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1875rem', padding: '0.0625rem 0.375rem', borderRadius: '1rem', background: `${TYPE_COLORS[item.type]}10`, flexShrink: 0 }}>
                                      <span style={{ color: TYPE_COLORS[item.type], fontSize: '0.5625rem', fontWeight: 600 }}>{item.type}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── CHECKLISTS VIEW ───────────────────────────── */}
        {viewMode === 'checklists' && !loading && (<>

        {/* === FOLDER GRID (no folder open) === */}
        {openCatId === null && (
          categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A' }}>
              <FolderIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No categories yet</p>
              <p style={{ fontSize: '0.875rem' }}>Create a category to start organizing checklists for your team.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {categoryStats.map(({ cat, total, completed, staffCount }) => {
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={cat.id}
                    onClick={() => { setOpenCatId(cat.id); setFilterDept('all'); setFilterType('all'); setCollapsedStaff(new Set()); }}
                    style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Color accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: cat.color }} />
                    {/* Folder icon + actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderIcon style={{ width: '22px', height: '22px', color: cat.color }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.125rem' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatDesc(cat.description); setCatColor(cat.color); setShowCatModal(true); }}
                          style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#3D3D3D', cursor: 'pointer', lineHeight: 0, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')} onMouseLeave={(e) => (e.currentTarget.style.color = '#3D3D3D')}>
                          <PencilIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button onClick={() => { setDeletingCat(cat); setShowDeleteCat(true); }}
                          style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#3D3D3D', cursor: 'pointer', lineHeight: 0, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#3D3D3D')}>
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                    {/* Name + description */}
                    <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{cat.name}</div>
                    {cat.description && <div style={{ color: '#52525B', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{cat.description}</div>}
                    {/* Stats row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#71717A', fontSize: '0.6875rem' }}>{total} task{total !== 1 ? 's' : ''}</span>
                      <span style={{ color: '#3D3D3D' }}>|</span>
                      <span style={{ color: '#71717A', fontSize: '0.6875rem' }}>{staffCount} staff</span>
                      <span style={{ color: '#3D3D3D' }}>|</span>
                      <span style={{ color: pct === 100 ? '#10B981' : '#71717A', fontSize: '0.6875rem', fontWeight: 600 }}>{pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '4px', background: '#2D2D2D', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* === FOLDER DETAIL (folder open) === */}
        {openCatId !== null && openCat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Back + folder header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setOpenCatId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = openCat.color; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                <ChevronLeftIcon style={{ width: '14px', height: '14px' }} /> Back
              </button>
              <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: openCat.color }} />
              <FolderIcon style={{ width: '22px', height: '22px', color: openCat.color }} />
              <div style={{ flex: 1 }}>
                <span style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700 }}>{openCat.name}</span>
                {openCat.description && <span style={{ color: '#52525B', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{openCat.description}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '80px', height: '5px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${openCatTotalAll > 0 ? (openCatCompletedAll / openCatTotalAll) * 100 : 0}%`, height: '100%', background: openCat.color, borderRadius: '3px' }} />
                </div>
                <span style={{ color: '#71717A', fontSize: '0.75rem', fontWeight: 600 }}>{openCatCompletedAll}/{openCatTotalAll}</span>
              </div>
            </div>

            {/* Filters inside folder */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ padding: '0.5rem 0.75rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.5rem', padding: '0.1875rem', border: '1px solid #2D2D2D' }}>
                {['all', 'daily', 'weekly', 'monthly'].map((t) => (
                  <button key={t} onClick={() => setFilterType(t)}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: 'none', background: filterType === t ? (t === 'all' ? '#3B82F6' : TYPE_COLORS[t]) : 'transparent', color: filterType === t ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff list inside folder */}
            {openCatStaffGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', background: '#1A1A1A', borderRadius: '0.75rem', border: '1px solid #2D2D2D' }}>
                <ClipboardDocumentListIcon style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>No checklist items in this category yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {openCatStaffGroups.map(({ staff: s, schedules }) => {
                  const staffKey = `${openCatId}-${s.department_id}-${s.user_id}`;
                  const staffCollapsed = collapsedStaff.has(staffKey);
                  const staffItems = schedules.flatMap((g) => g.items);
                  const sc = staffItems.filter((i) => i.is_completed).length;
                  const st = staffItems.length;
                  return (
                    <div key={staffKey} style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', overflow: 'hidden' }}>
                      {/* Staff header */}
                      <div onClick={() => toggleStaff(staffKey)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${openCat.color}, ${openCat.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                          {s.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600 }}>{s.user_name}</span>
                            <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{s.department_name}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <div style={{ width: '50px', height: '4px', background: '#2D2D2D', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${st > 0 ? (sc / st) * 100 : 0}%`, height: '100%', background: '#10B981', borderRadius: '2px' }} />
                          </div>
                          <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{sc}/{st}</span>
                          <ChevronDownIcon style={{ width: '14px', height: '14px', color: '#3D3D3D', transition: 'transform 0.2s', transform: staffCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
                        </div>
                      </div>

                      {/* Schedules + items */}
                      {!staffCollapsed && (
                        <div style={{ padding: '0 1rem 0.75rem' }}>
                          {schedules.map((sched) => {
                            const addKey = `${openCatId}-${s.user_id}-${sched.key}`;
                            return (
                              <div key={sched.key} style={{ marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.1875rem 0.5rem', borderRadius: '1rem', background: `${TYPE_COLORS[sched.type]}12`, border: `1px solid ${TYPE_COLORS[sched.type]}25` }}>
                                  <ArrowPathIcon style={{ width: '11px', height: '11px', color: TYPE_COLORS[sched.type] }} />
                                  <span style={{ color: TYPE_COLORS[sched.type], fontSize: '0.625rem', fontWeight: 600 }}>{formatSchedule(sched.type, sched.resetTime, sched.dayOfWeek, sched.dayOfMonth)}</span>
                                </div>
                                <span style={{ color: '#52525B', fontSize: '0.625rem' }}>{sched.items.length} items</span>
                                <button onClick={() => openAssignModal(sched.items[0])}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.1875rem 0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '1rem', color: '#71717A', fontSize: '0.625rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#71717A'; }}>
                                  <UserPlusIcon style={{ width: '10px', height: '10px' }} /> Assign to Staff
                                </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem' }}>
                                  {sched.items.map((item) => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', transition: 'background 0.1s' }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#141414')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                      <button onClick={() => handleToggle(item)} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, lineHeight: 0 }}>
                                        {item.is_completed ? <CheckCircleSolidIcon style={{ width: '18px', height: '18px', color: '#10B981' }} /> : <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#3D3D3D' }} />}
                                      </button>
                                      {editingId === item.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(item.id); if (e.key === 'Escape') setEditingId(null); }} autoFocus
                                            style={{ flex: 1, padding: '0.25rem 0.5rem', background: '#0D0D0D', border: '1px solid #3B82F6', borderRadius: '0.25rem', color: '#FFFFFF', fontSize: '0.8125rem', outline: 'none' }} />
                                          <button onClick={() => handleEdit(item.id)} style={{ padding: '0.125rem', background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', lineHeight: 0 }}><CheckIcon style={{ width: '13px', height: '13px' }} /></button>
                                        </div>
                                      ) : (
                                        <span style={{ flex: 1, color: item.is_completed ? '#52525B' : '#FFFFFF', fontSize: '0.8125rem', textDecoration: item.is_completed ? 'line-through' : 'none' }}>{item.title}</span>
                                      )}
                                      {editingId !== item.id && (
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                          <button onClick={() => openEditModal(item)} style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.25rem', color: '#71717A', cursor: 'pointer', lineHeight: 0, fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Edit & Assign"
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#71717A'; }}>
                                            <PencilIcon style={{ width: '11px', height: '11px' }} /> Edit
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} style={{ padding: '0.25rem', background: 'none', border: '1px solid transparent', borderRadius: '0.25rem', color: '#3D3D3D', cursor: 'pointer', lineHeight: 0 }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF444440'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#3D3D3D'; e.currentTarget.style.borderColor = 'transparent'; }}>
                                            <TrashIcon style={{ width: '11px', height: '11px' }} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {/* Inline add */}
                                  {inlineAddKey === addKey ? (
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.125rem', paddingLeft: '0.5rem' }}>
                                      <input value={inlineAddTitle} onChange={(e) => setInlineAddTitle(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleInlineAdd(s.user_id, s.department_id, sched.items[0]); if (e.key === 'Escape') { setInlineAddKey(null); setInlineAddTitle(''); } }}
                                        autoFocus placeholder="New item..."
                                        style={{ flex: 1, padding: '0.3125rem 0.5rem', background: '#0D0D0D', border: '1px solid #3D3D3D', borderRadius: '0.25rem', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none' }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
                                      <button onClick={() => handleInlineAdd(s.user_id, s.department_id, sched.items[0])} disabled={!inlineAddTitle.trim()}
                                        style={{ padding: '0.3125rem 0.5rem', background: inlineAddTitle.trim() ? '#10B981' : '#3D3D3D', border: 'none', borderRadius: '0.25rem', color: '#FFF', fontSize: '0.6875rem', cursor: inlineAddTitle.trim() ? 'pointer' : 'not-allowed' }}>Add</button>
                                      <button onClick={() => { setInlineAddKey(null); setInlineAddTitle(''); }}
                                        style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', lineHeight: 0 }}><XMarkIcon style={{ width: '13px', height: '13px' }} /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setInlineAddKey(addKey); setInlineAddTitle(''); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'none', border: 'none', color: '#3D3D3D', fontSize: '0.6875rem', cursor: 'pointer', transition: 'color 0.15s', marginTop: '0.125rem' }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = '#71717A')} onMouseLeave={(e) => (e.currentTarget.style.color = '#3D3D3D')}>
                                      <PlusIcon style={{ width: '11px', height: '11px' }} /> Add item
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </>)}

        {/* ─── Category Modal ────────────────────────────── */}
        {showCatModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowCatModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{editingCat ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setShowCatModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Name</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Morning Routine, Sales Tasks..."
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Description</label>
                <input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Optional description"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  <SwatchIcon style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} /> Color
                </label>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {CATEGORY_COLORS.map((c) => (
                    <button key={c} onClick={() => setCatColor(c)}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: catColor === c ? '2px solid #FFFFFF' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCatModal(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveCat} disabled={!catName.trim() || saving}
                  style={{ padding: '0.625rem 1.25rem', background: catName.trim() ? '#10B981' : '#3D3D3D', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: catName.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingCat ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Confirm */}
        {showDeleteCat && deletingCat && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowDeleteCat(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '400px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Delete Category</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Delete <strong style={{ color: '#FFFFFF' }}>{deletingCat.name}</strong>? Checklists in this category will become uncategorized (not deleted).
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteCat(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeleteCat} disabled={saving} style={{ padding: '0.625rem 1.25rem', background: '#EF4444', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Create Checklist Modal ────────────────────── */}
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowCreate(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '480px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>New Checklist</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>

              {/* Category */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  <FolderIcon style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} /> Category
                </label>
                <select value={createCat} onChange={(e) => setCreateCat(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Department */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Department</label>
                <select value={createDept} onChange={(e) => { setCreateDept(e.target.value ? Number(e.target.value) : ''); setCreateStaffIds(new Set()); }}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Staff - multi select */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <UserIcon style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} /> Assign To {createStaffIds.size > 0 && <span style={{ color: '#3B82F6' }}>({createStaffIds.size})</span>}
                  </label>
                  {uniqueStaffForDept.length > 1 && (
                    <button onClick={() => setCreateStaffIds(createStaffIds.size === uniqueStaffForDept.length ? new Set() : new Set(uniqueStaffForDept.map(s => s.user_id)))}
                      style={{ padding: '0.1875rem 0.5rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.25rem', color: '#71717A', fontSize: '0.6875rem', cursor: 'pointer' }}>
                      {createStaffIds.size === uniqueStaffForDept.length ? 'Clear' : 'Select All'}
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', opacity: !createDept ? 0.5 : 1 }}>
                  {!createDept ? (
                    <div style={{ padding: '0.75rem', color: '#52525B', fontSize: '0.8125rem', textAlign: 'center' }}>Select department first</div>
                  ) : uniqueStaffForDept.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: '#52525B', fontSize: '0.8125rem', textAlign: 'center' }}>No staff in this department</div>
                  ) : uniqueStaffForDept.map(s => {
                    const checked = createStaffIds.has(s.user_id);
                    return (
                      <div key={s.user_id} onClick={() => setCreateStaffIds(prev => { const n = new Set(prev); if (n.has(s.user_id)) n.delete(s.user_id); else n.add(s.user_id); return n; })}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', transition: 'background 0.1s', background: checked ? 'rgba(59,130,246,0.08)' : 'transparent' }}
                        onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = '#1A1A1A'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = checked ? 'rgba(59,130,246,0.08)' : 'transparent'; }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '0.25rem', border: checked ? '2px solid #3B82F6' : '2px solid #3D3D3D', background: checked ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <CheckIcon style={{ width: '10px', height: '10px', color: '#FFF' }} />}
                        </div>
                        <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', flex: 1 }}>{s.user_name}</span>
                        <span style={{ color: '#52525B', fontSize: '0.625rem' }}>{s.role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  <CalendarDaysIcon style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} /> Frequency
                </label>
                <div style={{ display: 'flex', gap: '0.25rem', background: '#141414', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #3D3D3D' }}>
                  {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                    <button key={t} onClick={() => setCreateType(t)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: createType === t ? TYPE_COLORS[t] : 'transparent', color: createType === t ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Time */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  <ClockIcon style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} /> Reset Time
                </label>
                <input type="time" value={createTime} onChange={(e) => setCreateTime(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Day of Week */}
              {createType === 'weekly' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Reset Day</label>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <button key={idx} onClick={() => setCreateDayOfWeek(idx)}
                        style={{ padding: '0.4375rem 0.625rem', borderRadius: '0.375rem', border: createDayOfWeek === idx ? `1px solid ${TYPE_COLORS.weekly}` : '1px solid #3D3D3D', background: createDayOfWeek === idx ? `${TYPE_COLORS.weekly}20` : '#141414', color: createDayOfWeek === idx ? TYPE_COLORS.weekly : '#71717A', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        {SHORT_DAYS[idx]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month */}
              {createType === 'monthly' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Reset Day of Month</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <button key={d} onClick={() => setCreateDayOfMonth(d)}
                        style={{ padding: '0.375rem', borderRadius: '0.375rem', border: createDayOfMonth === d ? `1px solid ${TYPE_COLORS.monthly}` : '1px solid #2D2D2D', background: createDayOfMonth === d ? `${TYPE_COLORS.monthly}20` : '#141414', color: createDayOfMonth === d ? TYPE_COLORS.monthly : '#71717A', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: '1px', background: '#2D2D2D', margin: '1rem 0' }} />

              {/* Title */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Checklist Item</label>
                <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="e.g. Check attendance report..."
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreate(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreate} disabled={!createTitle.trim() || createStaffIds.size === 0 || !createDept || !createCat || saving}
                  style={{ padding: '0.625rem 1.25rem', background: (createTitle.trim() && createStaffIds.size > 0 && createDept && createCat) ? '#10B981' : '#3D3D3D', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: (createTitle.trim() && createStaffIds.size > 0 && createDept && createCat) ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ─── Edit & Assign Modal ──────────────────────── */}
        {showEditModal && editItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowEditModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '500px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Edit Checklist</h3>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>

              {/* Frequency */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Frequency</label>
                <div style={{ display: 'flex', gap: '0.25rem', background: '#141414', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #3D3D3D' }}>
                  {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                    <button key={t} onClick={() => setEditType(t)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: editType === t ? TYPE_COLORS[t] : 'transparent', color: editType === t ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Time */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Reset Time</label>
                <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {editType === 'weekly' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Reset Day</label>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <button key={idx} onClick={() => setEditDayOfWeek(idx)}
                        style={{ padding: '0.4375rem 0.625rem', borderRadius: '0.375rem', border: editDayOfWeek === idx ? `1px solid ${TYPE_COLORS.weekly}` : '1px solid #3D3D3D', background: editDayOfWeek === idx ? `${TYPE_COLORS.weekly}20` : '#141414', color: editDayOfWeek === idx ? TYPE_COLORS.weekly : '#71717A', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        {SHORT_DAYS[idx]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editType === 'monthly' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Day of Month</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <button key={d} onClick={() => setEditDayOfMonth(d)}
                        style={{ padding: '0.375rem', borderRadius: '0.375rem', border: editDayOfMonth === d ? `1px solid ${TYPE_COLORS.monthly}` : '1px solid #2D2D2D', background: editDayOfMonth === d ? `${TYPE_COLORS.monthly}20` : '#141414', color: editDayOfMonth === d ? TYPE_COLORS.monthly : '#71717A', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: '1px', background: '#2D2D2D', margin: '1rem 0' }} />

              {/* Assigned Staff */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600 }}>Assigned To ({editAssignIds.size})</label>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <select value={editDeptFilter} onChange={(e) => setEditDeptFilter(e.target.value ? Number(e.target.value) : '')}
                      style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.6875rem', outline: 'none' }}>
                      <option value="">All Depts</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button onClick={() => {
                      const deptStaff = editDeptFilter ? staff.filter(s => s.department_id === Number(editDeptFilter)) : staff;
                      setEditAssignIds(new Set(deptStaff.filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i).map(s => s.user_id)));
                    }} style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.375rem', color: '#71717A', fontSize: '0.6875rem', cursor: 'pointer' }}>All</button>
                    <button onClick={() => setEditAssignIds(new Set())}
                      style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.375rem', color: '#71717A', fontSize: '0.6875rem', cursor: 'pointer' }}>None</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {(() => {
                    const deptStaff = editDeptFilter ? staff.filter(s => s.department_id === Number(editDeptFilter)) : staff;
                    return deptStaff.filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i).map(s => {
                      const checked = editAssignIds.has(s.user_id);
                      return (
                        <div key={s.user_id}
                          onClick={() => setEditAssignIds(prev => { const n = new Set(prev); if (n.has(s.user_id)) n.delete(s.user_id); else n.add(s.user_id); return n; })}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.08)' : 'transparent', border: checked ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = checked ? 'rgba(59,130,246,0.12)' : '#141414'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = checked ? 'rgba(59,130,246,0.08)' : 'transparent'; }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '0.25rem', border: checked ? '2px solid #3B82F6' : '2px solid #3D3D3D', background: checked ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {checked && <CheckIcon style={{ width: '10px', height: '10px', color: '#FFF' }} />}
                          </div>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>
                            {s.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', flex: 1 }}>{s.user_name}</span>
                          <span style={{ color: '#52525B', fontSize: '0.625rem' }}>{s.department_name}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEditModal(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEditSave} disabled={!editTitle.trim() || editAssignIds.size === 0 || saving}
                  style={{ padding: '0.625rem 1.25rem', background: (editTitle.trim() && editAssignIds.size > 0) ? '#3B82F6' : '#3D3D3D', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: (editTitle.trim() && editAssignIds.size > 0) ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Assign Modal ──────────────────────────────── */}
        {showAssign && assignItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAssign(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '460px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Assign to Staff</h3>
                  <p style={{ color: '#52525B', fontSize: '0.75rem', marginTop: '0.25rem' }}>{assignItem.title}</p>
                </div>
                <button onClick={() => setShowAssign(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>

              {/* Department filter */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Department</label>
                <select value={assignDept} onChange={(e) => setAssignDept(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button onClick={() => {
                  const deptStaff = assignDept ? staff.filter(s => s.department_id === Number(assignDept)) : staff;
                  const unique = deptStaff.filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i);
                  setAssignStaffIds(new Set(unique.map(s => s.user_id)));
                }} style={{ padding: '0.375rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.375rem', color: '#A1A1AA', fontSize: '0.75rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                  Select All
                </button>
                <button onClick={() => setAssignStaffIds(new Set())}
                  style={{ padding: '0.375rem 0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.375rem', color: '#A1A1AA', fontSize: '0.75rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                  Clear All
                </button>
              </div>

              {/* Staff list with checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.25rem' }}>
                {(() => {
                  const deptStaff = assignDept ? staff.filter(s => s.department_id === Number(assignDept)) : staff;
                  const unique = deptStaff.filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i);
                  const alreadyHas = new Set(
                    checklists.filter(c => c.title === assignItem.title && c.category_id === assignItem.category_id && c.type === assignItem.type && c.reset_time === assignItem.reset_time).map(c => c.user_id)
                  );
                  return unique.map(s => {
                    const isChecked = assignStaffIds.has(s.user_id);
                    const alreadyAssigned = alreadyHas.has(s.user_id);
                    return (
                      <div key={s.user_id}
                        onClick={() => {
                          if (alreadyAssigned) return;
                          setAssignStaffIds(prev => { const n = new Set(prev); if (n.has(s.user_id)) n.delete(s.user_id); else n.add(s.user_id); return n; });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', cursor: alreadyAssigned ? 'default' : 'pointer', transition: 'background 0.15s', background: isChecked ? 'rgba(139,92,246,0.08)' : 'transparent', border: isChecked ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent', opacity: alreadyAssigned ? 0.5 : 1 }}
                        onMouseEnter={(e) => { if (!alreadyAssigned) e.currentTarget.style.background = isChecked ? 'rgba(139,92,246,0.12)' : '#141414'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? 'rgba(139,92,246,0.08)' : 'transparent'; }}
                      >
                        <div style={{ width: '18px', height: '18px', borderRadius: '0.25rem', border: isChecked ? '2px solid #8B5CF6' : '2px solid #3D3D3D', background: isChecked ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isChecked && <CheckIcon style={{ width: '12px', height: '12px', color: '#FFFFFF' }} />}
                        </div>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                          {s.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600 }}>{s.user_name}</div>
                          <div style={{ color: '#52525B', fontSize: '0.6875rem' }}>{s.department_name} · {s.role}</div>
                        </div>
                        {alreadyAssigned && <span style={{ color: '#52525B', fontSize: '0.625rem', fontStyle: 'italic' }}>already assigned</span>}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAssign(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAssign} disabled={saving}
                  style={{ padding: '0.625rem 1.25rem', background: '#8B5CF6', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Assigning...' : `Assign (${[...assignStaffIds].filter(uid => !checklists.some(c => c.title === assignItem.title && c.category_id === assignItem.category_id && c.type === assignItem.type && c.reset_time === assignItem.reset_time && c.user_id === uid)).length} new)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
