'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ArrowRightIcon, ClockIcon, ExclamationTriangleIcon,
  ClipboardDocumentListIcon, FolderIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDateUK(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_DOTS: Record<string, string> = {
  open: '#3B82F6', in_progress: '#D97706', in_review: '#8B5CF6', testing: '#14B8A6',
  done: '#10B981', closed: '#6B7280', on_hold: '#6B7280', wont_fix: '#6B7280',
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSystems, setTicketSystems] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Projects
      const { data: membershipData } = await supabase.from('projects_project_members').select('project_id').eq('user_id', user.id);
      const projectIds = (membershipData || []).map((m: any) => m.project_id);

      const [projectsRes, tasksRes] = await Promise.all([
        projectIds.length > 0 ? supabase.from('projects_project').select('id, name, color, status, due_date').in('id', projectIds) : { data: [] },
        projectIds.length > 0 ? supabase.from('projects_task').select('id, name, status, due_date, project_id').in('project_id', projectIds).order('due_date', { ascending: true }).limit(10) : { data: [] },
      ]);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);

      // Tickets
      const { data: sys } = await supabase.from('ticket_systems').select('*').order('id');
      setTicketSystems(sys || []);

      let ticketAccessIds: number[] = [];
      if (isAdmin) {
        ticketAccessIds = (sys || []).map((s: any) => s.id);
      } else {
        const { data: access } = await supabase.from('ticket_user_system_access').select('system_id').eq('user_id', user.id);
        ticketAccessIds = (access || []).map((a: any) => a.system_id);
      }

      if (ticketAccessIds.length > 0) {
        const { data: tix } = await supabase.from('tickets').select('*').in('system_id', ticketAccessIds).order('created_at', { ascending: false }).limit(5);
        setTickets(tix || []);
      }

      // Checklists
      const { data: depts } = await supabase.from('org_department_members').select('department_id').eq('user_id', user.id);
      const deptIds = (depts || []).map((d: any) => d.department_id);
      if (deptIds.length > 0) {
        const { data: checks } = await supabase.from('org_checklists').select('*').eq('user_id', user.id).in('department_id', deptIds);
        setChecklists(checks || []);
      }

      // Recent ticket activity (admin)
      if (isAdmin) {
        const { data: acts } = await supabase.from('ticket_activity_log').select('*').order('created_at', { ascending: false }).limit(8);
        if (acts?.length) {
          const actorIds = [...new Set(acts.map((a: any) => a.actor_id))];
          const ticketIds = [...new Set(acts.map((a: any) => a.ticket_id))];
          const [{ data: actors }, { data: tixData }] = await Promise.all([
            supabase.from('auth_user').select('id, name').in('id', actorIds),
            supabase.from('tickets').select('id, ticket_number').in('id', ticketIds),
          ]);
          const actorMap: Record<number, string> = {};
          (actors || []).forEach((a: any) => { actorMap[a.id] = a.name; });
          const tixMap: Record<number, string> = {};
          (tixData || []).forEach((t: any) => { tixMap[t.id] = t.ticket_number; });
          setRecentActivity(acts.map((a: any) => ({ ...a, actor_name: actorMap[a.actor_id] || 'Unknown', ticket_number: tixMap[a.ticket_id] || '' })));
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #27272A', borderTopColor: '#FAFAFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Stats
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const criticalTickets = tickets.filter(t => t.priority === 'critical' && !['done', 'closed'].includes(t.status)).length;
  const checklistTotal = checklists.length;
  const checklistDone = checklists.filter((c: any) => c.is_completed).length;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />

      <div className="page-main" style={{ flex: 1, marginLeft: '280px', background: '#09090B' }}>
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FAFAFA', margin: 0, letterSpacing: '-0.025em' }}>
                {greet()}, {firstName}
              </h1>
              <p style={{ color: '#52525B', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{formatDateUK()}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/tickets/new" style={{ padding: '0.5rem 0.875rem', background: '#FAFAFA', color: '#09090B', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}>New Ticket</Link>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 2rem 2rem' }}>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Projects', value: projects.length, border: '#3B82F6' },
              { label: 'Tasks', value: totalTasks, sub: `${inProgressTasks} in progress`, border: '#D97706' },
              { label: 'Open Tickets', value: openTickets, sub: criticalTickets > 0 ? `${criticalTickets} critical` : undefined, border: criticalTickets > 0 ? '#EF4444' : '#8B5CF6' },
              { label: 'Checklist Today', value: `${checklistPct}%`, sub: `${checklistDone}/${checklistTotal} done`, border: '#10B981' },
              { label: 'Completed', value: completedTasks, sub: 'tasks done', border: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#18181B', border: '1px solid #27272A', borderLeft: `3px solid ${s.border}`, borderRadius: '0.5rem', padding: '1rem 1.125rem' }}>
                <div style={{ color: '#FAFAFA', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 500, marginTop: '0.375rem' }}>{s.label}</div>
                {s.sub && <div style={{ color: s.border, fontSize: '0.625rem', fontWeight: 500, marginTop: '0.125rem' }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>

            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Recent Tickets */}
              <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: '1px solid #27272A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ExclamationTriangleIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                    <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600 }}>Recent Tickets</span>
                  </div>
                  <Link href="/tickets" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#52525B', fontSize: '0.6875rem', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#A1A1AA')} onMouseLeave={(e) => (e.currentTarget.style.color = '#52525B')}>
                    View all <ArrowRightIcon style={{ width: '10px', height: '10px' }} />
                  </Link>
                </div>
                {tickets.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#3F3F46', fontSize: '0.8125rem' }}>No tickets yet</div>
                ) : (
                  <div>
                    {tickets.map((t: any, i: number) => {
                      const sys = ticketSystems.find((s: any) => s.id === t.system_id);
                      return (
                        <Link key={t.id} href={`/tickets/${t.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1.125rem', borderBottom: i < tickets.length - 1 ? '1px solid #1F1F1F' : 'none', textDecoration: 'none', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1C1F')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: STATUS_DOTS[t.priority] || '#6B7280', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600 }}>{t.ticket_number}</span>
                              {sys && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sys.colour }} />}
                            </div>
                            <div style={{ color: '#FAFAFA', fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                          </div>
                          <span style={{ color: '#3F3F46', fontSize: '0.625rem', flexShrink: 0 }}>{timeAgo(t.created_at)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Tasks */}
              <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: '1px solid #27272A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                    <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600 }}>Tasks</span>
                  </div>
                </div>
                {tasks.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#3F3F46', fontSize: '0.8125rem' }}>No tasks yet</div>
                ) : (
                  <div>
                    {tasks.slice(0, 6).map((t: any, i: number) => (
                      <div key={t.id} onClick={() => router.push(`/projects/${t.project_id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1.125rem', borderBottom: i < Math.min(tasks.length, 6) - 1 ? '1px solid #1F1F1F' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1C1F')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.status === 'done' ? '#10B981' : t.status === 'in_progress' ? '#D97706' : '#3F3F46', flexShrink: 0 }} />
                        <span style={{ flex: 1, color: '#FAFAFA', fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                        <span style={{ color: '#3F3F46', fontSize: '0.625rem', flexShrink: 0 }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Checklist Progress */}
              <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1.125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardDocumentListIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                    <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600 }}>Today's Checklists</span>
                  </div>
                  <Link href="/my-checklists" style={{ color: '#52525B', fontSize: '0.6875rem', textDecoration: 'none' }}>View</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                  <div style={{ flex: 1, height: '8px', background: '#27272A', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${checklistPct}%`, height: '100%', background: checklistPct === 100 ? '#10B981' : '#3B82F6', borderRadius: '4px', transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ color: checklistPct === 100 ? '#10B981' : '#FAFAFA', fontSize: '0.875rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{checklistPct}%</span>
                </div>
                <div style={{ color: '#52525B', fontSize: '0.6875rem' }}>{checklistDone} of {checklistTotal} tasks completed</div>
                {checklistPct === 100 && checklistTotal > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', padding: '0.375rem 0.625rem', background: 'rgba(16,185,129,0.08)', borderRadius: '0.25rem' }}>
                    <CheckCircleSolidIcon style={{ width: '14px', height: '14px', color: '#10B981' }} />
                    <span style={{ color: '#10B981', fontSize: '0.6875rem', fontWeight: 500 }}>All done for today</span>
                  </div>
                )}
              </div>

              {/* Ticket Systems Overview */}
              {ticketSystems.length > 0 && (
                <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1.125rem' }}>
                  <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Systems</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ticketSystems.map((sys: any) => {
                      const sysTickets = tickets.filter((t: any) => t.system_id === sys.id);
                      const sysOpen = sysTickets.filter((t: any) => !['done', 'closed', 'wont_fix'].includes(t.status)).length;
                      return (
                        <div key={sys.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', background: '#141414', borderRadius: '0.375rem', border: '1px solid #1F1F1F' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sys.colour, flexShrink: 0 }} />
                          <span style={{ color: '#A1A1AA', fontSize: '0.75rem', flex: 1 }}>{sys.name}</span>
                          <span style={{ color: sysOpen > 0 ? '#FAFAFA' : '#3F3F46', fontSize: '0.6875rem', fontWeight: 600 }}>{sysOpen} open</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity (Admin) */}
              {isAdmin && recentActivity.length > 0 && (
                <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1.125rem' }}>
                  <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Activity</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {recentActivity.slice(0, 6).map((a: any) => (
                      <div key={a.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem 0' }}>
                        <ClockIcon style={{ width: '12px', height: '12px', color: '#3F3F46', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ color: '#71717A', fontSize: '0.6875rem', lineHeight: 1.4 }}>
                            <span style={{ color: '#A1A1AA', fontWeight: 500 }}>{a.actor_name}</span>
                            {a.action === 'status_changed' && <> changed {a.ticket_number} to {a.new_value}</>}
                            {a.action === 'created' && <> created {a.ticket_number}</>}
                            {a.action === 'assigned' && <> assigned {a.ticket_number}</>}
                            {a.action === 'comment_added' && <> commented on {a.ticket_number}</>}
                            {a.action === 'priority_changed' && <> changed priority on {a.ticket_number}</>}
                          </div>
                          <div style={{ color: '#27272A', fontSize: '0.5625rem' }}>{timeAgo(a.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1.125rem' }}>
                  <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Projects</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {projects.slice(0, 5).map((p: any) => (
                      <Link key={p.id} href={`/projects/${p.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', background: '#141414', borderRadius: '0.375rem', border: '1px solid #1F1F1F', textDecoration: 'none', transition: 'border-color 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#27272A')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1F1F1F')}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color || '#3F3F46', flexShrink: 0 }} />
                        <span style={{ color: '#A1A1AA', fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
