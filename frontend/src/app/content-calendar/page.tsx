'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { Company, CompanyMember, COMPANY_ROLES } from '@/types/content-calendar-v3'

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  main: {
    flex: 1,
    marginLeft: '256px',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh'
  },
  mainMobile: {
    flex: 1,
    marginLeft: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh'
  },
  header: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    padding: '32px 40px',
    color: '#fff'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px'
  },
  headerSubtitle: {
    fontSize: '15px',
    opacity: 0.9,
    margin: 0
  },
  content: {
    flex: 1,
    padding: '32px 40px'
  },
  searchRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap' as const
  },
  searchInput: {
    flex: 1,
    minWidth: '280px',
    padding: '14px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    background: '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  },
  primaryBtn: {
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    whiteSpace: 'nowrap' as const
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px'
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardHeader: {
    padding: '24px',
    borderBottom: '1px solid #f1f5f9'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5
  },
  cardFooter: {
    padding: '16px 24px',
    background: '#f8fafc',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const
  },
  btnPrimary: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  btnSecondary: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  btnDanger: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '10px',
    border: '2px solid #fecaca',
    background: '#fef2f2',
    color: '#dc2626',
    cursor: 'pointer'
  },
  emptyState: {
    background: '#fff',
    borderRadius: '20px',
    padding: '80px 40px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '32px',
    color: '#4f46e5'
  },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    padding: '32px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 24px 0'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
    outline: 'none'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    resize: 'none' as const,
    boxSizing: 'border-box' as const,
    outline: 'none'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  }
}

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
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={isMobile ? styles.mainMobile : styles.main}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Content Calendar</h1>
          <p style={styles.headerSubtitle}>Manage your social media content across multiple companies</p>
        </header>

        <div style={styles.content}>
          <div style={styles.searchRow}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              style={styles.searchInput}
              onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            <button
              onClick={() => setShowCreateModal(true)}
              style={styles.primaryBtn}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)' }}
            >
              + New Company
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0' }}>
                {searchQuery ? 'No companies found' : 'No companies yet'}
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 28px 0', fontSize: '15px' }}>
                {searchQuery ? 'Try a different search term' : 'Create your first company to start managing content'}
              </p>
              {!searchQuery && (
                <button onClick={() => setShowCreateModal(true)} style={styles.primaryBtn}>
                  + Create Company
                </button>
              )}
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredCompanies.map(company => (
                <div
                  key={company.id}
                  style={styles.card}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                >
                  <div style={styles.cardHeader} onClick={() => router.push(`/content-calendar/${company.id}`)}>
                    <h3 style={styles.cardTitle}>{company.name}</h3>
                    {company.description && <p style={styles.cardDesc}>{company.description}</p>}
                  </div>
                  <div style={styles.cardFooter}>
                    <button onClick={() => router.push(`/content-calendar/${company.id}`)} style={styles.btnPrimary}>
                      Open Calendar
                    </button>
                    <button onClick={() => router.push(`/content-calendar/${company.id}/reports`)} style={styles.btnSecondary}>
                      Reports
                    </button>
                    <button onClick={() => openMembersModal(company)} style={styles.btnSecondary}>
                      Team
                    </button>
                    <button onClick={() => handleDeleteCompany(company.id)} style={styles.btnDanger}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div style={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Create Company</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name *</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                style={styles.textarea}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowCreateModal(false)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleCreateCompany} style={styles.primaryBtn}>Create Company</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCompany && (
        <div style={styles.modal} onClick={() => setShowMembersModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Team Members</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '-16px 0 24px 0' }}>{selectedCompany.name}</p>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 16px 0' }}>Add Member</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  style={{ ...styles.input, padding: '12px' }}
                >
                  <option value="">Select member</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={String(m.id)}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  style={{ ...styles.input, padding: '12px' }}
                >
                  {COMPANY_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button onClick={handleAddMember} style={{ ...styles.primaryBtn, padding: '12px 24px' }}>
                  Add
                </button>
              </div>
            </div>

            {members.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>No members yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{member.user_name || 'Unknown'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{member.user_email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: member.role === 'OWNER' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f1f5f9', color: member.role === 'OWNER' ? '#1d4ed8' : '#475569' }}>
                        {member.role}
                      </span>
                      <button onClick={() => handleRemoveMember(member.id)} style={styles.btnDanger}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.modalFooter}>
              <button onClick={() => setShowMembersModal(false)} style={styles.btnSecondary}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
