'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { Company, CompanyMember, COMPANY_ROLES } from '@/types/content-calendar-v3'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  TrashIcon,
  ChartBarIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'

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
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  const fetchCompanies = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').select('*').eq('is_active', true).order('name')
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
    } catch (err) { console.error('Error:', err) }
  }, [])

  const fetchMembers = useCallback(async (companyId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('company_members').select('*').eq('company_id', companyId).order('created_at')
      if (error) throw error
      setMembers(data || [])
    } catch (err) { console.error('Error:', err); setMembers([]) }
  }, [])

  useEffect(() => { if (user?.id) { fetchCompanies(); fetchTeamMembers() } }, [user?.id, fetchCompanies, fetchTeamMembers])

  const handleCreateCompany = async () => {
    if (!companyForm.name.trim()) { alert('Enter company name'); return }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').insert({ name: companyForm.name, description: companyForm.description, created_by: String(user?.id) }).select().single()
      if (error) throw error
      await supabase.from('company_members').insert({ company_id: data.id, user_id: String(user?.id), user_name: user?.name || user?.email, user_email: user?.email, role: 'OWNER', can_manage_members: true })
      setCompanies(prev => [...prev, data])
      setShowCreateModal(false)
      setCompanyForm({ name: '', description: '' })
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Delete this company and all its content?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('companies').delete().eq('id', id)
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleAddMember = async () => {
    if (!selectedCompany || !memberForm.user_id) { alert('Select a team member'); return }
    const selectedUser = teamMembers.find(m => String(m.id) === memberForm.user_id)
    if (!selectedUser) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('company_members').insert({ company_id: selectedCompany.id, user_id: memberForm.user_id, user_name: selectedUser.name, user_email: selectedUser.email, role: memberForm.role, team_function: memberForm.team_function || null, can_manage_members: memberForm.role === 'OWNER' || memberForm.role === 'MANAGER' })
      if (error) throw error
      fetchMembers(selectedCompany.id)
      setMemberForm({ user_id: '', role: 'EDITOR', team_function: '' })
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('company_members').delete().eq('id', memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const openMembersModal = (company: Company) => { setSelectedCompany(company); fetchMembers(company.id); setShowMembersModal(true) }
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())))

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #2D2D2D', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )

    return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D' }}>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
      <MobileHeader title="Content Calendar" isMobile={isMobile} />
      
      <main className="page-main" style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : '280px', 
        background: '#0D0D0D',
        paddingTop: isMobile ? '70px' : 0
      }}>
        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid #1F1F1F' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Content Calendar</h1>
          <p style={{ color: '#71717A', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            Manage your social media content across multiple companies
          </p>
        </div>

        {/* Search and Actions */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#52525B' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 3rem',
                background: '#141414',
                border: '1px solid #2D2D2D',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#2D2D2D'}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            <PlusIcon style={{ width: '20px', height: '20px' }} />
            New Company
          </button>
            </div>
            
        {/* Content */}
        <div style={{ padding: '0 2rem 2rem' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #2D2D2D', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ 
              background: '#141414', 
              borderRadius: '1rem', 
              padding: '4rem 2rem', 
              textAlign: 'center',
              border: '1px solid #1F1F1F'
            }}>
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '1rem', 
                background: '#1F1F1F', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem' 
              }}>
                <BuildingOffice2Icon style={{ width: '32px', height: '32px', color: '#3B82F6' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                {searchQuery ? 'No companies found' : 'No companies yet'}
              </h3>
              <p style={{ color: '#71717A', margin: '0 0 1.5rem 0' }}>
                {searchQuery ? 'Try a different search term' : 'Create your first company to start managing content'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon style={{ width: '18px', height: '18px' }} />
                  Create Company
                </button>
              )}
                </div>
              ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
              gap: '1.25rem' 
            }}>
              {filteredCompanies.map(company => (
                <div 
                  key={company.id} 
                  style={{ 
                    background: '#141414', 
                    border: '1px solid #1F1F1F', 
                    borderRadius: '1rem', 
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2D2D2D';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1F1F1F';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Card Header */}
                  <div 
                    style={{ padding: '1.5rem', cursor: 'pointer' }}
                    onClick={() => router.push(`/content-calendar/${company.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '0.75rem', 
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.25rem' }}>
                          {company.name.charAt(0).toUpperCase()}
                        </span>
                        </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 600, 
                          color: '#FFFFFF', 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          {company.name}
                        </h3>
                        {company.description && (
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: '#71717A', 
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {company.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: '#0D0D0D', 
                    borderTop: '1px solid #1F1F1F',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => router.push(`/content-calendar/${company.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: '#3B82F6',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                      Calendar
                    </button>
                    <button
                      onClick={() => router.push(`/content-calendar/${company.id}/reports`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: '#1F1F1F',
                        color: '#E4E4E7',
                        border: '1px solid #2D2D2D',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      <ChartBarIcon style={{ width: '16px', height: '16px' }} />
                      Reports
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openMembersModal(company); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: '#1F1F1F',
                        color: '#E4E4E7',
                        border: '1px solid #2D2D2D',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                      Team
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: 'transparent',
                        color: '#EF4444',
                        border: '1px solid #3D2D2D',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      <TrashIcon style={{ width: '16px', height: '16px' }} />
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
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            style={{ 
              background: '#141414', 
              border: '1px solid #2D2D2D',
              borderRadius: '1rem', 
              width: '100%', 
              maxWidth: '500px', 
              padding: '1.5rem',
              margin: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0' }}>
              Create Company
            </h3>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#E4E4E7', marginBottom: '0.5rem' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#0D0D0D',
                  border: '1px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#2D2D2D'}
              />
          </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#E4E4E7', marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#0D0D0D',
                  border: '1px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#2D2D2D'}
              />
              </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #1F1F1F' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  color: '#A1A1AA',
                  border: '1px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompany}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create Company
              </button>
            </div>
                </div>
                </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCompany && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowMembersModal(false)}
        >
          <div 
            style={{ 
              background: '#141414', 
              border: '1px solid #2D2D2D',
              borderRadius: '1rem', 
              width: '100%', 
              maxWidth: '600px', 
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '1.5rem',
              margin: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0' }}>
              Team Members - {selectedCompany.name}
            </h3>

            {/* Add Member Form */}
            <div style={{ 
              background: '#0D0D0D', 
              borderRadius: '0.75rem', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              border: '1px solid #1F1F1F'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem' }}>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Select member</option>
                  {teamMembers.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                        </select>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                >
                  {COMPANY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                <button
                  onClick={handleAddMember}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                    </div>
                    </div>

            {/* Members List */}
                {members.length === 0 ? (
              <p style={{ color: '#71717A', textAlign: 'center', padding: '2rem' }}>No members yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {members.map(member => (
                  <div 
                    key={member.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '1rem', 
                      background: '#0D0D0D', 
                      borderRadius: '0.75rem',
                      border: '1px solid #1F1F1F'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        {(member.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    <div>
                        <div style={{ fontWeight: 500, color: '#FFFFFF' }}>{member.user_name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#71717A' }}>{member.user_email}</div>
                      </div>
                          </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.375rem 0.75rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 500, 
                        borderRadius: '9999px', 
                        background: member.role === 'OWNER' ? '#3B82F620' : '#1F1F1F', 
                        color: member.role === 'OWNER' ? '#3B82F6' : '#A1A1AA' 
                      }}>
                        {member.role}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'transparent',
                          color: '#EF4444',
                          border: '1px solid #3D2D2D',
                          borderRadius: '0.5rem',
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1F1F1F' }}>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#1F1F1F',
                  color: '#E4E4E7',
                  border: '1px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
            </div>
  )
}
