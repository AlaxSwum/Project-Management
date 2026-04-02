'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeftIcon, ClockIcon,
  BugAntIcon, LightBulbIcon, WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon, ChatBubbleLeftEllipsisIcon,
  LockClosedIcon, ChevronDownIcon, TrashIcon,
} from '@heroicons/react/24/outline';

const STATUS: Record<string, { colour: string; label: string }> = {
  open: { colour: '#3B82F6', label: 'Open' }, in_progress: { colour: '#EAB308', label: 'In Progress' },
  in_review: { colour: '#8B5CF6', label: 'In Review' }, testing: { colour: '#14B8A6', label: 'Testing' },
  done: { colour: '#22C55E', label: 'Done' }, closed: { colour: '#52525B', label: 'Closed' },
  on_hold: { colour: '#52525B', label: 'On Hold' }, wont_fix: { colour: '#52525B', label: "Won't Fix" },
};
const PRIORITY: Record<string, { colour: string; label: string }> = {
  critical: { colour: '#EF4444', label: 'Critical' }, high: { colour: '#F97316', label: 'High' },
  medium: { colour: '#EAB308', label: 'Medium' }, low: { colour: '#71717A', label: 'Low' },
};
const TYPE_ICON: Record<string, React.ComponentType<any>> = {
  bug: BugAntIcon, feature_request: LightBulbIcon, improvement: WrenchScrewdriverIcon,
  task: ClipboardDocumentCheckIcon, support: ChatBubbleLeftEllipsisIcon,
};
const TYPE_LABEL: Record<string, string> = { bug: 'Bug', feature_request: 'Feature', improvement: 'Improvement', task: 'Task', support: 'Support' };
const TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'on_hold', 'wont_fix', 'closed'], in_progress: ['in_review', 'on_hold', 'open'],
  in_review: ['testing', 'in_progress'], testing: ['done', 'in_progress'], on_hold: ['open', 'in_progress'],
  done: ['closed', 'in_progress'], closed: ['open'], wont_fix: [],
};
const RESOLUTION: Record<string, string> = { fixed: 'Fixed', wont_fix: "Won't Fix", duplicate: 'Duplicate', cannot_reproduce: 'Cannot Reproduce', by_design: 'By Design', workaround: 'Workaround' };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
    new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`; const days = Math.floor(h / 24); if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function DropMenu({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>{trigger}</div>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#1C1C20', border: '1px solid #2A2A2E', borderRadius: '10px', padding: '4px', minWidth: '155px', zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.65)' }}>{children}</div>}
    </div>
  );
}
function DropItem({ active, dot, label, onClick }: { active: boolean; dot?: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', background: active ? '#27272A' : 'transparent', border: 'none', borderRadius: '6px', color: active ? '#FAFAFA' : '#A1A1AA', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
      onMouseEnter={e => !active && (e.currentTarget.style.background = '#222226')} onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
      {dot && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0 }} />}{label}
    </button>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params?.id);
  const { user, isLoading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  const fetchData = useCallback(async () => {
    if (!user || !ticketId) return; setLoading(true);
    try {
      const { data: t } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
      if (!t) { router.push('/tickets'); return; }
      const { data: sys } = await supabase.from('ticket_systems').select('*').eq('id', t.system_id).single();
      const ids = [t.reporter_id, t.assignee_id].filter(Boolean);
      let nm: Record<number, string> = {};
      if (ids.length) { const { data: u } = await supabase.from('auth_user').select('id, name').in('id', ids); (u || []).forEach((x: any) => { nm[x.id] = x.name; }); }
      setTicket({ ...t, reporter_name: nm[t.reporter_id] || 'Unknown', assignee_name: t.assignee_id ? nm[t.assignee_id] : null }); setSystem(sys);
      const { data: coms } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
      const cIds = [...new Set((coms || []).map((c: any) => c.author_id))];
      if (cIds.length) { const { data: cu } = await supabase.from('auth_user').select('id, name').in('id', cIds); const mp: any = {}; (cu || []).forEach((x: any) => { mp[x.id] = x.name; }); setComments((coms || []).map((c: any) => ({ ...c, author_name: mp[c.author_id] || '?' }))); } else setComments([]);
      const { data: acts } = await supabase.from('ticket_activity_log').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false });
      const aIds = [...new Set((acts || []).map((a: any) => a.actor_id))];
      if (aIds.length) { const { data: au } = await supabase.from('auth_user').select('id, name').in('id', aIds); const mp: any = {}; (au || []).forEach((x: any) => { mp[x.id] = x.name; }); setActivity((acts || []).map((a: any) => ({ ...a, actor_name: mp[a.actor_id] || '?' }))); } else setActivity([]);
    } catch (e) { console.error(e); } setLoading(false);
  }, [user, ticketId, isAdmin, router]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);

  const upd = async (f: string, v: any) => {
    if (!isAdmin || !ticket) return; const old = ticket[f]; setTicket((t: any) => ({ ...t, [f]: v }));
    try { await supabase.from('tickets').update({ [f]: v }).eq('id', ticket.id); fetchData(); } catch { setTicket((t: any) => ({ ...t, [f]: old })); }
  };
  const post = async () => {
    if (!newComment.trim() || !user || !ticket) return; setSaving(true);
    try { await supabase.from('ticket_comments').insert({ ticket_id: ticket.id, author_id: user.id, content: newComment.trim(), is_internal: isInternal }); await supabase.from('ticket_activity_log').insert({ ticket_id: ticket.id, actor_id: user.id, action: 'comment_added', new_value: isInternal ? 'Internal note' : 'Comment' }); setNewComment(''); setIsInternal(false); fetchData(); } catch (e) { console.error(e); } setSaving(false);
  };

  if (authLoading || !user || loading) return (
    <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '18px', height: '18px', border: '2px solid #1C1C20', borderTopColor: '#52525B', borderRadius: '50%', animation: 'spin .5s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!ticket) return null;

  const s = STATUS[ticket.status] || STATUS.open;
  const p = PRIORITY[ticket.priority] || PRIORITY.medium;
  const TI = TYPE_ICON[ticket.type] || ClipboardDocumentCheckIcon;
  const vis = comments.filter(c => isAdmin || !c.is_internal);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', overflowY: 'auto', height: '100vh' }}>

        {/* ─── TOP NAV ─── */}
        <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #141416', position: 'sticky', top: 0, background: '#09090B', zIndex: 20 }}>
          <Link href="/tickets" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3F3F46', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')} onMouseLeave={e => (e.currentTarget.style.color = '#3F3F46')}>
            <ArrowLeftIcon style={{ width: '14px', height: '14px' }} /> Tickets
          </Link>
          {isAdmin && (TRANSITIONS[ticket.status] || []).length > 0 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {(TRANSITIONS[ticket.status] || []).slice(0, 2).map(ns => (
                <button key={ns} onClick={() => upd('status', ns)}
                  style={{ height: '30px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${STATUS[ns]?.colour}25`, background: `${STATUS[ns]?.colour}0A`, color: STATUS[ns]?.colour, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${STATUS[ns]?.colour}18`)} onMouseLeave={e => (e.currentTarget.style.background = `${STATUS[ns]?.colour}0A`)}>
                  Move to {STATUS[ns]?.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── 2 COLUMN LAYOUT ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, minHeight: 'calc(100vh - 48px)' }}>

          {/* ═══════ LEFT ═══════ */}
          <div style={{ padding: '28px 32px 80px', borderRight: '1px solid #141416' }}>

            {/* Ticket ID + Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '13px', color: '#3F3F46', fontWeight: 600 }}>{ticket.ticket_number}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '99px', background: `${s.colour}15`, fontSize: '11px', fontWeight: 700, color: s.colour, letterSpacing: '0.3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.colour }} />{s.label}
              </span>
              {system && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '99px', background: `${system.colour}12`, fontSize: '11px', fontWeight: 600, color: system.colour }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: system.colour }} />{system.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ color: '#FAFAFA', fontSize: '24px', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35, letterSpacing: '-0.4px' }}>{ticket.title}</h1>
            <p style={{ fontSize: '13px', color: '#3F3F46', margin: '0 0 28px' }}>
              Opened by <span style={{ color: '#71717A', fontWeight: 500 }}>{ticket.reporter_name}</span> · {ago(ticket.created_at)}
            </p>

            {/* ── Description Card ── */}
            <div style={{ background: '#0E0E11', borderRadius: '12px', border: '1px solid #1A1A1E', padding: '20px 24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#3F3F46', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Description</div>
              <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#D4D4D8', whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
            </div>

            {/* Bug details cards */}
            {ticket.steps_to_reproduce && (
              <div style={{ background: '#0E0E11', borderRadius: '12px', border: '1px solid #1A1A1E', padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#3F3F46', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Steps to Reproduce</div>
                <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#A1A1AA', whiteSpace: 'pre-wrap' }}>{ticket.steps_to_reproduce}</div>
              </div>
            )}
            {(ticket.expected_behaviour || ticket.actual_behaviour) && (
              <div style={{ display: 'grid', gridTemplateColumns: ticket.expected_behaviour && ticket.actual_behaviour ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
                {ticket.expected_behaviour && (
                  <div style={{ borderRadius: '12px', border: '1px solid rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.03)', padding: '16px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Expected</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.65, color: '#A1A1AA', whiteSpace: 'pre-wrap' }}>{ticket.expected_behaviour}</div>
                  </div>
                )}
                {ticket.actual_behaviour && (
                  <div style={{ borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)', padding: '16px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Actual</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.65, color: '#A1A1AA', whiteSpace: 'pre-wrap' }}>{ticket.actual_behaviour}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Comments ── */}
            <div style={{ marginTop: '32px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FAFAFA', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Comments
                {vis.length > 0 && <span style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', background: '#141416', padding: '2px 8px', borderRadius: '99px' }}>{vis.length}</span>}
              </div>

              {vis.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.is_internal ? 'rgba(234,179,8,0.1)' : '#151518', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #1A1A1E' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: c.is_internal ? '#FBBF24' : '#52525B' }}>{c.author_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, background: c.is_internal ? 'rgba(234,179,8,0.03)' : '#0E0E11', border: `1px solid ${c.is_internal ? 'rgba(234,179,8,0.12)' : '#1A1A1E'}`, borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#E4E4E7' }}>{c.author_name}</span>
                      {c.is_internal && <span style={{ fontSize: '9px', fontWeight: 800, color: '#EAB308', background: 'rgba(234,179,8,0.1)', padding: '2px 6px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '3px', letterSpacing: '0.3px' }}><LockClosedIcon style={{ width: '8px', height: '8px' }} />INTERNAL</span>}
                      <span style={{ fontSize: '12px', color: '#27272A' }}>{ago(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#A1A1AA', whiteSpace: 'pre-wrap' }}>{c.content}</div>
                  </div>
                </div>
              ))}

              {/* Write comment */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#151518', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #1A1A1E' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#52525B' }}>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, borderRadius: '12px', border: `1px solid ${focused ? '#27272A' : '#1A1A1E'}`, background: '#0E0E11', overflow: 'hidden', transition: 'border-color .2s' }}>
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder="Write a comment..." rows={3}
                    style={{ width: '100%', padding: '14px 18px', background: 'transparent', border: 'none', color: '#D4D4D8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #141416', background: '#0C0C0E' }}>
                    {isAdmin ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#EAB308', width: '13px', height: '13px' }} />
                        <LockClosedIcon style={{ width: '11px', height: '11px', color: isInternal ? '#EAB308' : '#27272A' }} />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: isInternal ? '#EAB308' : '#27272A' }}>Internal note</span>
                      </label>
                    ) : <span />}
                    <button onClick={post} disabled={!newComment.trim() || saving}
                      style={{ padding: '6px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'not-allowed', background: newComment.trim() ? '#FAFAFA' : '#18181B', color: newComment.trim() ? '#09090B' : '#27272A', transition: 'all .15s' }}>
                      {saving ? 'Sending...' : 'Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ RIGHT SIDEBAR ═══════ */}
          <div style={{ padding: '28px 16px', paddingTop: '28px', fontSize: '13px' }}>

            {/* Details Card */}
            <div style={{ background: 'linear-gradient(180deg, #111114 0%, #0E0E11 100%)', borderRadius: '14px', border: '1px solid #1A1A1E', padding: '20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Details</div>

              {/* Status */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#3F3F46', marginBottom: '6px' }}>Status</div>
                {isAdmin ? (
                  <DropMenu trigger={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: `${s.colour}12`, cursor: 'pointer', transition: 'background .15s' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.colour }} />
                      <span style={{ color: s.colour, fontWeight: 600, fontSize: '13px' }}>{s.label}</span>
                      <ChevronDownIcon style={{ width: '10px', height: '10px', color: `${s.colour}80` }} />
                    </span>
                  }>
                    {[ticket.status, ...(TRANSITIONS[ticket.status] || [])].map(k => (
                      <DropItem key={k} active={ticket.status === k} dot={STATUS[k]?.colour} label={STATUS[k]?.label || k} onClick={() => upd('status', k)} />
                    ))}
                  </DropMenu>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: `${s.colour}12` }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.colour }} />
                    <span style={{ color: s.colour, fontWeight: 600, fontSize: '13px' }}>{s.label}</span>
                  </span>
                )}
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#3F3F46', marginBottom: '6px' }}>Priority</div>
                {isAdmin ? (
                  <DropMenu trigger={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: `${p.colour}12`, cursor: 'pointer' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.colour }} />
                      <span style={{ color: p.colour, fontWeight: 600, fontSize: '13px' }}>{p.label}</span>
                      <ChevronDownIcon style={{ width: '10px', height: '10px', color: `${p.colour}80` }} />
                    </span>
                  }>
                    {['critical', 'high', 'medium', 'low'].map(k => (
                      <DropItem key={k} active={ticket.priority === k} dot={PRIORITY[k]?.colour} label={PRIORITY[k]?.label} onClick={() => upd('priority', k)} />
                    ))}
                  </DropMenu>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: `${p.colour}12` }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.colour }} />
                    <span style={{ color: p.colour, fontWeight: 600, fontSize: '13px' }}>{p.label}</span>
                  </span>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#1A1A1E', margin: '4px 0 14px' }} />

              {/* Type */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#3F3F46' }}>Type</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <TI style={{ width: '13px', height: '13px', color: '#52525B' }} />
                  <span style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '13px' }}>{TYPE_LABEL[ticket.type] || ticket.type}</span>
                </span>
              </div>

              {/* Reporter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#3F3F46' }}>Reporter</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1C1C20', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#71717A' }}>{(ticket.reporter_name || 'U').charAt(0).toUpperCase()}</span>
                  <span style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '13px' }}>{ticket.reporter_name}</span>
                </span>
              </div>

              {/* Resolution */}
              {(ticket.status === 'done' || ticket.status === 'closed') && (
                <>
                  <div style={{ height: '1px', background: '#1A1A1E', margin: '10px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#3F3F46' }}>Resolution</span>
                    {isAdmin ? (
                      <DropMenu trigger={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#A1A1AA', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                          {RESOLUTION[ticket.resolution] || 'Select...'} <ChevronDownIcon style={{ width: '10px', height: '10px', color: '#3F3F46' }} />
                        </span>
                      }>
                        <DropItem active={!ticket.resolution} label="None" onClick={() => upd('resolution', null)} />
                        {Object.entries(RESOLUTION).map(([k, v]) => <DropItem key={k} active={ticket.resolution === k} label={v} onClick={() => upd('resolution', k)} />)}
                      </DropMenu>
                    ) : <span style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '13px' }}>{RESOLUTION[ticket.resolution] || '—'}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Timeline Card */}
            <div style={{ background: 'linear-gradient(180deg, #111114 0%, #0E0E11 100%)', borderRadius: '14px', border: '1px solid #1A1A1E', padding: '20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Timeline</div>
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#3F3F46' }}>Created</span>
                  <span style={{ color: '#71717A', fontWeight: 500, fontSize: '11px' }}>{fmtDate(ticket.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#3F3F46' }}>Updated</span>
                  <span style={{ color: '#71717A', fontWeight: 500, fontSize: '11px' }}>{fmtDate(ticket.updated_at)}</span>
                </div>
                {ticket.closed_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#3F3F46' }}>Closed</span>
                    <span style={{ color: '#71717A', fontWeight: 500, fontSize: '11px' }}>{fmtDate(ticket.closed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Card */}
            {activity.length > 0 && (
              <div style={{ background: 'linear-gradient(180deg, #111114 0%, #0E0E11 100%)', borderRadius: '14px', border: '1px solid #1A1A1E', padding: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activity.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '3px', borderRadius: '3px', background: a.action === 'status_changed' ? (STATUS[a.new_value]?.colour || '#27272A') : a.action === 'created' ? '#3B82F6' : '#1C1C20', flexShrink: 0, minHeight: '28px' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: '#52525B', lineHeight: 1.5 }}>
                          <span style={{ color: '#71717A', fontWeight: 600 }}>{a.actor_name}</span>
                          {a.action === 'created' && ' opened this ticket'}
                          {a.action === 'status_changed' && <> moved to <span style={{ color: STATUS[a.new_value]?.colour, fontWeight: 600 }}>{STATUS[a.new_value]?.label || a.new_value}</span></>}
                          {a.action === 'priority_changed' && ` changed priority to ${a.new_value}`}
                          {a.action === 'assigned' && ` assigned to ${a.new_value || 'nobody'}`}
                          {a.action === 'comment_added' && ' commented'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#27272A', marginTop: '2px' }}>{ago(a.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            {isAdmin && (
              <button onClick={async () => {
                if (!confirm('Delete this ticket permanently?')) return;
                try {
                  await supabase.from('ticket_activity_log').delete().eq('ticket_id', ticket.id);
                  await supabase.from('ticket_comments').delete().eq('ticket_id', ticket.id);
                  await supabase.from('ticket_attachments').delete().eq('ticket_id', ticket.id);
                  await supabase.from('ticket_notifications').delete().eq('ticket_id', ticket.id);
                  await supabase.from('tickets').delete().eq('id', ticket.id);
                  router.push('/tickets');
                } catch (e) { console.error(e); alert('Failed to delete'); }
              }}
                style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '10px', border: '1px solid #1A1A1E', background: 'transparent', color: '#52525B', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF444440'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A1A1E'; e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'transparent'; }}>
                <TrashIcon style={{ width: '13px', height: '13px' }} /> Delete Ticket
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

