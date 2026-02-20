'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface Company {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  member_count?: number;
  dept_count?: number;
}

interface CompanyMember {
  id: number;
  company_id: number;
  user_id: number;
  role: string;
  user_name?: string;
  user_email?: string;
}

export default function CompanyListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let companiesData: any[] = [];

      if (isAdmin) {
        const { data, error } = await supabase.from('org_companies').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        companiesData = data || [];
      } else {
        // Non-admin: only companies they belong to
        const { data: memberships } = await supabase.from('org_company_members').select('company_id').eq('user_id', user.id);
        const companyIds = (memberships || []).map((m: any) => m.company_id);
        if (companyIds.length > 0) {
          const { data } = await supabase.from('org_companies').select('*').in('id', companyIds).order('created_at', { ascending: false });
          companiesData = data || [];
        }
      }

      // Get member counts and dept counts
      if (companiesData.length > 0) {
        const ids = companiesData.map((c: any) => c.id);
        const [membersRes, deptsRes] = await Promise.all([
          supabase.from('org_company_members').select('company_id').in('company_id', ids),
          supabase.from('org_departments').select('company_id').in('company_id', ids),
        ]);

        const memberCounts: Record<number, number> = {};
        const deptCounts: Record<number, number> = {};
        (membersRes.data || []).forEach((m: any) => { memberCounts[m.company_id] = (memberCounts[m.company_id] || 0) + 1; });
        (deptsRes.data || []).forEach((d: any) => { deptCounts[d.company_id] = (deptCounts[d.company_id] || 0) + 1; });

        companiesData = companiesData.map((c: any) => ({
          ...c,
          member_count: memberCounts[c.id] || 0,
          dept_count: deptCounts[c.id] || 0,
        }));
      }

      setCompanies(companiesData);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!authLoading && user) fetchCompanies();
  }, [authLoading, user, fetchCompanies]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleCreate = async () => {
    if (!formName.trim() || !user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('org_companies').insert({
        name: formName.trim(),
        description: formDesc.trim(),
        created_by: user.id,
      }).select().single();
      if (error) throw error;

      // Add creator as admin member
      await supabase.from('org_company_members').insert({
        company_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

      setShowCreateModal(false);
      setFormName('');
      setFormDesc('');
      fetchCompanies();
    } catch (err) {
      console.error('Error creating company:', err);
      alert('Failed to create company');
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!formName.trim() || !selectedCompany) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_companies').update({
        name: formName.trim(),
        description: formDesc.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedCompany.id);
      if (error) throw error;

      setShowEditModal(false);
      setSelectedCompany(null);
      setFormName('');
      setFormDesc('');
      fetchCompanies();
    } catch (err) {
      console.error('Error updating company:', err);
      alert('Failed to update company');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_companies').delete().eq('id', selectedCompany.id);
      if (error) throw error;
      setShowDeleteModal(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err) {
      console.error('Error deleting company:', err);
      alert('Failed to delete company');
    }
    setSaving(false);
  };

  const searchUserByEmail = async (email: string) => {
    setMemberEmail(email);
    if (email.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase.from('auth_user').select('id, name, email').ilike('email', `%${email.trim()}%`).eq('is_active', true).limit(5);
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
    setSearching(false);
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedCompany) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('org_company_members').insert({
        company_id: selectedCompany.id,
        user_id: userId,
        role: memberRole,
      });
      if (error) {
        if (error.code === '23505') {
          alert('User is already a member of this company');
        } else {
          throw error;
        }
      } else {
        setMemberEmail('');
        setSearchResults([]);
        setMemberRole('member');
        setShowAddMemberModal(false);
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to add member');
    }
    setSaving(false);
  };

  if (authLoading || !user) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Companies</h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage your organization structure</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setFormName(''); setFormDesc(''); setShowCreateModal(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
            >
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              New Company
            </button>
          )}
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div style={{ color: '#71717A', textAlign: 'center', padding: '3rem' }}>Loading companies...</div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A' }}>
            <BuildingOfficeIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem' }}>No companies yet</p>
            {isAdmin && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Create your first company to get started.</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {companies.map((company) => (
              <div
                key={company.id}
                style={{
                  background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem',
                  padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => router.push(`/company/${company.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                    </div>
                    <div>
                      <h3 style={{ color: '#FFFFFF', fontSize: '1.0625rem', fontWeight: 600, margin: 0 }}>{company.name}</h3>
                      {company.description && (
                        <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{company.description}</p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedCompany(company); setMemberEmail(''); setMemberRole('member'); setSearchResults([]); setShowAddMemberModal(true); }}
                        style={{ padding: '0.375rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#3B82F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Add Member"
                      >
                        <UserPlusIcon style={{ width: '18px', height: '18px' }} />
                      </button>
                      <button
                        onClick={() => { setSelectedCompany(company); setFormName(company.name); setFormDesc(company.description); setShowEditModal(true); }}
                        style={{ padding: '0.375rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Edit"
                      >
                        <PencilSquareIcon style={{ width: '18px', height: '18px' }} />
                      </button>
                      <button
                        onClick={() => { setSelectedCompany(company); setShowDeleteModal(true); }}
                        style={{ padding: '0.375rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Delete"
                      >
                        <TrashIcon style={{ width: '18px', height: '18px' }} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                    <UsersIcon style={{ width: '14px', height: '14px' }} />
                    {company.member_count || 0} members
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.8125rem' }}>
                    <FolderIcon style={{ width: '14px', height: '14px' }} />
                    {company.dept_count || 0} departments
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Company Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowCreateModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Create Company</h3>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Company Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter company name" style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" rows={3} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreate} disabled={!formName.trim() || saving} style={{ padding: '0.625rem 1.25rem', background: formName.trim() ? '#10B981' : '#3D3D3D', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: formName.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Company Modal */}
        {showEditModal && selectedCompany && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowEditModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Edit Company</h3>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Company Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEditModal(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEdit} disabled={!formName.trim() || saving} style={{ padding: '0.625rem 1.25rem', background: '#10B981', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedCompany && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowDeleteModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '400px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Delete Company</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>{selectedCompany.name}</strong>? This will also remove all departments, members, and checklists. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#A1A1AA', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDelete} disabled={saving} style={{ padding: '0.625rem 1.25rem', background: '#EF4444', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && selectedCompany && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAddMemberModal(false)}>
            <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', border: '1px solid #2D2D2D' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Add Member to {selectedCompany.name}</h3>
                <button onClick={() => setShowAddMemberModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}><XMarkIcon style={{ width: '20px', height: '20px' }} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Search by Email</label>
                <input value={memberEmail} onChange={(e) => searchUserByEmail(e.target.value)} placeholder="Type email to search..." style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#A1A1AA', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#141414', border: '1px solid #3D3D3D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none' }}>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {/* Search Results */}
              {searching && <div style={{ color: '#71717A', fontSize: '0.8125rem', padding: '0.5rem 0' }}>Searching...</div>}
              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: '#141414', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                      <div>
                        <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{u.name}</div>
                        <div style={{ color: '#71717A', fontSize: '0.75rem' }}>{u.email}</div>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        disabled={saving}
                        style={{ padding: '0.375rem 0.75rem', background: '#10B981', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                      >
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
