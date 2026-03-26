'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon,
  ClipboardDocumentListIcon, ArrowPathIcon, FolderIcon,
  PaperClipIcon, PhotoIcon, TrashIcon, CheckIcon,
  EyeIcon, ArrowDownTrayIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

/* --- Types --- */

interface Category { id: number; name: string; color: string; description: string; }

interface ChecklistItem {
  id: number; department_id: number; user_id: number; category_id: number | null;
  type: string; title: string; is_completed: boolean; completed_at: string | null;
  reset_time: string; reset_day_of_week: number | null; reset_day_of_month: number | null;
  created_at: string;
}

interface Attachment {
  id: number; checklist_id: number; file_name: string; file_url: string;
  file_type: string; file_size: number; created_at: string;
}

/* --- Schedule Helpers --- */

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPE_COLORS: Record<string, string> = { daily: '#3B82F6', weekly: '#8B5CF6', monthly: '#F59E0B' };
const TYPE_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

function getLastResetTime(type: string, resetTime: string, dayOfWeek: number | null, dayOfMonth: number | null): Date {
  const now = new Date();
  const [h, m] = (resetTime || '00:00').split(':').map(Number);
  if (type === 'daily') {
    const r = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    return now >= r ? r : new Date(r.getTime() - 86400000);
  }
  if (type === 'weekly') {
    const target = dayOfWeek ?? 1;
    const r = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let daysBack = (now.getDay() - target + 7) % 7;
    if (daysBack === 0 && now < r) daysBack = 7;
    return new Date(r.getTime() - daysBack * 86400000);
  }
  if (type === 'monthly') {
    const target = dayOfMonth ?? 1;
    const c = new Date(now.getFullYear(), now.getMonth(), target, h, m, 0, 0);
    if (now < c) c.setMonth(c.getMonth() - 1);
    return c;
  }
  return new Date(0);
}

function shouldReset(item: ChecklistItem): boolean {
  if (!item.is_completed || !item.completed_at) return false;
  return new Date(item.completed_at) < getLastResetTime(item.type, item.reset_time, item.reset_day_of_week, item.reset_day_of_month);
}

