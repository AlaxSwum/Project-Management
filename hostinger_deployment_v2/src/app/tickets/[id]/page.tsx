'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { ChevronRightIcon, PaperClipIcon, ClockIcon } from '@heroicons/react/24/outline';

/* ── Constants ──────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Open' },
  in_progress: { bg: 'rgba(245,158,11,0.1)', text: '#D97706', label: 'In Progress' },
  in_review: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', label: 'In Review' },
  testing: { bg: 'rgba(20,184,166,0.1)', text: '#14B8A6', label: 'Testing' },
  done: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', label: 'Done' },
  closed: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280', label: 'Closed' },
  on_hold: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280', label: 'On Hold' },
  wont_fix: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280', label: "Won't Fix" },
};

const PRIORITY_COLOURS: Record<string, string> = { critical: '#DC2626', high: '#EA580C', medium: '#CA8A04', low: '#6B7280' };
const TYPE_LABELS: Record<string, string> = { bug: 'Bug', feature_request: 'Feature Request', improvement: 'Improvement', task: 'Task', support: 'Support' };
const RESOLUTION_LABELS: Record<string, string> = { fixed: 'Fixed', wont_fix: "Won't Fix", duplicate: 'Duplicate', cannot_reproduce: 'Cannot Reproduce', by_design: 'By Design', workaround: 'Workaround' };

const STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'on_hold', 'wont_fix', 'closed'],
  in_progress: ['in_review', 'on_hold', 'open'],
  in_review: ['testing', 'in_progress'],
  testing: ['done', 'in_progress'],
  on_hold: ['open', 'in_progress'],
  done: ['closed', 'in_progress'],
  closed: ['open'],
  wont_fix: [],
};

function formatDateTimeUK(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Component ──────────────────────────── */

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params?.id);
  const { user, isLoading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  const fetchData = useCallback(async () => {
    if (!user || !ticketId) return;
    setLoading(true);
    try {
      const { data: t } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
      if (!t) { router.push('/tickets'); return; }

      const { data: sys } = await supabase.from('ticket_systems').select('*').eq('id', t.system_id).single();

      // Get names
      const ids = [t.reporter_id, t.assignee_id].filter(Boolean);
      let names: Record<number, string> = {};
      if (ids.length) {
        const { data: users } = await supabase.from('auth_user').select('id, name').in('id', ids);
        (users || []).forEach((u: any) => { names[u.id] = u.name; });
      }

      setTicket({ ...t, reporter_name: names[t.reporter_id] || 'Unknown', assignee_name: t.assignee_id ? names[t.assignee_id] : null });
      setSystem(sys);

      // Comments
      const { data: coms } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
      const comUserIds = [...new Set((coms || []).map((c: any) => c.author_id))];
      if (comUserIds.length) {
        const { data: cu } = await supabase.from('auth_user').select('id, name').in('id', comUserIds);
        const cuMap: Record<number, string> = {};
        (cu || []).forEach((u: any) => { cuMap[u.id] = u.name; });
        setComments((coms || []).map((c: any) => ({ ...c, author_name: cuMap[c.author_id] || 'Unknown' })));
      } else {
        setComments([]);
      }

      // Activity
      const { data: acts } = await supabase.from('ticket_activity_log').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false });
      const actUserIds = [...new Set((acts || []).map((a: any) => a.actor_id))];
      if (actUserIds.length) {
        const { data: au } = await supabase.from('auth_user').select('id, name').in('id', actUserIds);
        const auMap: Record<number, string> = {};
        (au || []).forEach((u: any) => { auMap[u.id] = u.name; });
        setActivity((acts || []).map((a: any) => ({ ...a, actor_name: auMap[a.actor_id] || 'Unknown' })));
      } else {
        setActivity([]);
      }

      // All staff (for admin assignee dropdown)
      if (isAdmin) {
        const { data: staff } = await supabase.from('auth_user').select('id, name').eq('is_active', true).order('name');
        setAllStaff(staff || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user, ticketId, isAdmin, router]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);

  /* ── Handlers ─────────────────────────── */

  const updateField = async (field: string, value: any) => {
    if (!isAdmin || !ticket) return;
    const old = ticket[field];
    setTicket((t: any) => ({ ...t, [field]: value }));
    try {
      await supabase.from('tickets').update({ [field]: value }).eq('id', ticket.id);
      fetchData(); // refresh activity
    } catch { setTicket((t: any) => ({ ...t, [field]: old })); }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user || !ticket) return;
    setSaving(true);
    try {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticket.id, author_id: user.id, content: newComment.trim(), is_internal: isInternal,
      });
      await supabase.from('ticket_activity_log').insert({
        ticket_id: ticket.id, actor_id: user.id, action: 'comment_added', new_value: isInternal ? 'Internal note' : 'Comment',
      });
      setNewComment(''); setIsInternal(false);
      fetchData();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  /* ── Render ───────────────────────────── */

  if (authLoading || !user || loading) {
    return <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading...</div>;
  }

  if (!ticket) return null;

  const ss = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
  const validTransitions = STATUS_TRANSITIONS[ticket.status] || [];

  const sidebarField = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid #1F1F1F' }}>
      <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href="/tickets" style={{ color: '#71717A', textDecoration: 'none' }}>Tickets</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{ticket.ticket_number}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <span style={{ color: '#6B7280', fontSize: '0.9375rem', fontWeight: 600 }}>{ticket.ticket_number}</span>
              {system && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: `${system.colour}15`, fontSize: '0.6875rem', fontWeight: 500 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: system.colour }} />
                  <span style={{ color: system.colour }}>{system.name}</span>
                </span>
              )}
              <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: ss.bg, color: ss.text, fontSize: '0.6875rem', fontWeight: 500 }}>{ss.label}</span>
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.375rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{ticket.title}</h1>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT: Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Description */}
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1.25rem' }}>
              <h3 style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Description</h3>
              <p style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{ticket.description}</p>
            </div>

            {/* Steps / Expected / Actual */}
            {ticket.steps_to_reproduce && (
              <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1.25rem' }}>
                <h3 style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Steps to Reproduce</h3>
                <p style={{ color: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{ticket.steps_to_reproduce}</p>
              </div>
            )}

            {(ticket.expected_behaviour || ticket.actual_behaviour) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {ticket.expected_behaviour && (
                  <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1rem' }}>
                    <h3 style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Expected Behaviour</h3>
                    <p style={{ color: '#FFFFFF', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{ticket.expected_behaviour}</p>
                  </div>
                )}
                {ticket.actual_behaviour && (
                  <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1rem' }}>
                    <h3 style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Actual Behaviour</h3>
                    <p style={{ color: '#FFFFFF', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{ticket.actual_behaviour}</p>
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Comments ({comments.filter(c => isAdmin || !c.is_internal).length})</h3>

              {comments.filter(c => isAdmin || !c.is_internal).map(c => (
                <div key={c.id} style={{ background: c.is_internal ? '#1A1A0F' : '#1A1A1A', border: `1px solid ${c.is_internal ? '#CA8A0420' : '#2D2D2D'}`, borderLeft: c.is_internal ? '3px solid #CA8A04' : '1px solid #2D2D2D', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600 }}>{c.author_name}</span>
                      {c.is_internal && <span style={{ color: '#CA8A04', fontSize: '0.625rem', fontWeight: 600, padding: '0.0625rem 0.375rem', background: 'rgba(202,138,4,0.1)', borderRadius: '0.25rem' }}>Internal</span>}
                    </div>
                    <span style={{ color: '#6B7280', fontSize: '0.6875rem' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ color: '#D1D5DB', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{c.content}</p>
                </div>
              ))}

              {/* Add comment */}
              <div style={{ marginTop: '0.75rem' }}>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'Mabry Pro, sans-serif' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2D2D2D')} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  {isAdmin && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}
                        style={{ accentColor: '#CA8A04' }} />
                      <span style={{ color: '#CA8A04', fontSize: '0.75rem' }}>Internal note (admin only)</span>
                    </label>
                  )}
                  {!isAdmin && <span />}
                  <button onClick={addComment} disabled={!newComment.trim() || saving}
                    style={{ padding: '0.5rem 1rem', background: newComment.trim() ? '#1F2937' : '#141414', color: newComment.trim() ? '#FFFFFF' : '#52525B', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}>
                    {saving ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '2rem' }}>

            {/* Details */}
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Details</h3>

              {/* Status (admin can change) */}
              {sidebarField('Status', isAdmin ? (
                <select value={ticket.status} onChange={(e) => updateField('status', e.target.value)}
                  style={{ padding: '0.25rem 0.5rem', background: ss.bg, border: 'none', borderRadius: '0.25rem', color: ss.text, fontSize: '0.75rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}>
                  <option value={ticket.status}>{ss.label}</option>
                  {validTransitions.map(s => <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>)}
                </select>
              ) : <span style={{ padding: '0.125rem 0.5rem', background: ss.bg, color: ss.text, borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>{ss.label}</span>)}

              {/* Priority */}
              {sidebarField('Priority', isAdmin ? (
                <select value={ticket.priority} onChange={(e) => updateField('priority', e.target.value)}
                  style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.25rem', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                  {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLOURS[ticket.priority] }} />
                  <span style={{ textTransform: 'capitalize' }}>{ticket.priority}</span>
                </span>
              ))}

              {sidebarField('Type', TYPE_LABELS[ticket.type] || ticket.type)}

              {/* Assignee */}
              {sidebarField('Assignee', isAdmin ? (
                <select value={ticket.assignee_id || ''} onChange={(e) => updateField('assignee_id', e.target.value ? Number(e.target.value) : null)}
                  style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.25rem', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Unassigned</option>
                  {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : <span style={{ color: ticket.assignee_name ? '#FFFFFF' : '#6B7280', fontStyle: ticket.assignee_name ? 'normal' : 'italic' }}>{ticket.assignee_name || 'Unassigned'}</span>)}

              {sidebarField('Reporter', ticket.reporter_name)}
              {ticket.environment && sidebarField('Environment', <span style={{ textTransform: 'capitalize' }}>{ticket.environment}</span>)}
              {ticket.browser_device && sidebarField('Browser', ticket.browser_device)}

              {/* Resolution (when done/closed) */}
              {(ticket.status === 'done' || ticket.status === 'closed') && sidebarField('Resolution', isAdmin ? (
                <select value={ticket.resolution || ''} onChange={(e) => updateField('resolution', e.target.value || null)}
                  style={{ padding: '0.25rem 0.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.25rem', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {Object.entries(RESOLUTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              ) : <span>{RESOLUTION_LABELS[ticket.resolution] || 'Not set'}</span>)}

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1F1F1F' }}>
                <div style={{ color: '#6B7280', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Created: {formatDateTimeUK(ticket.created_at)}</div>
                <div style={{ color: '#6B7280', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Updated: {formatDateTimeUK(ticket.updated_at)}</div>
                {ticket.closed_at && <div style={{ color: '#6B7280', fontSize: '0.6875rem' }}>Closed: {formatDateTimeUK(ticket.closed_at)}</div>}
              </div>
            </div>

            {/* Activity Log */}
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.625rem', padding: '1rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Activity</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activity.length === 0 ? (
                  <p style={{ color: '#52525B', fontSize: '0.75rem' }}>No activity yet</p>
                ) : activity.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid #1F1F1F' }}>
                    <ClockIcon style={{ width: '12px', height: '12px', color: '#52525B', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ color: '#A1A1AA', fontSize: '0.6875rem' }}>
                        <span style={{ fontWeight: 500 }}>{a.actor_name}</span>
                        {a.action === 'status_changed' && <> changed status: {a.old_value} → {a.new_value}</>}
                        {a.action === 'priority_changed' && <> changed priority: {a.old_value} → {a.new_value}</>}
                        {a.action === 'assigned' && <> assigned to {a.new_value || 'nobody'}</>}
                        {a.action === 'comment_added' && <> added a {a.new_value?.toLowerCase() || 'comment'}</>}
                        {a.action === 'created' && <> created this ticket</>}
                      </div>
                      <div style={{ color: '#52525B', fontSize: '0.5625rem' }}>{formatDateTimeUK(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
