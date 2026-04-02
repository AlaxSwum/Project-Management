'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

export default function TicketAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [systems, setSystems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('systems');

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColour, setNewColour] = useState('#2563EB');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin' || user?.email === 'swumpyaesone.personal@gmail.com';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: sys } = await supabase.from('ticket_systems').select('*').order('id');
      setSystems(sys || []);

      const { data: users } = await supabase.from('auth_user').select('id, name, email, role, is_active').eq('is_active', true).order('name');
      const { data: access } = await supabase.from('ticket_user_system_access').select('user_id, system_id');
      const accessMap: Record<number, number[]> = {};
      (access || []).forEach((a: any) => {
        if (!accessMap[a.user_id]) accessMap[a.user_id] = [];
        accessMap[a.user_id].push(a.system_id);
      });
      setStaff((users || []).map((u: any) => ({ ...u, systems: accessMap[u.id] || [] })));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [authLoading, user, fetchData]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [authLoading, user, router]);
  useEffect(() => { if (!authLoading && user && !isAdmin) router.push('/tickets'); }, [authLoading, user, isAdmin, router]);

  const createSystem = async () => {
    if (!newName.trim() || !newPrefix.trim()) { setMessage('Name and prefix are required'); return; }
    setCreating(true);
    setMessage('');
    try {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const { data: newSys, error } = await supabase.from('ticket_systems').insert({
        name: newName.trim(), slug, prefix: newPrefix.trim().toUpperCase(),
        description: newDesc.trim(), colour: newColour,
      }).select().single();

      if (error) { setMessage('Error: ' + error.message); setCreating(false); return; }

      // Create sequence
      await supabase.from('ticket_number_seq').insert({ system_id: newSys.id, last_number: 0 });

      // Grant admin access
      if (user) {
        await supabase.from('ticket_user_system_access').upsert({ user_id: user.id, system_id: newSys.id });
      }

      setNewName(''); setNewPrefix(''); setNewDesc(''); setNewColour('#2563EB');
      setShowModal(false);
      fetchData();
    } catch (err: any) { setMessage('Error: ' + (err.message || 'Failed')); }
    setCreating(false);
  };

  const deleteSystem = async (id: number, name: string) => {
    if (!window.confirm('Delete "' + name + '"? All tickets will be deleted.')) return;
    await supabase.from('ticket_user_system_access').delete().eq('system_id', id);
    await supabase.from('ticket_number_seq').delete().eq('system_id', id);
    await supabase.from('ticket_systems').delete().eq('id', id);
    fetchData();
  };

  const toggleAccess = async (userId: number, systemId: number, has: boolean) => {
    if (has) {
      await supabase.from('ticket_user_system_access').delete().eq('user_id', userId).eq('system_id', systemId);
    } else {
      await supabase.from('ticket_user_system_access').insert({ user_id: userId, system_id: systemId });
    }
    fetchData();
  };

  if (authLoading || !user) {
    return <div style={{ background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading...</div>;
  }

  const colours = ['#2563EB', '#059669', '#D97706', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '1.5rem 2rem', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
          <Link href="/tickets" style={{ color: '#71717A', textDecoration: 'none' }}>Tickets</Link>
          <span style={{ color: '#3F3F46' }}>/</span>
          <span style={{ color: '#FAFAFA' }}>Admin</span>
        </div>

        <h1 style={{ color: '#FAFAFA', fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1.5rem' }}>Ticket Administration</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setTab('systems')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', background: tab === 'systems' ? '#FAFAFA' : '#18181B', color: tab === 'systems' ? '#09090B' : '#71717A', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
            Systems
          </button>
          <button onClick={() => setTab('staff')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', background: tab === 'staff' ? '#FAFAFA' : '#18181B', color: tab === 'staff' ? '#09090B' : '#71717A', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
            Staff Access
          </button>
        </div>

        {/* SYSTEMS TAB */}
        {tab === 'systems' && (
          <div>
            {/* Header with button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: 0 }}>Manage ticket systems</p>
              <button onClick={() => { setNewName(''); setNewPrefix(''); setNewDesc(''); setNewColour('#2563EB'); setMessage(''); setShowModal(true); }}
                style={{ padding: '0.5rem 1rem', background: '#FAFAFA', color: '#09090B', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
                + New System
              </button>
            </div>

            {/* Existing systems */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {systems.map((sys: any) => (
                <div key={sys.id} style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1rem', borderTop: `3px solid ${sys.colour}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sys.colour }} />
                      <span style={{ color: '#FAFAFA', fontSize: '0.9375rem', fontWeight: 600 }}>{sys.name}</span>
                    </div>
                    <button onClick={() => deleteSystem(sys.id, sys.name)}
                      style={{ padding: '0.25rem 0.5rem', background: 'none', border: '1px solid #27272A', borderRadius: '0.25rem', color: '#52525B', fontSize: '0.625rem', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                  <div style={{ color: '#71717A', fontSize: '0.75rem', marginBottom: '0.375rem' }}>{sys.description || 'No description'}</div>
                  <div style={{ color: '#52525B', fontSize: '0.6875rem' }}>Prefix: <span style={{ color: '#A1A1AA' }}>{sys.prefix}</span></div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* STAFF TAB */}
        {tab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {staff.map((s: any) => (
              <div key={s.id} style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: s.role === 'admin' ? '#6366F1' : '#3F3F46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.75rem', fontWeight: 600 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ color: '#FAFAFA', fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</span>
                      {s.role === 'admin' && <span style={{ color: '#818CF8', fontSize: '0.5625rem', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '0.0625rem 0.375rem', borderRadius: '0.25rem' }}>ADMIN</span>}
                    </div>
                    <div style={{ color: '#52525B', fontSize: '0.6875rem' }}>{s.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {systems.map((sys: any) => {
                    const has = s.systems.includes(sys.id);
                    return (
                      <button key={sys.id} onClick={() => toggleAccess(s.id, sys.id, has)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.3125rem 0.625rem', borderRadius: '1rem', cursor: 'pointer',
                          border: has ? `1px solid ${sys.colour}40` : '1px solid #27272A',
                          background: has ? `${sys.colour}15` : 'transparent',
                          color: has ? sys.colour : '#52525B',
                          fontSize: '0.75rem', fontWeight: 500,
                        }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: has ? sys.colour : '#3F3F46' }} />
                        {sys.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* NEW SYSTEM MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
            onClick={() => setShowModal(false)}>
            <div style={{ background: '#18181B', borderRadius: '0.75rem', padding: '1.5rem', width: '440px', maxWidth: '90vw', border: '1px solid #27272A' }}
              onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: '#FAFAFA', fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1.25rem' }}>New System</h3>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', marginBottom: '0.25rem' }}>System Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. HOPEIMS" autoFocus
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#09090B', border: '1px solid #27272A', borderRadius: '0.375rem', color: '#FAFAFA', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Prefix</label>
                  <input value={newPrefix} onChange={(e) => setNewPrefix(e.target.value.toUpperCase().slice(0, 6))} placeholder="e.g. HOPE" maxLength={6}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#09090B', border: '1px solid #27272A', borderRadius: '0.375rem', color: '#FAFAFA', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Colour</label>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {colours.map(c => (
                      <button key={c} onClick={() => setNewColour(c)}
                        style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: newColour === c ? '2px solid #FAFAFA' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Description</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#09090B', border: '1px solid #27272A', borderRadius: '0.375rem', color: '#FAFAFA', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {newName && newPrefix && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#09090B', borderRadius: '0.25rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#52525B' }}>
                  Preview: <span style={{ color: '#FAFAFA', fontWeight: 600 }}>{newPrefix.toUpperCase()}-0001</span>
                </div>
              )}

              {message && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.25rem', marginBottom: '0.75rem', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #27272A', borderRadius: '0.375rem', color: '#A1A1AA', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => { console.log('Create clicked'); createSystem(); }}
                  style={{ padding: '0.5rem 1.25rem', background: '#FAFAFA', color: '#09090B', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
