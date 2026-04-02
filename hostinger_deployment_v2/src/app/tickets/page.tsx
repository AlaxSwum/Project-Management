'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon,
  ExclamationTriangleIcon, Cog6ToothIcon, TrashIcon,
  BugAntIcon, LightBulbIcon, WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon, ChatBubbleLeftEllipsisIcon,
  FunnelIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface TicketSystem { id: number; name: string; slug: string; prefix: string; colour: string; }
interface Ticket {
  id: number; ticket_number: string; system_id: number; title: string;
  type: string; priority: string; status: string; reporter_id: number;
  assignee_id: number | null; created_at: string;
  reporter_name?: string; assignee_name?: string; system_name?: string; system_colour?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  open:        { bg: 'rgba(59,130,246,0.10)', text: '#60A5FA', label: 'Open', dot: '#3B82F6' },
  in_progress: { bg: 'rgba(234,179,8,0.10)',  text: '#FBBF24', label: 'In Progress', dot: '#EAB308' },
  in_review:   { bg: 'rgba(167,139,250,0.10)', text: '#A78BFA', label: 'In Review', dot: '#8B5CF6' },
  testing:     { bg: 'rgba(45,212,191,0.10)', text: '#2DD4BF', label: 'Testing', dot: '#14B8A6' },
  done:        { bg: 'rgba(34,197,94,0.10)',  text: '#4ADE80', label: 'Done', dot: '#22C55E' },
  closed:      { bg: 'rgba(113,113,122,0.08)', text: '#71717A', label: 'Closed', dot: '#52525B' },
  on_hold:     { bg: 'rgba(113,113,122,0.08)', text: '#71717A', label: 'On Hold', dot: '#52525B' },
  wont_fix:    { bg: 'rgba(113,113,122,0.08)', text: '#71717A', label: "Won't Fix", dot: '#52525B' },
};

const PRIORITY_CONFIG: Record<string, { colour: string; icon: string }> = {
  critical: { colour: '#EF4444', icon: '!!!' },
  high:     { colour: '#F97316', icon: '!!' },
  medium:   { colour: '#EAB308', icon: '!' },
  low:      { colour: '#52525B', icon: '—' },
};

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  bug: BugAntIcon,
  feature_request: LightBulbIcon,
  improvement: WrenchScrewdriverIcon,
  task: ClipboardDocumentCheckIcon,
  support: ChatBubbleLeftEllipsisIcon,
};

