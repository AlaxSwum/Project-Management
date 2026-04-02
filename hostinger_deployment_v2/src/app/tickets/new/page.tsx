'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ChevronRightIcon, BugAntIcon, LightBulbIcon, WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon, QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface TicketSystem { id: number; name: string; slug: string; prefix: string; colour: string; }

const TYPE_INFO = [
  { key: 'bug', label: 'Bug Report', desc: 'Something is broken or not working', icon: BugAntIcon, colour: '#EF4444' },
  { key: 'feature_request', label: 'Feature Request', desc: 'I want a new feature or capability', icon: LightBulbIcon, colour: '#D97706' },
  { key: 'improvement', label: 'Improvement', desc: 'Something works but could be better', icon: WrenchScrewdriverIcon, colour: '#3B82F6' },
  { key: 'task', label: 'Task', desc: 'A piece of work that needs to be done', icon: ClipboardDocumentCheckIcon, colour: '#10B981' },
  { key: 'support', label: 'Help / Support', desc: 'I need help with something', icon: QuestionMarkCircleIcon, colour: '#8B5CF6' },
];

const PRIORITY_INFO = [
  { key: 'low', label: 'Low', desc: 'Minor issue, no urgency', colour: '#6B7280' },
  { key: 'medium', label: 'Medium', desc: 'Standard priority', colour: '#EAB308' },
  { key: 'high', label: 'High', desc: 'Important, affects key functionality', colour: '#F97316' },
  { key: 'critical', label: 'Critical', desc: 'System down, needs immediate attention', colour: '#EF4444' },
];

const DESC_PLACEHOLDERS: Record<string, string> = {
  bug: 'What happened? Include any error messages you saw and what you were doing when it occurred.',
  feature_request: 'Describe the feature you would like and why it would be useful for your work.',
  improvement: 'What would you like to be improved and how would you like it to work?',
  task: 'Describe the task that needs to be done. Include any relevant details or deadlines.',
  support: 'Describe the issue you are experiencing. Include any details that might help us assist you.',
  '': 'Select a type above first, then describe your issue or request here.',
};

