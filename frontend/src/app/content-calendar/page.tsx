'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { Company, CompanyMember, COMPANY_ROLES } from '@/types/content-calendar-v3'

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [teamMembers, setTeamMembers] = useState<{id: number, name: string, email: string}[]>([])
  
  const [companyForm, setCompanyForm] = useState({ name: '', description: '' })
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'EDITOR', team_function: '' })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const fetchCompanies = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setCompanies(data || [])
    } catch (err) {
      console.error('Error fetching companies:', err)
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchTeamMembers = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('auth_user').select('id, name, email').order('name')
      if (data) setTeamMembers(data)
    } catch (err) {
      console.error('Error:', err)
    }
  }, [])

  const fetchMembers = useCallback(async (companyId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at')
      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error:', err)
      setMembers([])
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchCompanies()
      fetchTeamMembers()
    }
  }, [user?.id, fetchCompanies, fetchTeamMembers])

  const handleCreateCompany = async () => {
    if (!companyForm.name.trim()) {
      alert('Enter company name')
      return
    }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyForm.name,
          description: companyForm.description,
          created_by: String(user?.id)
        })
        .select()
        .single()
      if (error) throw error
      
      // Add current user as OWNER
      await supabase.from('company_members').insert({
        company_id: data.id,
        user_id: String(user?.id),
        user_name: user?.name || user?.email,
        user_email: user?.email,
        role: 'OWNER',
        can_manage_members: true
      })
      
      setCompanies(prev => [...prev, data])
      setShowCreateModal(false)
      setCompanyForm({ name: '', description: '' })
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Delete this company and all its content?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('companies').delete().eq('id', id)
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleAddMember = async () => {
    if (!selectedCompany || !memberForm.user_id) {
      alert('Select a team member')
      return
    }
    const selectedUser = teamMembers.find(m => String(m.id) === memberForm.user_id)
    if (!selectedUser) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('company_members').insert({
        company_id: selectedCompany.id,
        user_id: memberForm.user_id,
        user_name: selectedUser.name,
        user_email: selectedUser.email,
        role: memberForm.role,
        team_function: memberForm.team_function || null,
        can_manage_members: memberForm.role === 'OWNER' || memberForm.role === 'MANAGER'
      })
      if (error) throw error
      fetchMembers(selectedCompany.id)
      setMemberForm({ user_id: '', role: 'EDITOR', team_function: '' })
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('company_members').delete().eq('id', memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const openMembersModal = (company: Company) => {
    setSelectedCompany(company)
    fetchMembers(company.id)
    setShowMembersModal(true)
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Content Calendar</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Select a company to manage content</p>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Search and Create */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies..."
                style={{ flex: 1, minWidth: '200px', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              />
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + New Company
              </button>
            </div>

            {/* Companies Grid */}
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>--</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
                  {searchQuery ? 'No companies found' : 'No companies yet'}
                </h3>
                <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
                  {searchQuery ? 'Try a different search term' : 'Create your first company to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
                  >
                    + Create Company
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredCompanies.map(company => (
                  <div
                    key={company.id}
                    style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}
                  >
                    <div
                      onClick={() => router.push(`/content-calendar/${company.id}`)}
                      style={{ padding: '20px', cursor: 'pointer' }}
                    >
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>{company.name}</h3>
                      {company.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{company.description}</p>
                      )}
                    </div>
                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => router.push(`/content-calendar/${company.id}`)}
                        style={{ flex: 1, padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
                      >
                        Open Calendar
                      </button>
                      <button
                        onClick={() => router.push(`/content-calendar/${company.id}/reports`)}
                        style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
                      >
                        Reports
                      </button>
                      <button
                        onClick={() => openMembersModal(company)}
                        style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
                      >
                        Team
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 20px 0' }}>Create Company</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Company Name *</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateCompany} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCompany && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowMembersModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Team Members</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>{selectedCompany.name}</p>

            {/* Add Member Form */}
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>Add Member</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="">Select member</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={String(m.id)}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                >
                  {COMPANY_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Members List */}
            {members.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No members yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{member.user_name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.user_email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', background: member.role === 'OWNER' ? '#dbeafe' : '#f3f4f6', color: member.role === 'OWNER' ? '#1d4ed8' : '#374151' }}>
                        {member.role}
                      </span>
                      {member.team_function && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{member.team_function}</span>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setShowMembersModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
