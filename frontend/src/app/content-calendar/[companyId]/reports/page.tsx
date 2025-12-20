'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { Company, Platform, PLATFORMS, PLATFORM_COLORS } from '@/types/content-calendar-v3'

interface MonthlyKPI {
  id?: string
  platform: Platform
  report_month: string
  start_followers: number
  end_followers: number
  net_growth: number
  total_reach: number
  total_impressions_views: number
  total_engagement_interactions: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_posts: number
  notes: string
}

interface WeeklyKPI {
  id?: string
  platform: Platform
  year: number
  month: number
  week_number: number
  week_start: string
  week_end: string
  start_followers: number
  end_followers: number
  followers_gained: number
  followers_lost: number
  net_growth: number
  total_reach: number
  total_impressions: number
  total_engagement: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_saves: number
  posts_published: number
  notes: string
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const companyId = params?.companyId as string || ''

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('facebook')
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  
  const [monthlyData, setMonthlyData] = useState<MonthlyKPI[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyKPI[]>([])
  
  const [showModal, setShowModal] = useState(false)
  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  
  const [monthForm, setMonthForm] = useState<MonthlyKPI>({
    platform: 'facebook', report_month: '', start_followers: 0, end_followers: 0, net_growth: 0,
    total_reach: 0, total_impressions_views: 0, total_engagement_interactions: 0,
    total_likes: 0, total_comments: 0, total_shares: 0, total_posts: 0, notes: ''
  })
  
  const [weekForm, setWeekForm] = useState<WeeklyKPI>({
    platform: 'facebook', year: 2024, month: 1, week_number: 1, week_start: '', week_end: '',
    start_followers: 0, end_followers: 0, followers_gained: 0, followers_lost: 0, net_growth: 0,
    total_reach: 0, total_impressions: 0, total_engagement: 0, total_likes: 0, total_comments: 0,
    total_shares: 0, total_saves: 0, posts_published: 0, notes: ''
  })

  useEffect(() => { const checkMobile = () => setIsMobile(window.innerWidth < 768); checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile) }, [])
  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/login') }, [authLoading, isAuthenticated, router])

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (error) throw error
      setCompany(data)
    } catch { router.push('/content-calendar') }
  }, [companyId, router])

  const fetchMonthlyData = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_kpi_overview').select('*').eq('company_id', companyId).eq('platform', selectedPlatform).order('report_month', { ascending: true })
      setMonthlyData(data || [])
    } catch (err) { console.error('Error:', err) }
  }, [companyId, selectedPlatform])

  const fetchWeeklyData = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_weekly_kpi').select('*').eq('company_id', companyId).eq('platform', selectedPlatform).eq('year', selectedYear).order('month', { ascending: true }).order('week_number', { ascending: true })
      setWeeklyData(data || [])
    } catch (err) { console.error('Error:', err) }
  }, [companyId, selectedPlatform, selectedYear])

  useEffect(() => {
    if (user?.id && companyId) {
      fetchCompany()
      setIsLoading(false)
    }
  }, [user?.id, companyId, fetchCompany])

  useEffect(() => {
    if (companyId && selectedPlatform) {
      fetchMonthlyData()
      fetchWeeklyData()
    }
  }, [companyId, selectedPlatform, selectedYear, fetchMonthlyData, fetchWeeklyData])

  const openMonthModal = (monthNum: number) => {
    const existing = monthlyData.find(d => {
      const date = new Date(d.report_month)
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === monthNum
    })
    const monthStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}-01`
    
    if (existing) {
      setMonthForm({ ...existing, platform: selectedPlatform })
    } else {
      setMonthForm({
        platform: selectedPlatform, report_month: monthStr, start_followers: 0, end_followers: 0, net_growth: 0,
        total_reach: 0, total_impressions_views: 0, total_engagement_interactions: 0,
        total_likes: 0, total_comments: 0, total_shares: 0, total_posts: 0, notes: ''
      })
    }
    setEditingMonth(monthNum)
    setShowModal(true)
  }

  const openWeekModal = (monthNum: number, weekNum: number) => {
    const existing = weeklyData.find(d => d.month === monthNum && d.week_number === weekNum)
    
    if (existing) {
      setWeekForm({ ...existing, platform: selectedPlatform })
    } else {
      setWeekForm({
        platform: selectedPlatform, year: selectedYear, month: monthNum, week_number: weekNum,
        week_start: '', week_end: '', start_followers: 0, end_followers: 0, followers_gained: 0,
        followers_lost: 0, net_growth: 0, total_reach: 0, total_impressions: 0, total_engagement: 0,
        total_likes: 0, total_comments: 0, total_shares: 0, total_saves: 0, posts_published: 0, notes: ''
      })
    }
    setEditingWeek(weekNum)
    setEditingMonth(monthNum)
    setShowModal(true)
  }

  const saveMonthlyKPI = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const monthStr = `${selectedYear}-${String(editingMonth).padStart(2, '0')}-01`
      const data = { ...monthForm, company_id: companyId, platform: selectedPlatform, report_month: monthStr }
      
      const existing = monthlyData.find(d => {
        const date = new Date(d.report_month)
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === editingMonth
      })
      
      if (existing?.id) {
        await supabase.from('company_kpi_overview').update(data).eq('id', existing.id)
      } else {
        await supabase.from('company_kpi_overview').insert(data)
      }
      setShowModal(false)
      fetchMonthlyData()
      alert('Monthly KPI saved!')
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const saveWeeklyKPI = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const data = { ...weekForm, company_id: companyId, platform: selectedPlatform, year: selectedYear, month: editingMonth, week_number: editingWeek }
      
      const existing = weeklyData.find(d => d.month === editingMonth && d.week_number === editingWeek)
      
      if (existing?.id) {
        await supabase.from('company_weekly_kpi').update(data).eq('id', existing.id)
      } else {
        await supabase.from('company_weekly_kpi').insert(data)
      }
      setShowModal(false)
      fetchWeeklyData()
      alert('Weekly KPI saved!')
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const getMonthData = (monthNum: number) => {
    return monthlyData.find(d => {
      const date = new Date(d.report_month)
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === monthNum
    })
  }

  const getWeeksForMonth = (monthNum: number) => {
    return weeklyData.filter(d => d.month === monthNum).sort((a, b) => a.week_number - b.week_number)
  }

  const yearlyTotals = useMemo(() => {
    return monthlyData.reduce((acc, d) => {
      const date = new Date(d.report_month)
      if (date.getFullYear() === selectedYear) {
        acc.reach += d.total_reach || 0
        acc.engagement += d.total_engagement_interactions || 0
        acc.likes += d.total_likes || 0
        acc.followers += d.net_growth || 0
        acc.posts += d.total_posts || 0
      }
      return acc
    }, { reach: 0, engagement: 0, likes: 0, followers: 0, posts: 0 })
  }, [monthlyData, selectedYear])

  const maxEngagement = useMemo(() => Math.max(...monthlyData.filter(d => new Date(d.report_month).getFullYear() === selectedYear).map(d => d.total_engagement_interactions || 0), 1), [monthlyData, selectedYear])

  if (authLoading || !company) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div>
      <MobileHeader title={company.name} isMobile={isMobile} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F5ED; }
        .rpt-container { min-height: 100vh; display: flex; background: #F5F5ED; }
        .rpt-main { flex: 1; margin-left: ${isMobile ? '0' : '256px'}; background: #F5F5ED; padding-top: ${isMobile ? '70px' : '0'}; }
        .rpt-header { padding: 1.5rem 2rem; background: #fff; border-bottom: 1px solid #e8e8e8; }
        .rpt-header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; }
        .rpt-nav { display: flex; align-items: center; gap: 1rem; }
        .rpt-back { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; cursor: pointer; }
        .rpt-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .rpt-subtitle { font-size: 0.85rem; color: #666; margin: 0.25rem 0 0 0; }
        .rpt-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .rpt-year-select { padding: 0.5rem 1rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.9rem; }
        .rpt-platforms { display: flex; gap: 0.5rem; }
        .rpt-platform-btn { padding: 0.625rem 1.25rem; font-size: 0.85rem; font-weight: 500; border: 2px solid transparent; border-radius: 10px; cursor: pointer; text-transform: capitalize; transition: all 0.2s; }
        .rpt-toggle { display: flex; background: #f5f5f5; border-radius: 8px; padding: 4px; }
        .rpt-toggle-btn { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #666; }
        .rpt-toggle-btn.active { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .rpt-content { padding: 1.5rem 2rem; }
        .rpt-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .rpt-stat { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1.25rem; text-align: center; }
        .rpt-stat-value { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
        .rpt-stat-label { font-size: 0.75rem; color: #666; text-transform: uppercase; }
        .rpt-months-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .rpt-month-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; }
        .rpt-month-header { padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .rpt-month-name { font-size: 1rem; font-weight: 500; color: #1a1a1a; }
        .rpt-month-edit { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 6px; background: #fff; cursor: pointer; }
        .rpt-month-body { padding: 1rem 1.25rem; }
        .rpt-month-metrics { display: flex; flex-direction: column; gap: 0.75rem; }
        .rpt-metric { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
        .rpt-metric-label { color: #666; }
        .rpt-metric-value { font-weight: 600; color: #1a1a1a; }
        .rpt-bar { height: 8px; background: #f0f0f0; border-radius: 4px; margin-top: 0.75rem; overflow: hidden; }
        .rpt-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .rpt-weeks { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; }
        .rpt-weeks-title { font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.75rem; }
        .rpt-weeks-grid { display: flex; gap: 0.5rem; }
        .rpt-week-btn { flex: 1; padding: 0.5rem; font-size: 0.75rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 6px; background: #fafafa; cursor: pointer; text-align: center; }
        .rpt-week-btn.has-data { background: #f0f7ff; border-color: #5884FD; color: #5884FD; }
        .rpt-empty { padding: 3rem 1.5rem; text-align: center; color: #666; }
        .rpt-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); }
        .rpt-modal-content { background: #fff; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; overflow: auto; }
        .rpt-modal-header { padding: 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; }
        .rpt-modal-title { font-size: 1.25rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .rpt-modal-close { background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; }
        .rpt-modal-body { padding: 1.5rem; }
        .rpt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .rpt-form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .rpt-label { font-size: 0.8rem; font-weight: 500; color: #333; }
        .rpt-input { padding: 0.625rem 0.875rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.9rem; }
        .rpt-modal-footer { padding: 1.5rem; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 0.75rem; }
        .rpt-btn { padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 500; border-radius: 10px; cursor: pointer; }
        .rpt-btn-secondary { background: #fff; border: 1px solid #e8e8e8; color: #333; }
        .rpt-btn-primary { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); border: none; color: #fff; }
      `}} />

      <div className="rpt-container">
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <main className="rpt-main">
          <header className="rpt-header">
            <div className="rpt-header-top">
              <div className="rpt-nav">
                <button onClick={() => router.push(`/content-calendar/${companyId}`)} className="rpt-back">Back</button>
                <div>
                  <h1 className="rpt-title">{company.name}</h1>
                  <p className="rpt-subtitle">Social Media Performance Reports</p>
                </div>
              </div>
              <div className="rpt-controls">
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rpt-year-select">
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="rpt-toggle">
                  <button onClick={() => setViewMode('monthly')} className={`rpt-toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}>Monthly</button>
                  <button onClick={() => setViewMode('weekly')} className={`rpt-toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}>Weekly</button>
                </div>
              </div>
            </div>
            <div className="rpt-platforms">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setSelectedPlatform(p)} className="rpt-platform-btn" style={{ background: selectedPlatform === p ? PLATFORM_COLORS[p] : '#f5f5f5', color: selectedPlatform === p ? '#fff' : '#333', borderColor: PLATFORM_COLORS[p] }}>{p}</button>
              ))}
            </div>
          </header>

          <div className="rpt-content">
            {/* Year Stats */}
            <div className="rpt-stats">
              {[
                { label: 'Total Reach', value: yearlyTotals.reach, color: '#5884FD' },
                { label: 'Total Engagement', value: yearlyTotals.engagement, color: '#C483D9' },
                { label: 'Total Likes', value: yearlyTotals.likes, color: '#ec4899' },
                { label: 'Followers Gained', value: yearlyTotals.followers, color: '#10b981' },
                { label: 'Posts Published', value: yearlyTotals.posts, color: '#f59e0b' }
              ].map(stat => (
                <div key={stat.label} className="rpt-stat">
                  <div className="rpt-stat-value" style={{ color: stat.color }}>{stat.value.toLocaleString()}</div>
                  <div className="rpt-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Months Grid */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#1a1a1a', margin: 0, textTransform: 'capitalize' }}>{selectedPlatform} - {selectedYear} {viewMode === 'weekly' ? '(Weekly View)' : '(Monthly View)'}</h2>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>12 Months</span>
            </div>
            <div className="rpt-months-grid">
              {MONTHS.map((monthName, idx) => {
                const monthNum = idx + 1
                const data = getMonthData(monthNum)
                const weeks = getWeeksForMonth(monthNum)
                const engagement = data?.total_engagement_interactions || 0
                
                return (
                  <div key={monthName} className="rpt-month-card">
                    <div className="rpt-month-header">
                      <span className="rpt-month-name">{monthName}</span>
                      <button onClick={() => openMonthModal(monthNum)} className="rpt-month-edit">{data ? 'Edit' : 'Add'}</button>
                    </div>
                    <div className="rpt-month-body">
                      {data ? (
                        <>
                          <div className="rpt-month-metrics">
                            <div className="rpt-metric">
                              <span className="rpt-metric-label">Followers</span>
                              <span className="rpt-metric-value" style={{ color: (data.net_growth || 0) >= 0 ? '#10b981' : '#ef4444' }}>{data.net_growth >= 0 ? '+' : ''}{(data.net_growth || 0).toLocaleString()}</span>
                            </div>
                            <div className="rpt-metric">
                              <span className="rpt-metric-label">Engagement</span>
                              <span className="rpt-metric-value">{(data.total_engagement_interactions || 0).toLocaleString()}</span>
                            </div>
                            <div className="rpt-metric">
                              <span className="rpt-metric-label">Reach</span>
                              <span className="rpt-metric-value">{(data.total_reach || 0).toLocaleString()}</span>
                            </div>
                            <div className="rpt-metric">
                              <span className="rpt-metric-label">Likes</span>
                              <span className="rpt-metric-value">{(data.total_likes || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="rpt-bar">
                            <div className="rpt-bar-fill" style={{ width: `${(engagement / maxEngagement) * 100}%`, background: PLATFORM_COLORS[selectedPlatform] }} />
                          </div>
                        </>
                      ) : (
                        <div className="rpt-empty" style={{ padding: '1rem', fontSize: '0.85rem' }}>No data yet</div>
                      )}
                      
                      {viewMode === 'weekly' && (
                        <div className="rpt-weeks">
                          <div className="rpt-weeks-title">Weekly Data</div>
                          <div className="rpt-weeks-grid">
                            {[1, 2, 3, 4, 5].map(weekNum => {
                              const weekData = weeks.find(w => w.week_number === weekNum)
                              return (
                                <button key={weekNum} onClick={() => openWeekModal(monthNum, weekNum)} className={`rpt-week-btn ${weekData ? 'has-data' : ''}`}>
                                  W{weekNum}
                                  {weekData && <div style={{ fontSize: '0.65rem', marginTop: '2px' }}>+{weekData.net_growth || 0}</div>}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="rpt-modal" onClick={() => { setShowModal(false); setEditingWeek(null) }}>
          <div className="rpt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3 className="rpt-modal-title">
                {editingWeek ? `${MONTHS[editingMonth! - 1]} Week ${editingWeek}` : MONTHS[editingMonth! - 1]} - {selectedPlatform}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingWeek(null) }} className="rpt-modal-close">x</button>
            </div>
            <div className="rpt-modal-body">
              {editingWeek ? (
                // Weekly Form
                <>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Week Start Date</label><input type="date" value={weekForm.week_start} onChange={(e) => setWeekForm({ ...weekForm, week_start: e.target.value })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Week End Date</label><input type="date" value={weekForm.week_end} onChange={(e) => setWeekForm({ ...weekForm, week_end: e.target.value })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Start Followers</label><input type="number" value={weekForm.start_followers} onChange={(e) => setWeekForm({ ...weekForm, start_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">End Followers</label><input type="number" value={weekForm.end_followers} onChange={(e) => setWeekForm({ ...weekForm, end_followers: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Followers Gained</label><input type="number" value={weekForm.followers_gained} onChange={(e) => setWeekForm({ ...weekForm, followers_gained: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Followers Lost</label><input type="number" value={weekForm.followers_lost} onChange={(e) => setWeekForm({ ...weekForm, followers_lost: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Net Growth</label><input type="number" value={weekForm.net_growth} onChange={(e) => setWeekForm({ ...weekForm, net_growth: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Posts Published</label><input type="number" value={weekForm.posts_published} onChange={(e) => setWeekForm({ ...weekForm, posts_published: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Reach</label><input type="number" value={weekForm.total_reach} onChange={(e) => setWeekForm({ ...weekForm, total_reach: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Impressions</label><input type="number" value={weekForm.total_impressions} onChange={(e) => setWeekForm({ ...weekForm, total_impressions: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Engagement</label><input type="number" value={weekForm.total_engagement} onChange={(e) => setWeekForm({ ...weekForm, total_engagement: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Likes</label><input type="number" value={weekForm.total_likes} onChange={(e) => setWeekForm({ ...weekForm, total_likes: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Comments</label><input type="number" value={weekForm.total_comments} onChange={(e) => setWeekForm({ ...weekForm, total_comments: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Shares</label><input type="number" value={weekForm.total_shares} onChange={(e) => setWeekForm({ ...weekForm, total_shares: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                </>
              ) : (
                // Monthly Form
                <>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Start Followers</label><input type="number" value={monthForm.start_followers} onChange={(e) => setMonthForm({ ...monthForm, start_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">End Followers</label><input type="number" value={monthForm.end_followers} onChange={(e) => setMonthForm({ ...monthForm, end_followers: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Net Growth</label><input type="number" value={monthForm.net_growth} onChange={(e) => setMonthForm({ ...monthForm, net_growth: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Posts</label><input type="number" value={monthForm.total_posts} onChange={(e) => setMonthForm({ ...monthForm, total_posts: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Reach</label><input type="number" value={monthForm.total_reach} onChange={(e) => setMonthForm({ ...monthForm, total_reach: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Impressions</label><input type="number" value={monthForm.total_impressions_views} onChange={(e) => setMonthForm({ ...monthForm, total_impressions_views: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Engagement</label><input type="number" value={monthForm.total_engagement_interactions} onChange={(e) => setMonthForm({ ...monthForm, total_engagement_interactions: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Likes</label><input type="number" value={monthForm.total_likes} onChange={(e) => setMonthForm({ ...monthForm, total_likes: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Total Comments</label><input type="number" value={monthForm.total_comments} onChange={(e) => setMonthForm({ ...monthForm, total_comments: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Shares</label><input type="number" value={monthForm.total_shares} onChange={(e) => setMonthForm({ ...monthForm, total_shares: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-group">
                    <label className="rpt-label">Notes</label>
                    <input type="text" value={monthForm.notes} onChange={(e) => setMonthForm({ ...monthForm, notes: e.target.value })} className="rpt-input" placeholder="Any notes for this month" />
                  </div>
                </>
              )}
            </div>
            <div className="rpt-modal-footer">
              <button onClick={() => { setShowModal(false); setEditingWeek(null) }} className="rpt-btn rpt-btn-secondary">Cancel</button>
              <button onClick={editingWeek ? saveWeeklyKPI : saveMonthlyKPI} className="rpt-btn rpt-btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