export default function NewTicketPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [systems, setSystems] = useState<TicketSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [systemId, setSystemId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');

  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    (async () => {
      const { data: sys } = await supabase.from('ticket_systems').select('*').order('id');
      let accessIds: number[] = [];
      if (isAdmin) {
        accessIds = (sys || []).map((s: any) => s.id);
      } else {
        const { data: access } = await supabase.from('ticket_user_system_access').select('system_id').eq('user_id', user.id);
        accessIds = (access || []).map((a: any) => a.system_id);
      }
      const available = (sys || []).filter((s: any) => accessIds.includes(s.id));
      setSystems(available as TicketSystem[]);
      if (available.length === 1) setSystemId(available[0].id);
      setLoading(false);
    })();
  }, [user, authLoading, router, isAdmin]);


  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!systemId) e.system = 'Please select a system';
    if (!title.trim()) e.title = 'Please enter a title';
    if (title.length > 150) e.title = 'Title must be 150 characters or fewer';
    if (!type) e.type = 'Please select a type';
    if (!description.trim()) e.description = 'Please add a description';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('tickets').insert({
        system_id: systemId, title: title.trim(), type, priority,
        description: description.trim(),
        steps_to_reproduce: steps.trim() || null,
        expected_behaviour: expected.trim() || null,
        actual_behaviour: actual.trim() || null,
        reporter_id: user.id, ticket_number: '',
      }).select().single();
      if (error) throw error;
      await supabase.from('ticket_activity_log').insert({ ticket_id: data.id, actor_id: user.id, action: 'created', new_value: data.ticket_number });
      router.push(`/tickets/${data.id}`);
    } catch (err) { console.error(err); alert('Failed to create ticket'); }
    setSaving(false);
  };

  const inp = (field?: string): React.CSSProperties => ({
    width: '100%', padding: '0.625rem 0.75rem', background: '#0F0F11',
    border: `1px solid ${errors[field || ''] ? '#EF4444' : '#27272A'}`,
    borderRadius: '0.375rem', color: '#FAFAFA', fontSize: '0.875rem',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'Inter, system-ui, sans-serif',
  });

  if (authLoading || !user) {
    return <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
          <Link href="/tickets" style={{ color: '#71717A', textDecoration: 'none' }}>Tickets</Link>
          <ChevronRightIcon style={{ width: '12px', height: '12px', color: '#3F3F46' }} />
          <span style={{ color: '#FAFAFA' }}>New Ticket</span>
        </div>

        <div style={{ maxWidth: '680px' }}>
          <h1 style={{ color: '#FAFAFA', fontSize: '1.375rem', fontWeight: 600, margin: '0 0 0.25rem', letterSpacing: '-0.025em' }}>Create a Ticket</h1>
          <p style={{ color: '#52525B', fontSize: '0.8125rem', margin: '0 0 1.5rem' }}>Report an issue, request a feature, or ask for help</p>

          {/* STEP 1: System */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Which system?</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {systems.map(s => (
                <button key={s.id} onClick={() => { setSystemId(s.id); setErrors(e => ({ ...e, system: '' })); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.15s',
                    border: systemId === s.id ? `2px solid ${s.colour}` : '1px solid #27272A',
                    background: systemId === s.id ? `${s.colour}08` : '#18181B',
                    color: systemId === s.id ? '#FAFAFA' : '#71717A',
                    fontSize: '0.875rem', fontWeight: 500,
                  }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.colour }} />
                  {s.name}
                </button>
              ))}
            </div>
            {errors.system && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.system}</p>}
          </div>

          {/* STEP 2: What kind of request? */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What do you need?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {TYPE_INFO.map(t => {
                const Icon = t.icon;
                const selected = type === t.key;
                return (
                  <button key={t.key} onClick={() => { setType(t.key); setErrors(e => ({ ...e, type: '' })); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.375rem',
                      padding: '0.875rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      border: selected ? `2px solid ${t.colour}` : '1px solid #27272A',
                      background: selected ? `${t.colour}08` : '#18181B',
                    }}>
                    <Icon style={{ width: '18px', height: '18px', color: selected ? t.colour : '#52525B' }} />
                    <span style={{ color: selected ? '#FAFAFA' : '#A1A1AA', fontSize: '0.8125rem', fontWeight: 600 }}>{t.label}</span>
                    <span style={{ color: '#52525B', fontSize: '0.6875rem', lineHeight: 1.3 }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.type && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.type}</p>}
          </div>

          {/* STEP 3: Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
            <input value={title} onChange={(e) => { setTitle(e.target.value); setErrors(er => ({ ...er, title: '' })); }}
              placeholder="Brief summary - e.g. 'Cannot print patient labels'"
              maxLength={150} style={inp('title')}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3F3F46')}
              onBlur={(e) => (e.currentTarget.style.borderColor = errors.title ? '#EF4444' : '#27272A')} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {errors.title ? <span style={{ color: '#EF4444', fontSize: '0.6875rem' }}>{errors.title}</span> : <span />}
              <span style={{ color: '#3F3F46', fontSize: '0.625rem' }}>{title.length}/150</span>
            </div>
          </div>

          {/* STEP 4: Priority */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How urgent?</label>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {PRIORITY_INFO.map(p => (
                <button key={p.key} onClick={() => setPriority(p.key)}
                  style={{
                    flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.15s',
                    border: priority === p.key ? `2px solid ${p.colour}` : '1px solid #27272A',
                    background: priority === p.key ? `${p.colour}10` : '#18181B',
                    color: priority === p.key ? '#FAFAFA' : '#71717A',
                    fontSize: '0.75rem', fontWeight: 500, textAlign: 'center',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.colour }} />
                    {p.label}
                  </div>
                </button>
              ))}
            </div>
            <p style={{ color: '#3F3F46', fontSize: '0.625rem', marginTop: '0.25rem' }}>{PRIORITY_INFO.find(p => p.key === priority)?.desc}</p>
          </div>

          {/* STEP 5: Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); setErrors(er => ({ ...er, description: '' })); }}
              placeholder={DESC_PLACEHOLDERS[type] || DESC_PLACEHOLDERS['']}
              rows={5} style={{ ...inp('description'), resize: 'vertical' as const, minHeight: '120px' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3F3F46')}
              onBlur={(e) => (e.currentTarget.style.borderColor = errors.description ? '#EF4444' : '#27272A')} />
            {errors.description && <p style={{ color: '#EF4444', fontSize: '0.6875rem', marginTop: '0.25rem' }}>{errors.description}</p>}
          </div>

          {/* STEP 6: Technical Details (Bug only) */}
          {type === 'bug' && (
            <div style={{ marginBottom: '1.25rem', padding: '1rem 1.125rem', background: '#141416', borderRadius: '0.5rem', border: '1px solid #1F1F23' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <span style={{ color: '#A1A1AA', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Details</span>
                <span style={{ color: '#3F3F46', fontSize: '0.625rem' }}>(optional, helps us fix it faster)</span>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', color: '#71717A', fontSize: '0.6875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Steps to reproduce</label>
                <textarea value={steps} onChange={(e) => setSteps(e.target.value)}
                  placeholder={"1. Go to...\n2. Click on...\n3. See the error"}
                  rows={3} style={{ ...inp(), resize: 'vertical' as const, fontSize: '0.8125rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#71717A', fontSize: '0.6875rem', fontWeight: 500, marginBottom: '0.25rem' }}>What should happen?</label>
                  <textarea value={expected} onChange={(e) => setExpected(e.target.value)}
                    placeholder="The expected result" rows={2} style={{ ...inp(), resize: 'vertical' as const, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#71717A', fontSize: '0.6875rem', fontWeight: 500, marginBottom: '0.25rem' }}>What actually happens?</label>
                  <textarea value={actual} onChange={(e) => setActual(e.target.value)}
                    placeholder="What went wrong" rows={2} style={{ ...inp(), resize: 'vertical' as const, fontSize: '0.8125rem' }} />
                </div>
              </div>

            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #1F1F23' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '0.625rem 1.5rem', background: '#FAFAFA', color: '#09090B', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <Link href="/tickets"
              style={{ padding: '0.625rem 1.25rem', background: 'transparent', color: '#71717A', border: '1px solid #27272A', borderRadius: '0.375rem', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
