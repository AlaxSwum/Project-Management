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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      <MobileHeader title="Content Calendar" isMobile={isMobile} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #F5F5ED; }
        .cc-container { min-height: 100vh; display: flex; background: #F5F5ED; }
        .cc-main { flex: 1; margin-left: ${isMobile ? '0' : '256px'}; background: #F5F5ED; padding-top: ${isMobile ? '70px' : '0'}; }
        .cc-header { background: transparent; padding: 2rem; margin-bottom: 1rem; }
        .cc-title { font-size: 2.5rem; font-weight: 300; color: #1a1a1a; margin: 0; letter-spacing: -0.02em; }
        .cc-subtitle { font-size: 1rem; color: #666; margin-top: 0.5rem; font-weight: 400; }
        .cc-search-row { display: flex; gap: 1rem; padding: 0 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .cc-search { flex: 1; min-width: 280px; padding: 1rem 1.25rem; border: 1px solid #e8e8e8; border-radius: 12px; font-size: 1rem; background: #fff; transition: all 0.2s; outline: none; }
        .cc-search:focus { border-color: #C483D9; box-shadow: 0 0 0 3px rgba(196, 131, 217, 0.1); }
        .cc-btn-primary { padding: 1rem 1.75rem; font-size: 0.95rem; font-weight: 500; border-radius: 12px; border: none; background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 14px rgba(196, 131, 217, 0.3); }
        .cc-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(196, 131, 217, 0.4); }
        .cc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; padding: 0 2rem 2rem; }
        .cc-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 20px; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04); }
        .cc-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border-color: #C483D9; }
        .cc-card-header { padding: 1.75rem; cursor: pointer; }
        .cc-card-title { font-size: 1.25rem; font-weight: 500; color: #1a1a1a; margin: 0 0 0.5rem 0; }
        .cc-card-desc { font-size: 0.9rem; color: #666; margin: 0; line-height: 1.5; }
        .cc-card-footer { padding: 1rem 1.75rem; background: #fafafa; border-top: 1px solid #f0f0f0; display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .cc-btn-card { flex: 1; padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 500; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s; }
        .cc-btn-open { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .cc-btn-secondary { background: #fff; border: 1px solid #e8e8e8; color: #333; }
        .cc-btn-secondary:hover { border-color: #C483D9; background: #fafafa; }
        .cc-btn-danger { background: #fff5f5; border: 1px solid #fed7d7; color: #c53030; }
        .cc-btn-danger:hover { background: #fed7d7; }
        .cc-empty { background: #fff; border-radius: 24px; padding: 4rem 2rem; text-align: center; margin: 0 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .cc-empty-icon { width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, #f0e6f5 0%, #e6f0ff 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .cc-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); }
        .cc-modal-content { background: #fff; border-radius: 24px; width: 100%; max-width: 520px; padding: 2rem; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2); }
        .cc-modal-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0 0 1.5rem 0; }
        .cc-form-group { margin-bottom: 1.25rem; }
        .cc-label { display: block; font-size: 0.9rem; font-weight: 500; color: #333; margin-bottom: 0.5rem; }
        .cc-input { width: 100%; padding: 0.875rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; font-size: 1rem; transition: all 0.2s; box-sizing: border-box; outline: none; }
        .cc-input:focus { border-color: #C483D9; box-shadow: 0 0 0 3px rgba(196, 131, 217, 0.1); }
        .cc-textarea { width: 100%; padding: 0.875rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; font-size: 1rem; resize: none; box-sizing: border-box; outline: none; }
        .cc-textarea:focus { border-color: #C483D9; }
        .cc-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f0f0; }
      `}} />

      <div className="cc-container">
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

        <main className="cc-main">
          <header className="cc-header">
            <h1 className="cc-title">Content Calendar</h1>
            <p className="cc-subtitle">Manage your social media content across multiple companies</p>
          </header>

          <div className="cc-search-row">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search companies..." className="cc-search" />
            <button onClick={() => setShowCreateModal(true)} className="cc-btn-primary">+ New Company</button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="cc-empty">
              <div className="cc-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C483D9" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.75rem 0' }}>
                {searchQuery ? 'No companies found' : 'No companies yet'}
              </h3>
              <p style={{ color: '#666', margin: '0 0 1.75rem 0' }}>
                {searchQuery ? 'Try a different search term' : 'Create your first company to start managing content'}
              </p>
              {!searchQuery && <button onClick={() => setShowCreateModal(true)} className="cc-btn-primary">+ Create Company</button>}
            </div>
          ) : (
            <div className="cc-grid">
              {filteredCompanies.map(company => (
                <div key={company.id} className="cc-card">
                  <div className="cc-card-header" onClick={() => router.push(`/content-calendar/${company.id}`)}>
                    <h3 className="cc-card-title">{company.name}</h3>
                    {company.description && <p className="cc-card-desc">{company.description}</p>}
                  </div>
                  <div className="cc-card-footer">
                    <button onClick={() => router.push(`/content-calendar/${company.id}`)} className="cc-btn-card cc-btn-open">Calendar</button>
                    <button onClick={() => router.push(`/content-calendar/${company.id}/reports`)} className="cc-btn-card cc-btn-secondary">Reports</button>
                    <button onClick={() => openMembersModal(company)} className="cc-btn-card cc-btn-secondary">Team</button>
                    <button onClick={() => handleDeleteCompany(company.id)} className="cc-btn-card cc-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="cc-modal" onClick={() => setShowCreateModal(false)}>
          <div className="cc-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="cc-modal-title">Create Company</h3>
            
            <div className="cc-form-group">
              <label className="cc-label">Company Name *</label>
              <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="Enter company name" className="cc-input" />
            </div>

            <div className="cc-form-group">
              <label className="cc-label">Description</label>
              <textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} placeholder="Optional description" rows={3} className="cc-textarea" />
            </div>

            <div className="cc-modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="cc-btn-card cc-btn-secondary">Cancel</button>
              <button onClick={handleCreateCompany} className="cc-btn-primary">Create Company</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCompany && (
        <div className="cc-modal" onClick={() => setShowMembersModal(false)}>
          <div className="cc-modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="cc-modal-title">Team Members</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '-1rem 0 1.5rem 0' }}>{selectedCompany.name}</p>

            <div style={{ background: '#fafafa', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 500, color: '#333', margin: '0 0 1rem 0' }}>Add Member</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem' }}>
                <select value={memberForm.user_id} onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })} className="cc-input" style={{ padding: '0.75rem' }}>
                  <option value="">Select member</option>
                  {teamMembers.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                </select>
                <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} className="cc-input" style={{ padding: '0.75rem' }}>
                  {COMPANY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={handleAddMember} className="cc-btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Add</button>
              </div>
            </div>

            {members.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>No members yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {members.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#fafafa', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{member.user_name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{member.user_email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '20px', background: member.role === 'OWNER' ? 'linear-gradient(135deg, #e6f0ff 0%, #f0e6f5 100%)' : '#f0f0f0', color: member.role === 'OWNER' ? '#5884FD' : '#666' }}>{member.role}</span>
                      <button onClick={() => handleRemoveMember(member.id)} className="cc-btn-card cc-btn-danger" style={{ padding: '0.5rem 0.875rem' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cc-modal-footer">
              <button onClick={() => setShowMembersModal(false)} className="cc-btn-card cc-btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
