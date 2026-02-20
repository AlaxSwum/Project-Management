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
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  FolderIcon,
  UsersIcon,
  ChevronRightIcon,
  UserMinusIcon,
  ShareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface CompanyDetail {
  id: number;
  name: string;
  description: string;
  created_by: number;
}

interface Member {
  id: number;
  user_id: number;
  role: string;
  position: string;
  user_name: string;
  user_email: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  member_count: number;
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.id);
  const { user, isLoading: authLoading } = useAuth();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(false);
  const [showDeleteDept, setShowDeleteDept] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Form state
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberPosition, setMemberPosition] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Position editing
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [editPositionValue, setEditPositionValue] = useState('');

  const isAdmin = user?.role === 'admin';
  const canManage = isAdmin || userRole === 'admin' || userRole === 'manager';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch company
      const { data: companyData, error: companyErr } = await supabase.from('org_companies').select('*').eq('id', companyId).single();
      if (companyErr) throw companyErr;
      setCompany(companyData);

      // Fetch company members
      const { data: memberData } = await supabase.from('org_company_members').select('*').eq('company_id', companyId);
      const memberList = memberData || [];

      // Get user details
      const userIds = memberList.map((m: any) => m.user_id);
      let usersMap: Record<number, any> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('auth_user').select('id, name, email').in('id', userIds);
        (users || []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      const enrichedMembers = memberList.map((m: any) => ({
        ...m,
        position: m.position || '',
        user_name: usersMap[m.user_id]?.name || 'Unknown',
        user_email: usersMap[m.user_id]?.email || '',
      }));
      setMembers(enrichedMembers);

      // Set current user's role in this company
      const myMembership = memberList.find((m: any) => m.user_id === user.id);
      const myRole = myMembership?.role || null;
      setUserRole(myRole);

      // Fetch departments
      const { data: deptData } = await supabase.from('org_departments').select('*').eq('company_id', companyId).order('created_at', { ascending: true });
      const deptList = deptData || [];

      // Get department member counts
      if (deptList.length > 0) {
        const deptIds = deptList.map((d: any) => d.id);
        const { data: deptMembers } = await supabase.from('org_department_members').select('department_id').in('department_id', deptIds);
        const countMap: Record<number, number> = {};
        (deptMembers || []).forEach((dm: any) => { countMap[dm.department_id] = (countMap[dm.department_id] || 0) + 1; });

        // For non-admin/non-manager: filter to departments user belongs to
        let myDeptIds: number[] | null = null;
        if (!isAdmin && myRole !== 'admin' && myRole !== 'manager') {
          const { data: myDeptMemberships } = await supabase.from('org_department_members').select('department_id').eq('user_id', user.id).in('department_id', deptIds);
          myDeptIds = (myDeptMemberships || []).map((m: any) => m.department_id);
        }

        const enrichedDepts = deptList
          .filter((d: any) => myDeptIds === null || myDeptIds.includes(d.id))
          .map((d: any) => ({ ...d, member_count: countMap[d.id] || 0 }));
        setDepartments(enrichedDepts);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
    }
    setLoading(false);
  }, [user, companyId, isAdmin]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleCreateDept = async () => {
    if (!deptName.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_departments').insert({
        company_id: companyId,
        name: deptName.trim(),
        description: deptDesc.trim(),
        created_by: user.id,
      });
      if (error) throw error;
      setShowCreateDept(false);
      setDeptName('');
      setDeptDesc('');
      fetchData();
    } catch (err) {
      console.error('Error creating department:', err);
      alert('Failed to create department');
    }
    setSaving(false);
  };

  const handleEditDept = async () => {
    if (!deptName.trim() || !selectedDept) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_departments').update({
        name: deptName.trim(),
        description: deptDesc.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedDept.id);
      if (error) throw error;
      setShowEditDept(false);
      setSelectedDept(null);
      setDeptName('');
      setDeptDesc('');
      fetchData();
    } catch (err) {
      console.error('Error updating department:', err);
      alert('Failed to update department');
    }
    setSaving(false);
  };

  const handleDeleteDept = async () => {
    if (!selectedDept) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_departments').delete().eq('id', selectedDept.id);
      if (error) throw error;
      setShowDeleteDept(false);
      setSelectedDept(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department');
    }
    setSaving(false);
  };

  const searchUserByEmail = async (email: string) => {
    setMemberEmail(email);
    if (email.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase.from('auth_user').select('id, name, email').ilike('email', `%${email.trim()}%`).eq('is_active', true).limit(5);
      setSearchResults(data || []);
    } catch (err) { console.error(err); }
    setSearching(false);
  };

  const handleUpdatePosition = async (userId: number, newPosition: string) => {
    try {
      await supabase.from('org_company_members').update({ position: newPosition.trim() }).eq('company_id', companyId).eq('user_id', userId);
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, position: newPosition.trim() } : m));
    } catch (err) {
      console.error(err);
    }
    setEditingPositionId(null);
  };

  const handleAddMember = async (userId: number) => {
    setSaving(true);
    try {
      const insertData: Record<string, unknown> = {
        company_id: companyId,
        user_id: userId,
        role: memberRole,
      };
      if (memberPosition.trim()) insertData.position = memberPosition.trim();
      const { error } = await supabase.from('org_company_members').insert(insertData);
      if (error) {
        if (error.code === '23505') alert('User is already a member');
        else throw error;
      } else {
        setMemberEmail('');
        setSearchResults([]);
        setShowAddMember(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add member');
    }
    setSaving(false);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member from the company?')) return;
    try {
      await supabase.from('org_company_members').delete().eq('company_id', companyId).eq('user_id', userId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: number, newRole: string) => {
    try {
      await supabase.from('org_company_members').update({ role: newRole }).eq('company_id', companyId).eq('user_id', userId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user || loading) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  if (!company) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: 'Mabry Pro, sans-serif' }}>Company not found</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href="/company" style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>Company</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{company.name}</span>
        </div>

        {/* Company Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{company.name}</h1>
            {company.description && <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>{company.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(isAdmin || userRole === 'admin') && (
              <button onClick={() => router.push(`/company/${companyId}/org-chart`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                <ShareIcon style={{ width: '16px', height: '16px' }} /> Org Chart
              </button>
            )}
            {canManage && (
              <>
                <button onClick={() => { setMemberEmail(''); setMemberRole('member'); setMemberPosition(''); setSearchResults([]); setShowAddMember(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}>
                  <UserPlusIcon style={{ width: '16px', height: '16px' }} /> Add Member
                </button>
                <button onClick={() => { setDeptName(''); setDeptDesc(''); setShowCreateDept(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')} onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}>
                  <PlusIcon style={{ width: '16px', height: '16px' }} /> New Department
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setShowMembers(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#222'; e.currentTarget.style.borderColor = '#3D3D3D'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.borderColor = '#2D2D2D'; }}
          >
            <UsersIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
            Members ({members.length})
          </button>
        </div>

        {/* Members Popup Modal */}
        {showMembers && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }} onClick={() => setShowMembers(false)}>
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '680px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <h2 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Members ({members.length})</h2>
                <button onClick={() => setShowMembers(false)} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', lineHeight: 0 }}>
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: canManage ? '2fr 1.5fr 100px 80px' : '2fr 1.5fr 100px', padding: '0.5rem 1.25rem', borderBottom: '1px solid #1F1F1F', fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                <span>Name</span>
                <span>Position</span>
                <span>Role</span>
                {canManage && <span style={{ textAlign: 'right' }}>Actions</span>}
              </div>
              {/* Scrollable member rows */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {members.map((m, idx) => (
                  <div key={m.id} style={{ display: 'grid', gridTemplateColumns: canManage ? '2fr 1.5fr 100px 80px' : '2fr 1.5fr 100px', padding: '0.625rem 1.25rem', alignItems: 'center', borderBottom: idx < members.length - 1 ? '1px solid #1F1F1F' : 'none', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#141414')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {/* Name + Email */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                        {m.user_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user_name}</div>
                        <div style={{ color: '#52525B', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user_email}</div>
                      </div>
                    </div>
                    {/* Position */}
                    <div style={{ minWidth: 0 }}>
                      {editingPositionId === m.user_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <input
                            value={editPositionValue}
                            onChange={(e) => setEditPositionValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePosition(m.user_id, editPositionValue); if (e.key === 'Escape') setEditingPositionId(null); }}
                            autoFocus
                            placeholder="e.g. CEO, Designer..."
                            style={{ padding: '0.25rem 0.5rem', background: '#0D0D0D', border: '1px solid #3B82F6', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.8125rem', outline: 'none', width: '100%', maxWidth: '180px', boxSizing: 'border-box' }}
                          />
                          <button onClick={() => handleUpdatePosition(m.user_id, editPositionValue)} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}>
                            <CheckIcon style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => { if (canManage) { setEditingPositionId(m.user_id); setEditPositionValue(m.position || ''); } }}
                          style={{ color: m.position ? '#A1A1AA' : '#3D3D3D', fontSize: '0.8125rem', cursor: canManage ? 'pointer' : 'default', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.25rem 0', borderRadius: '0.25rem' }}
                          onMouseEnter={(e) => { if (canManage) e.currentTarget.style.color = m.position ? '#FFFFFF' : '#71717A'; }}
                          onMouseLeave={(e) => { if (canManage) e.currentTarget.style.color = m.position ? '#A1A1AA' : '#3D3D3D'; }}
                          title={canManage ? 'Click to edit position' : ''}
                        >
                          {m.position || (canManage ? 'Set position...' : '—')}
                        </div>
                      )}
                    </div>
                    {/* Role */}
                    <div>
                      {canManage ? (
                        <select value={m.role} onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value)} style={{ padding: '0.25rem 0.375rem', background: 'transparent', border: '1px solid transparent', borderRadius: '0.375rem', color: m.role === 'admin' ? '#10B981' : m.role === 'manager' ? '#F59E0B' : '#71717A', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span style={{ color: m.role === 'admin' ? '#10B981' : m.role === 'manager' ? '#F59E0B' : '#71717A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                      )}
                    </div>
                    {/* Actions */}
                    {canManage && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        {m.user_id !== user?.id && (
                          <button onClick={() => handleRemoveMember(m.user_id)} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', lineHeight: 0 }} onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#52525B')} title="Remove member">
                            <UserMinusIcon style={{ width: '15px', height: '15px' }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#52525B', fontSize: '0.875rem' }}>No members yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Departments Section */}
        <div>
          <h2 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Departments ({departments.length})</h2>
          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#71717A', background: '#1A1A1A', borderRadius: '1rem', border: '1px solid #2D2D2D' }}>
              <FolderIcon style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No departments yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  onClick={() => router.push(`/company/${companyId}/department/${dept.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderIcon style={{ width: '18px', height: '18px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{dept.name}</h3>
                        {dept.description && <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.125rem 0 0' }}>{dept.description}</p>}
                      </div>
                    </div>
                    {canManage && (
                      <div style={{ display: 'flex', gap: '0.125rem' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setSelectedDept(dept); setDeptName(dept.name); setDeptDesc(dept.description); setShowEditDept(true); }} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>
                          <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button onClick={() => { setSelectedDept(dept); setShowDeleteDept(true); }} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>
                          <TrashIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                    <UsersIcon style={{ width: '14px', height: '14px' }} />
                    {dept.member_count} members
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Department Modal */}
        {showCreateDept && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowCreateDept(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Create Department</h3>
                <button onClick={() => setShowCreateDept(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Department Name</label>
                <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Marketing, Engineering..." style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</label>
                <textarea value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Optional description" rows={3} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateDept(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateDept} disabled={!deptName.trim() || saving} style={{ padding: '0.625rem 1.25rem', background: deptName.trim() ? '#10B981' : '#3D3D3D', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: deptName.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditDept && selectedDept && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowEditDept(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Edit Department</h3>
                <button onClick={() => setShowEditDept(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Department Name</label>
                <input value={deptName} onChange={(e) => setDeptName(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</label>
                <textarea value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEditDept(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEditDept} disabled={!deptName.trim() || saving} style={{ padding: '0.625rem 1.25rem', background: '#10B981', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Department Modal */}
        {showDeleteDept && selectedDept && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowDeleteDept(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '400px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Delete Department</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>{selectedDept.name}</strong>? All members, responsibilities, and checklists in this department will be removed.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteDept(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeleteDept} disabled={saving} style={{ padding: '0.625rem 1.25rem', background: '#EF4444', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAddMember(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Add Company Member</h3>
                <button onClick={() => setShowAddMember(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Search by Email</label>
                <input value={memberEmail} onChange={(e) => searchUserByEmail(e.target.value)} placeholder="Type email to search..." style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Position</label>
                <input value={memberPosition} onChange={(e) => setMemberPosition(e.target.value)} placeholder="e.g. CEO, Marketing Director, Designer..." style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role <span style={{ color: '#52525B', fontWeight: 400 }}>(access level)</span></label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none' }}>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {searching && <div style={{ color: '#71717A', fontSize: '0.8125rem', padding: '0.5rem 0' }}>Searching...</div>}
              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: '#141414', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                      <div>
                        <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{u.name}</div>
                        <div style={{ color: '#71717A', fontSize: '0.75rem' }}>{u.email}</div>
                      </div>
                      <button onClick={() => handleAddMember(u.id)} disabled={saving} style={{ padding: '0.375rem 0.75rem', background: '#10B981', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                        {saving ? '...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {memberEmail.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <div style={{ color: '#71717A', fontSize: '0.8125rem', padding: '0.5rem 0' }}>No users found</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
