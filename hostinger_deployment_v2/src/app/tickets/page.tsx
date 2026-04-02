'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon,
  ExclamationTriangleIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface TicketSystem { id: number; name: string; slug: string; prefix: string; colour: string; }
interface Ticket {
  id: number; ticket_number: string; system_id: number; title: string;
  type: string; priority: string; status: string; reporter_id: number;
  assignee_id: number | null; created_at: string;
  reporter_name?: string; assignee_name?: string; system_name?: string; system_colour?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: '#1E3A5F', text: '#93C5FD', label: 'Open' },
  in_progress: { bg: '#422006', text: '#FCD34D', label: 'In Progress' },
  in_review: { bg: '#2E1065', text: '#C4B5FD', label: 'In Review' },
  testing: { bg: '#042F2E', text: '#5EEAD4', label: 'Testing' },
  done: { bg: '#052E16', text: '#86EFAC', label: 'Done' },
  closed: { bg: '#1C1C1C', text: '#A1A1AA', label: 'Closed' },
  on_hold: { bg: '#1C1C1C', text: '#A1A1AA', label: 'On Hold' },
  wont_fix: { bg: '#1C1C1C', text: '#A1A1AA', label: "Won't Fix" },
};

const PRIORITY_CONFIG: Record<string, { colour: string; bg: string }> = {
  critical: { colour: '#FCA5A5', bg: '#450A0A' },
  high: { colour: '#FDBA74', bg: '#431407' },
  medium: { colour: '#FDE047', bg: '#422006' },
  low: { colour: '#A1A1AA', bg: '#1C1C1C' },
};