function formatSchedule(type: string, resetTime: string, dayOfWeek: number | null, dayOfMonth: number | null): string {
  const [h, mm] = (resetTime || '00:00').split(':').map(Number);
  const t = `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  if (type === 'daily') return `Resets daily at ${t}`;
  if (type === 'weekly') return `Resets every ${SHORT_DAYS[dayOfWeek ?? 1]} at ${t}`;
  if (type === 'monthly') { const d = dayOfMonth ?? 1; const s = ['th','st','nd','rd']; const v = d % 100; return `Resets on the ${d}${s[(v-20)%10]||s[v]||s[0]} at ${t}`; }
  return type;
}

function scheduleKey(item: ChecklistItem): string {
  return `${item.type}-${item.reset_time || '00:00'}-${item.reset_day_of_week ?? ''}-${item.reset_day_of_month ?? ''}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const isImage = (type: string) => type?.startsWith('image/');
const isPdf = (type: string) => type === 'application/pdf' || type?.endsWith('.pdf');

/* --- Component --- */

export default function MyChecklistsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation
  const [openCatId, setOpenCatId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Upload state
  const [uploading, setUploading] = useState<number | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);

  // Expanded item (to show attachments)
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  // File preview modal
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  /* --- Data Fetching --- */

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: memberships } = await supabase
        .from('org_department_members').select('department_id').eq('user_id', user.id);
      const deptIds = (memberships || []).map((m: any) => m.department_id);
      if (deptIds.length === 0) { setChecklists([]); setCategories([]); setLoading(false); return; }

      const { data: depts } = await supabase
        .from('org_departments').select('id, company_id').in('id', deptIds);
      const companyIds = [...new Set((depts || []).map((d: any) => d.company_id))];

      const [checkRes, catsRes] = await Promise.all([
        supabase.from('org_checklists').select('*').eq('user_id', user.id).in('department_id', deptIds).order('created_at', { ascending: true }),
        supabase.from('org_checklist_categories').select('*').in('company_id', companyIds).order('created_at', { ascending: true }),
      ]);

      const items: ChecklistItem[] = (checkRes.data || []).map((c: any) => ({
        ...c, reset_time: c.reset_time || '00:00',
        reset_day_of_week: c.reset_day_of_week ?? null, reset_day_of_month: c.reset_day_of_month ?? null,
        category_id: c.category_id ?? null,
      }));

      // Auto-reset expired items
      const idsToReset = items.filter(shouldReset).map(i => i.id);
      if (idsToReset.length > 0) {
        await supabase.from('org_checklists').update({ is_completed: false, completed_at: null }).in('id', idsToReset);
        items.forEach(i => { if (idsToReset.includes(i.id)) { i.is_completed = false; i.completed_at = null; } });
      }

      setChecklists(items);
      setCategories((catsRes.data || []) as Category[]);

      const checkIds = items.map(i => i.id);
      if (checkIds.length > 0) {
        const { data: atts } = await supabase.from('org_checklist_attachments').select('*').in('checklist_id', checkIds).order('created_at', { ascending: true });
        setAttachments((atts || []) as Attachment[]);
      }
    } catch (err) { console.error('Error fetching checklists:', err); }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);
  useEffect(() => { fetch('/api/checklist-upload').then(r => r.json()).then(d => setDriveConnected(d.connected)).catch(() => {}); }, []);

  /* --- Handlers --- */

  const handleToggle = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    setChecklists(prev => prev.map(c => c.id === item.id ? { ...c, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : c));
    try { await supabase.from('org_checklists').update({ is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }).eq('id', item.id); }
    catch { setChecklists(prev => prev.map(c => c.id === item.id ? item : c)); }
  };

  const handleUpload = async (checklistId: number, files: FileList) => {
    if (!user || files.length === 0) return;
    setUploading(checklistId);
    try {
      const item = checklists.find(c => c.id === checklistId);
      const cat = item?.category_id ? categories.find(c => c.id === item.category_id) : null;

      for (const file of Array.from(files)) {
        let fileUrl = '';
        let uploaded = false;

        // Try Google Drive first
        if (driveConnected) {
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
            });
            const driveRes = await fetch('/api/checklist-upload', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: file.name, fileData: base64, mimeType: file.type, categoryName: cat?.name || 'General', checklistTitle: item?.title || 'Untitled', employeeName: user.name || user.email || 'Unknown' }),
            });
            if (driveRes.ok) { const d = await driveRes.json(); fileUrl = d.webViewLink || `https://drive.google.com/file/d/${d.id}/view`; uploaded = true; }
          } catch { /* fall through */ }
        }

        // Fallback: Supabase storage
        if (!uploaded) {
          try {
            const ext = file.name.split('.').pop() || '';
            const path = `${checklistId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: e } = await supabase.storage.from('checklist-attachments').upload(path, file);
            if (!e) { const { data: u } = supabase.storage.from('checklist-attachments').getPublicUrl(path); fileUrl = u.publicUrl; uploaded = true; }
          } catch { /* fall through */ }
        }

        // Last resort: data URL (always works, stored in DB)
        if (!uploaded) {
          fileUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const { data: att, error: insertErr } = await supabase.from('org_checklist_attachments').insert({
          checklist_id: checklistId, file_name: file.name, file_url: fileUrl,
          file_type: file.type, file_size: file.size, uploaded_by: user.id,
        }).select().single();
        if (!insertErr && att) setAttachments(prev => [...prev, att as Attachment]);
      }
    } catch (err) { console.error(err); }
    setUploading(null);
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    if (!window.confirm(`Delete "${att.file_name}"?`)) return;
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    try {
      const driveMatch = att.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch?.[1]) await fetch('/api/checklist-upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driveFileId: driveMatch[1] }) }).catch(() => {});
      const supaParts = att.file_url.split('/checklist-attachments/');
      if (supaParts[1]) await supabase.storage.from('checklist-attachments').remove([decodeURIComponent(supaParts[1])]).catch(() => {});
      await supabase.from('org_checklist_attachments').delete().eq('id', att.id);
    } catch (err) { console.error(err); }
  };

  /* --- Computed --- */

  const categoryStats = categories.map(cat => {
    const catItems = checklists.filter(c => c.category_id === cat.id);
    const completed = catItems.filter(c => c.is_completed).length;
    const types = [...new Set(catItems.map(c => c.type))];
    return { cat, total: catItems.length, completed, types };
  }).filter(s => s.total > 0);

  const openCat = openCatId !== null ? categories.find(c => c.id === openCatId) || null : null;
  const openItems = openCatId !== null
    ? checklists.filter(c => c.category_id === openCatId && (filterType === 'all' || c.type === filterType))
    : [];

  type ScheduleGroup = { key: string; type: string; resetTime: string; dayOfWeek: number | null; dayOfMonth: number | null; items: ChecklistItem[] };
  const scheduleGroups: ScheduleGroup[] = [];
  const schedMap = new Map<string, ScheduleGroup>();
  for (const item of openItems) {
    const k = scheduleKey(item);
    if (!schedMap.has(k)) schedMap.set(k, { key: k, type: item.type, resetTime: item.reset_time, dayOfWeek: item.reset_day_of_week, dayOfMonth: item.reset_day_of_month, items: [] });
    schedMap.get(k)!.items.push(item);
  }
  schedMap.forEach(v => scheduleGroups.push(v));

  const totalAll = checklists.length;
  const completedAll = checklists.filter(c => c.is_completed).length;
  const openTotal = openCatId !== null ? checklists.filter(c => c.category_id === openCatId).length : 0;
  const openCompleted = openCatId !== null ? checklists.filter(c => c.category_id === openCatId && c.is_completed).length : 0;
  const pctAll = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  /* --- Render --- */

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>My Checklists</h1>
          <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>Your assigned tasks auto-reset based on their schedule</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#71717A' }}>
            <ArrowPathIcon style={{ width: '32px', height: '32px', margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
            <p>Loading your checklists...</p>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
          </div>
        ) : checklists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A', background: '#1A1A1A', borderRadius: '1rem', border: '1px solid #2D2D2D' }}>
            <ClipboardDocumentListIcon style={{ width: '56px', height: '56px', margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#FFFFFF', fontWeight: 600 }}>No checklists assigned yet</p>
            <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>Your manager will assign checklists to you from the company page. Check back soon.</p>
          </div>
        ) : openCatId === null ? (
          <>
            {/* Overall Progress Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 500 }}>Today's Progress</span>
                  <span style={{ color: pctAll === 100 ? '#10B981' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 700 }}>{completedAll}/{totalAll} done</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#2D2D2D', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pctAll}%`, height: '100%', background: pctAll === 100 ? '#10B981' : '#3B82F6', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {pctAll === 100 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '2rem', flexShrink: 0 }}>
                  <CheckCircleSolidIcon style={{ width: '16px', height: '16px', color: '#10B981' }} />
                  <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>All Done</span>
                </div>
              )}
            </div>

            {/* Folder Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {categoryStats.map(({ cat, total, completed }) => {
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const catTypes = [...new Set(checklists.filter(c => c.category_id === cat.id).map(c => c.type))];
                return (
                  <div key={cat.id}
                    onClick={() => { setOpenCatId(cat.id); setFilterType('all'); setExpandedItem(null); }}
                    style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem 1.25rem 1rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}15`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: cat.color }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '0.75rem', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderIcon style={{ width: '22px', height: '22px', color: cat.color }} />
                      </div>
                      {pct === 100 && (
                        <CheckCircleSolidIcon style={{ width: '22px', height: '22px', color: '#10B981' }} />
                      )}
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.25rem' }}>{cat.name}</div>
                    {cat.description && <div style={{ color: '#52525B', fontSize: '0.75rem', marginBottom: '0.625rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{cat.description}</div>}

                    {/* Type badges */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {catTypes.map(t => (
                        <span key={t} style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', background: `${TYPE_COLORS[t]}12`, color: TYPE_COLORS[t], fontSize: '0.625rem', fontWeight: 600 }}>
                          {TYPE_LABELS[t] || t}
                        </span>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ flex: 1, height: '6px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10B981' : cat.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ color: pct === 100 ? '#10B981' : '#71717A', fontSize: '0.75rem', fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>{completed}/{total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : openCat && (
          /* === FOLDER DETAIL === */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Back + header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => { setOpenCatId(null); setExpandedItem(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = openCat.color; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                <ChevronLeftIcon style={{ width: '14px', height: '14px' }} /> All Checklists
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: openCat.color }} />
                <FolderIcon style={{ width: '20px', height: '20px', color: openCat.color }} />
                <span style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700 }}>{openCat.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '100px', height: '6px', background: '#2D2D2D', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${openTotal > 0 ? (openCompleted / openTotal) * 100 : 0}%`, height: '100%', background: openCompleted === openTotal ? '#10B981' : openCat.color, borderRadius: '3px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ color: openCompleted === openTotal ? '#10B981' : '#A1A1AA', fontSize: '0.8125rem', fontWeight: 700 }}>{openCompleted}/{openTotal}</span>
              </div>
            </div>

            {/* Type filter */}
            <div style={{ display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #2D2D2D', width: 'fit-content' }}>
              {['all', 'daily', 'weekly', 'monthly'].map((t) => (
                <button key={t} onClick={() => setFilterType(t)}
                  style={{ padding: '0.4375rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: filterType === t ? (t === 'all' ? '#3B82F6' : TYPE_COLORS[t]) : 'transparent', color: filterType === t ? '#FFFFFF' : '#71717A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>

            {/* Items by schedule */}
            {scheduleGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', background: '#1A1A1A', borderRadius: '0.75rem', border: '1px solid #2D2D2D' }}>
                <p style={{ fontSize: '0.875rem' }}>No items match this filter</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheduleGroups.map(sched => {
                  const groupDone = sched.items.filter(i => i.is_completed).length;
                  const groupTotal = sched.items.length;
                  return (
                    <div key={sched.key} style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', overflow: 'hidden' }}>
                      {/* Schedule header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #2D2D2D', background: '#151515' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ArrowPathIcon style={{ width: '14px', height: '14px', color: TYPE_COLORS[sched.type] }} />
                          <span style={{ color: TYPE_COLORS[sched.type], fontSize: '0.75rem', fontWeight: 600 }}>
                            {formatSchedule(sched.type, sched.resetTime, sched.dayOfWeek, sched.dayOfMonth)}
                          </span>
                        </div>
                        <span style={{ color: groupDone === groupTotal ? '#10B981' : '#52525B', fontSize: '0.75rem', fontWeight: 600 }}>
                          {groupDone}/{groupTotal}
                        </span>
                      </div>

                      {/* Items as cards */}
                      <div style={{ padding: '0.5rem' }}>
                        {sched.items.map((item) => {
                          const itemAtts = attachments.filter(a => a.checklist_id === item.id);
                          return (
                            <div key={item.id} style={{ background: item.is_completed ? '#0F1F15' : '#141414', border: item.is_completed ? '1px solid #10B98120' : '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '0.5rem', transition: 'all 0.2s' }}>
                              {/* Row: checkbox + title + upload button */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button onClick={() => handleToggle(item)} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, lineHeight: 0 }}>
                                  {item.is_completed
                                    ? <CheckCircleSolidIcon style={{ width: '24px', height: '24px', color: '#10B981' }} />
                                    : <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #3D3D3D', transition: 'border-color 0.15s' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10B981')}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
                                  }
                                </button>
                                <span style={{ flex: 1, color: item.is_completed ? '#52525B' : '#FFFFFF', fontSize: '0.9375rem', fontWeight: 500, textDecoration: item.is_completed ? 'line-through' : 'none' }}>
                                  {item.title}
                                </span>
                                {/* Always-visible upload */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#1A1A1A', border: '1px dashed #3D3D3D', borderRadius: '0.5rem', color: '#71717A', fontSize: '0.75rem', fontWeight: 500, cursor: uploading === item.id ? 'wait' : 'pointer', transition: 'all 0.15s', opacity: uploading === item.id ? 0.6 : 1, flexShrink: 0 }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = openCat!.color; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderStyle = 'solid'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#71717A'; e.currentTarget.style.borderStyle = 'dashed'; }}>
                                  {uploading === item.id ? (
                                    <><ArrowPathIcon style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Uploading...</>
                                  ) : (
                                    <><PhotoIcon style={{ width: '13px', height: '13px' }} /> Upload</>
                                  )}
                                  <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    style={{ display: 'none' }} disabled={uploading === item.id}
                                    onChange={(e) => { if (e.target.files) handleUpload(item.id, e.target.files); e.target.value = ''; }} />
                                </label>
                                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
                              </div>

                              {/* Attachments - always visible if they exist */}
                              {itemAtts.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.625rem', borderTop: '1px solid #2D2D2D20' }}>
                                  {itemAtts.map(att => (
                                    <div key={att.id} style={{ position: 'relative', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', overflow: 'hidden', transition: 'border-color 0.15s' }}
                                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2D2D2D')}>
                                      {isImage(att.file_type) ? (
                                        <button onClick={() => setPreviewFile({ url: att.file_url, name: att.file_name, type: att.file_type })}
                                          style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'block', position: 'relative' }}>
                                          <img src={att.file_url} alt={att.file_name} style={{ width: '100px', height: '72px', objectFit: 'cover', display: 'block' }} />
                                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}>
                                            <EyeIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                                          </div>
                                        </button>
                                      ) : (
                                        <button onClick={() => setPreviewFile({ url: att.file_url, name: att.file_name, type: att.file_type })}
                                          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: '0.75rem' }}>
                                          {isPdf(att.file_type)
                                            ? <DocumentTextIcon style={{ width: '16px', height: '16px', color: '#EF4444', flexShrink: 0 }} />
                                            : <PaperClipIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                                          }
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{att.file_name}</span>
                                          <EyeIcon style={{ width: '12px', height: '12px', color: '#3B82F6', flexShrink: 0 }} />
                                        </button>
                                      )}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.5rem', borderTop: '1px solid #2D2D2D' }}>
                                        <span style={{ color: '#52525B', fontSize: '0.5625rem' }}>{formatFileSize(att.file_size)}</span>
                                        <button onClick={() => handleDeleteAttachment(att)}
                                          style={{ padding: '0.125rem', background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', lineHeight: 0 }}
                                          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#52525B')}>
                                          <TrashIcon style={{ width: '11px', height: '11px' }} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
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
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #2D2D2D', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  {isImage(previewFile.type)
                    ? <PhotoIcon style={{ width: '18px', height: '18px', color: '#3B82F6', flexShrink: 0 }} />
                    : isPdf(previewFile.type)
                      ? <DocumentTextIcon style={{ width: '18px', height: '18px', color: '#EF4444', flexShrink: 0 }} />
                      : <PaperClipIcon style={{ width: '18px', height: '18px', color: '#71717A', flexShrink: 0 }} />
                  }
                  <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {previewFile.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#3B82F6', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                    <ArrowDownTrayIcon style={{ width: '14px', height: '14px' }} /> Download
                  </a>
                  <button onClick={() => setPreviewFile(null)}
                    style={{ padding: '0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', lineHeight: 0 }}>
                    <XMarkIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#0D0D0D', minHeight: '400px' }}>
                {isImage(previewFile.type) ? (
                  <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '0.5rem' }} />
                ) : isPdf(previewFile.type) ? (
                  <iframe src={previewFile.url} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.5rem' }} title={previewFile.name} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <PaperClipIcon style={{ width: '48px', height: '48px', color: '#52525B', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 500, margin: '0 0 0.5rem' }}>{previewFile.name}</p>
                    <p style={{ color: '#71717A', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Preview not available for this file type</p>
                    <a href={previewFile.url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#3B82F6', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      <ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} /> Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