const TYPE_LABELS: Record<string, string> = { bug: 'Bug', feature_request: 'Feature', improvement: 'Improvement', task: 'Task', support: 'Support' };

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
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
  const [showFilters, setShowFilters] = useState(false);
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
  const activeFilterCount = [filterSystem !== 'all', filterStatus !== 'all', filterPriority !== 'all'].filter(Boolean).length;

  const openCount = tickets.filter(t => t.status === 'open').length;
  const progressCount = tickets.filter(t => t.status === 'in_progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && !['done', 'closed', 'wont_fix'].includes(t.status)).length;
  const doneCount = tickets.filter(t => ['done', 'closed'].includes(t.status)).length;

  if (authLoading || !user) {
    return (
      <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #27272A', borderTopColor: '#FAFAFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#52525B', fontSize: '0.8125rem' }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '0', overflowY: 'auto', height: '100vh' }}>

        {/* Header Section */}
        <div style={{ padding: '1.5rem 2rem 0', borderBottom: '1px solid #18181B' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ color: '#FAFAFA', fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.2 }}>Tickets</h1>
              <p style={{ color: '#52525B', fontSize: '0.8125rem', marginTop: '0.25rem', fontWeight: 400 }}>
                Track and manage issues across your systems
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isAdmin && (
                <Link href="/tickets/admin" style={{ height: '36px', display: 'flex', alignItems: 'center', padding: '0 0.875rem', background: 'transparent', border: '1px solid #27272A', borderRadius: '8px', color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', gap: '0.375rem', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3F3F46'; e.currentTarget.style.color = '#D4D4D8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#A1A1AA'; }}>
                  <Cog6ToothIcon style={{ width: '15px', height: '15px' }} /> Settings
                </Link>
              )}
              <Link href="/tickets/new" style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 1rem', background: '#FAFAFA', color: '#09090B', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E4E4E7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FAFAFA')}>
                <PlusIcon style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} /> New Ticket
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Open', value: openCount, colour: '#3B82F6', emoji: '○' },
              { label: 'In Progress', value: progressCount, colour: '#EAB308', emoji: '◐' },
              { label: 'Critical', value: criticalCount, colour: '#EF4444', emoji: '◉' },
              { label: 'Resolved', value: doneCount, colour: '#22C55E', emoji: '●' },
            ].map(s => (
              <div key={s.label} style={{ padding: '1rem', background: '#0F0F11', borderRadius: '10px', border: '1px solid #1C1C20', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.background = '#111114'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1C1C20'; e.currentTarget.style.background = '#0F0F11'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#52525B', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                  <span style={{ color: s.colour, fontSize: '0.875rem', opacity: 0.6 }}>{s.emoji}</span>
                </div>
                <div style={{ color: '#FAFAFA', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.875rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#3F3F46' }} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by ticket ID or title..."
                style={{ width: '100%', height: '36px', padding: '0 0.75rem 0 2.25rem', background: '#0F0F11', border: '1px solid #1C1C20', borderRadius: '8px', color: '#D4D4D8', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#3F3F46')} onBlur={(e) => (e.currentTarget.style.borderColor = '#1C1C20')} />
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.75rem', background: showFilters ? '#18181B' : 'transparent', border: `1px solid ${showFilters ? '#27272A' : '#1C1C20'}`, borderRadius: '8px', color: showFilters ? '#D4D4D8' : '#71717A', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
              <FunnelIcon style={{ width: '14px', height: '14px' }} /> Filters
              {activeFilterCount > 0 && (
                <span style={{ background: '#3B82F6', color: '#fff', fontSize: '0.625rem', fontWeight: 700, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
              )}
            </button>

            <button onClick={fetchData} title="Refresh"
              style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid #1C1C20', borderRadius: '8px', color: '#52525B', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#A1A1AA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1C1C20'; e.currentTarget.style.color = '#52525B'; }}>
              <ArrowPathIcon style={{ width: '15px', height: '15px' }} />
            </button>

            <div style={{ flex: 1 }} />
            <span style={{ color: '#3F3F46', fontSize: '0.75rem' }}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div style={{ padding: '0.75rem 2rem', background: '#0C0C0E', borderBottom: '1px solid #18181B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#52525B', fontSize: '0.75rem', fontWeight: 500, minWidth: 'fit-content' }}>Filter by:</span>

            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
              {/* System pills */}
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button onClick={() => { setFilterSystem('all'); setPage(1); }}
                  style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: filterSystem === 'all' ? '#27272A' : 'transparent',
                    color: filterSystem === 'all' ? '#D4D4D8' : '#52525B',
                  }}>All Systems</button>
                {systems.filter(s => userSystems.includes(s.id)).map(s => (
                  <button key={s.id} onClick={() => { setFilterSystem(s.id); setPage(1); }}
                    style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: filterSystem === s.id ? '#27272A' : 'transparent',
                      color: filterSystem === s.id ? '#D4D4D8' : '#52525B',
                    }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.colour, flexShrink: 0 }} />
                    {s.name}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '20px', background: '#1C1C20', flexShrink: 0 }} />

              {/* Status pills */}
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button onClick={() => { setFilterStatus('all'); setPage(1); }}
                  style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: filterStatus === 'all' ? '#27272A' : 'transparent',
                    color: filterStatus === 'all' ? '#D4D4D8' : '#52525B',
                  }}>All Status</button>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => { setFilterStatus(k); setPage(1); }}
                    style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: filterStatus === k ? '#27272A' : 'transparent',
                      color: filterStatus === k ? '#D4D4D8' : '#52525B',
                    }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.dot, flexShrink: 0 }} />
                    {v.label}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '20px', background: '#1C1C20', flexShrink: 0 }} />

              {/* Priority pills */}
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button onClick={() => { setFilterPriority('all'); setPage(1); }}
                  style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: filterPriority === 'all' ? '#27272A' : 'transparent',
                    color: filterPriority === 'all' ? '#D4D4D8' : '#52525B',
                  }}>All Priority</button>
                {['critical', 'high', 'medium', 'low'].map(p => (
                  <button key={p} onClick={() => { setFilterPriority(p); setPage(1); }}
                    style={{ height: '28px', padding: '0 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', textTransform: 'capitalize',
                      background: filterPriority === p ? '#27272A' : 'transparent',
                      color: filterPriority === p ? '#D4D4D8' : '#52525B',
                    }}>
                    <span style={{ color: PRIORITY_CONFIG[p]?.colour, fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'monospace' }}>{PRIORITY_CONFIG[p]?.icon}</span>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button onClick={() => { setFilterSystem('all'); setFilterStatus('all'); setFilterPriority('all'); setSearch(''); setPage(1); }}
                style={{ height: '28px', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.5rem', background: 'none', border: 'none', color: '#52525B', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#A1A1AA')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#52525B')}>
                <XMarkIcon style={{ width: '12px', height: '12px' }} /> Clear all
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div style={{ padding: '0 2rem 2rem' }}>

          {/* Ticket List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '0.75rem' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid #1C1C20', borderTopColor: '#52525B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#3F3F46', fontSize: '0.8125rem' }}>Loading tickets...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#111114', border: '1px solid #1C1C20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ExclamationTriangleIcon style={{ width: '22px', height: '22px', color: '#27272A' }} />
              </div>
              <p style={{ color: '#A1A1AA', fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem' }}>No tickets found</p>
              <p style={{ color: '#52525B', fontSize: '0.8125rem', margin: '0 0 1.25rem' }}>{hasFilters ? 'Try adjusting your filters' : 'Create your first ticket to get started'}</p>
              {!hasFilters && (
                <Link href="/tickets/new" style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 1rem', background: '#FAFAFA', color: '#09090B', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                  <PlusIcon style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} /> New Ticket
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 90px 110px 110px 70px 36px', gap: '0.5rem', padding: '0.625rem 1rem', marginTop: '0.25rem' }}>
                {['Ticket', 'Title', 'Type', 'Priority', 'Status', 'Assignee', 'Created', ''].map(h => (
                  <span key={h} style={{ color: '#3F3F46', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div style={{ borderRadius: '10px', border: '1px solid #1C1C20', overflow: 'hidden', background: '#0F0F11' }}>
                {paginated.map((t, i) => {
                  const ss = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                  const pp = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  const TypeIcon = TYPE_ICONS[t.type] || ClipboardDocumentCheckIcon;
                  return (
                    <Link key={t.id} href={`/tickets/${t.id}`}
                      style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 90px 110px 110px 70px 36px', gap: '0.5rem', padding: '0.75rem 1rem', borderBottom: i < paginated.length - 1 ? '1px solid #151518' : 'none', textDecoration: 'none', transition: 'background 0.12s', alignItems: 'center' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#131316')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

                      {/* Ticket # + System dot */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                        <span style={{ color: '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', letterSpacing: '-0.01em' }}>{t.ticket_number}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.system_colour, flexShrink: 0 }} />
                          <span style={{ color: '#3F3F46', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.system_name}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <span style={{ color: '#E4E4E7', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{t.title}</span>

                      {/* Type */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <TypeIcon style={{ width: '14px', height: '14px', color: '#52525B', flexShrink: 0 }} />
                        <span style={{ color: '#71717A', fontSize: '0.8125rem' }}>{TYPE_LABELS[t.type] || t.type}</span>
                      </div>

                      {/* Priority */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ color: pp.colour, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, width: '18px' }}>{pp.icon}</span>
                        <span style={{ color: pp.colour, fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize' }}>{t.priority}</span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: ss.bg, width: 'fit-content' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
                          <span style={{ color: ss.text, fontSize: '0.75rem', fontWeight: 500 }}>{ss.label}</span>
                        </span>
                      </div>

                      {/* Assignee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {t.assignee_name ? (
                          <>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1C1C20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.625rem', color: '#71717A', fontWeight: 600 }}>{t.assignee_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span style={{ color: '#A1A1AA', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.assignee_name}</span>
                          </>
                        ) : (
                          <span style={{ color: '#27272A', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </div>

                      {/* Time */}
                      <span style={{ color: '#3F3F46', fontSize: '0.75rem', textAlign: 'right' }}>{timeAgo(t.created_at)}</span>

                      {/* Delete */}
                      {isAdmin ? (
                        <button onClick={async (e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (!confirm(`Delete ${t.ticket_number}?`)) return;
                          try {
                            await supabase.from('ticket_activity_log').delete().eq('ticket_id', t.id);
                            await supabase.from('ticket_comments').delete().eq('ticket_id', t.id);
                            await supabase.from('ticket_attachments').delete().eq('ticket_id', t.id);
                            await supabase.from('ticket_notifications').delete().eq('ticket_id', t.id);
                            await supabase.from('tickets').delete().eq('id', t.id);
                            fetchData();
                          } catch (err) { console.error(err); }
                        }}
                          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#27272A', cursor: 'pointer', transition: 'all .15s', padding: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#27272A'; e.currentTarget.style.background = 'transparent'; }}>
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      ) : <span />}
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0 0.25rem' }}>
                  <span style={{ color: '#3F3F46', fontSize: '0.8125rem' }}>
                    Showing <span style={{ color: '#71717A' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> of <span style={{ color: '#71717A' }}>{filtered.length}</span>
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === 1 ? 'transparent' : '#111114', border: '1px solid #1C1C20', borderRadius: '6px', color: page === 1 ? '#1C1C20' : '#71717A', cursor: page === 1 ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                      <ChevronLeftIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#27272A', fontSize: '0.75rem', padding: '0 0.25rem' }}>...</span>}
                          <button onClick={() => setPage(p)}
                            style={{ height: '32px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.375rem', background: p === page ? '#27272A' : 'transparent', border: `1px solid ${p === page ? '#3F3F46' : '#1C1C20'}`, borderRadius: '6px', color: p === page ? '#FAFAFA' : '#52525B', fontSize: '0.8125rem', fontWeight: p === page ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === totalPages ? 'transparent' : '#111114', border: '1px solid #1C1C20', borderRadius: '6px', color: page === totalPages ? '#1C1C20' : '#71717A', cursor: page === totalPages ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                      <ChevronRightIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