const TYPE_LABELS: Record<string, string> = { bug: 'Bug', feature_request: 'Feature', improvement: 'Improvement', task: 'Task', support: 'Support' };

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function TicketsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [systems, setSystems] = useState<TicketSystem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSystems, setUserSystems] = useState<number[]>([]);

  const [filterSystem, setFilterSystem] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: sys } = await supabase.from('ticket_systems').select('*').order('id');
      setSystems((sys || []) as TicketSystem[]);
      let accessIds: number[] = [];
      if (isAdmin) { accessIds = (sys || []).map((s: any) => s.id); }
      else { const { data: access } = await supabase.from('ticket_user_system_access').select('system_id').eq('user_id', user.id); accessIds = (access || []).map((a: any) => a.system_id); }
      setUserSystems(accessIds);
      if (accessIds.length === 0) { setTickets([]); setLoading(false); return; }
      const { data: tix } = await supabase.from('tickets').select('*').in('system_id', accessIds).order('created_at', { ascending: false });
      const allUserIds = [...new Set((tix || []).flatMap((t: any) => [t.reporter_id, t.assignee_id].filter(Boolean)))];
      let usersMap: Record<number, string> = {};
      if (allUserIds.length > 0) { const { data: users } = await supabase.from('auth_user').select('id, name').in('id', allUserIds); (users || []).forEach((u: any) => { usersMap[u.id] = u.name; }); }
      const sysMap: Record<number, TicketSystem> = {}; (sys || []).forEach((s: any) => { sysMap[s.id] = s; });
      setTickets((tix || []).map((t: any) => ({ ...t, reporter_name: usersMap[t.reporter_id] || 'Unknown', assignee_name: t.assignee_id ? usersMap[t.assignee_id] : null, system_name: sysMap[t.system_id]?.name || '', system_colour: sysMap[t.system_id]?.colour || '#6B7280' })));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);

  const filtered = tickets.filter(t => {
    if (filterSystem !== 'all' && t.system_id !== filterSystem) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (search) { const q = search.toLowerCase(); if (!t.ticket_number.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q)) return false; }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = filterSystem !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || search;

  const openCount = tickets.filter(t => t.status === 'open').length;
  const progressCount = tickets.filter(t => t.status === 'in_progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && !['done', 'closed', 'wont_fix'].includes(t.status)).length;
  const doneCount = tickets.filter(t => ['done', 'closed'].includes(t.status)).length;

  if (authLoading || !user) {
    return <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525B' }}>Loading...</div>;
  }

  const selectStyle: React.CSSProperties = { height: '32px', padding: '0 0.5rem', background: '#111113', border: '1px solid #27272A', borderRadius: '6px', color: '#D4D4D8', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' as any, appearance: 'none' as any, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2352525B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '24px' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '1.25rem 1.75rem', overflowY: 'auto' }}>

        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ color: '#FAFAFA', fontSize: '1.25rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Tickets</h1>
            <p style={{ color: '#52525B', fontSize: '0.6875rem', marginTop: '0.125rem' }}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} {hasFilters ? '(filtered)' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {isAdmin && (
              <Link href="/tickets/admin" style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 0.625rem', background: '#111113', border: '1px solid #27272A', borderRadius: '6px', color: '#71717A', fontSize: '0.75rem', textDecoration: 'none', gap: '0.25rem' }}>
                <Cog6ToothIcon style={{ width: '13px', height: '13px' }} /> Admin
              </Link>
            )}
            <button onClick={fetchData} style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111113', border: '1px solid #27272A', borderRadius: '6px', color: '#71717A', cursor: 'pointer' }}>
              <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
            </button>
            <Link href="/tickets/new" style={{ height: '32px', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.75rem', background: '#FAFAFA', color: '#09090B', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
              <PlusIcon style={{ width: '13px', height: '13px' }} /> New Ticket
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { label: 'Open', value: openCount, accent: '#3B82F6', glow: 'rgba(59,130,246,0.08)' },
            { label: 'In Progress', value: progressCount, accent: '#EAB308', glow: 'rgba(234,179,8,0.08)' },
            { label: 'Critical', value: criticalCount, accent: '#EF4444', glow: 'rgba(239,68,68,0.08)' },
            { label: 'Resolved', value: doneCount, accent: '#10B981', glow: 'rgba(16,185,129,0.08)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '0.75rem 0.875rem', background: s.glow, border: '1px solid #1A1A1E', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: s.accent, borderRadius: '0 2px 2px 0' }} />
              <div style={{ color: '#FAFAFA', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#71717A', fontSize: '0.625rem', fontWeight: 500, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#3F3F46' }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search tickets..."
              style={{ width: '100%', height: '32px', padding: '0 0.5rem 0 1.75rem', background: '#111113', border: '1px solid #27272A', borderRadius: '6px', color: '#D4D4D8', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3F3F46')} onBlur={(e) => (e.currentTarget.style.borderColor = '#27272A')} />
          </div>
          <select value={filterSystem} onChange={(e) => { setFilterSystem(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }} style={selectStyle}>
            <option value="all">All Systems</option>
            {systems.filter(s => userSystems.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="all">All Priority</option>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          {hasFilters && (
            <button onClick={() => { setFilterSystem('all'); setFilterStatus('all'); setFilterPriority('all'); setSearch(''); setPage(1); }}
              style={{ height: '32px', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.5rem', background: 'none', border: '1px solid #27272A', borderRadius: '6px', color: '#52525B', fontSize: '0.6875rem', cursor: 'pointer' }}>
              <XMarkIcon style={{ width: '11px', height: '11px' }} /> Clear
            </button>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ color: '#3F3F46', fontSize: '0.625rem' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#3F3F46' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#111113', borderRadius: '8px', border: '1px solid #1A1A1E' }}>
            <ExclamationTriangleIcon style={{ width: '28px', height: '28px', color: '#27272A', margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0 0 0.25rem' }}>No tickets found</p>
            <p style={{ color: '#3F3F46', fontSize: '0.75rem', margin: 0 }}>{hasFilters ? 'Adjust your filters' : 'Create your first ticket'}</p>
          </div>
        ) : (
          <div style={{ background: '#111113', border: '1px solid #1A1A1E', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px 70px 90px 90px 50px', gap: '0.5rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid #1A1A1E' }}>
              {['Ticket', 'Title', 'Type', 'Priority', 'Status', 'Assignee', ''].map(h => (
                <span key={h} style={{ color: '#3F3F46', fontSize: '0.5625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {paginated.map((t, i) => {
              const ss = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
              const pp = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
              return (
                <Link key={t.id} href={`/tickets/${t.id}`}
                  style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px 70px 90px 90px 50px', gap: '0.5rem', padding: '0.625rem 0.875rem', borderBottom: i < paginated.length - 1 ? '1px solid #141416' : 'none', textDecoration: 'none', transition: 'background 0.1s', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#151517')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

                  {/* Ticket # + System */}
                  <div>
                    <div style={{ color: '#D4D4D8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{t.ticket_number}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.0625rem' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.system_colour }} />
                      <span style={{ color: '#3F3F46', fontSize: '0.5625rem' }}>{t.system_name}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <span style={{ color: '#E4E4E7', fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>

                  {/* Type */}
                  <span style={{ color: '#71717A', fontSize: '0.6875rem' }}>{TYPE_LABELS[t.type] || t.type}</span>

                  {/* Priority */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: pp.bg, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pp.colour }} />
                    <span style={{ color: pp.colour, fontSize: '0.625rem', fontWeight: 500, textTransform: 'capitalize' }}>{t.priority}</span>
                  </span>

                  {/* Status */}
                  <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '4px', background: ss.bg, color: ss.text, fontSize: '0.625rem', fontWeight: 600, width: 'fit-content', letterSpacing: '0.01em' }}>{ss.label}</span>

                  {/* Assignee */}
                  <span style={{ color: t.assignee_name ? '#71717A' : '#27272A', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.assignee_name || 'Unassigned'}
                  </span>

                  {/* Time */}
                  <span style={{ color: '#27272A', fontSize: '0.625rem', textAlign: 'right' }}>{timeAgo(t.created_at)}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ color: '#3F3F46', fontSize: '0.625rem' }}>Page {page}/{totalPages}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ height: '28px', padding: '0 0.625rem', background: '#111113', border: '1px solid #1A1A1E', borderRadius: '4px', color: page === 1 ? '#1A1A1E' : '#71717A', fontSize: '0.6875rem', cursor: page === 1 ? 'default' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ height: '28px', padding: '0 0.625rem', background: '#111113', border: '1px solid #1A1A1E', borderRadius: '4px', color: page === totalPages ? '#1A1A1E' : '#71717A', fontSize: '0.6875rem', cursor: page === totalPages ? 'default' : 'pointer' }}>Next</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
