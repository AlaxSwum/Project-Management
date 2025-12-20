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
  start_followers: number
  end_followers: number
  net_growth: number
  total_reach: number
  total_impressions: number
  total_engagement: number
  total_likes: number
  total_comments: number
  total_shares: number
  posts_published: number
  notes: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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
    platform: 'facebook', year: 2024, month: 1, week_number: 1, start_followers: 0, end_followers: 0,
    net_growth: 0, total_reach: 0, total_impressions: 0, total_engagement: 0, total_likes: 0,
    total_comments: 0, total_shares: 0, posts_published: 0, notes: ''
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
      const { data } = await supabase.from('company_weekly_kpi').select('*').eq('company_id', companyId).eq('platform', selectedPlatform).eq('year', selectedYear).order('month').order('week_number')
      setWeeklyData(data || [])
    } catch (err) { console.error('Error:', err) }
  }, [companyId, selectedPlatform, selectedYear])

  useEffect(() => { if (user?.id && companyId) { fetchCompany(); setIsLoading(false) } }, [user?.id, companyId, fetchCompany])
  useEffect(() => { if (companyId && selectedPlatform) { fetchMonthlyData(); fetchWeeklyData() } }, [companyId, selectedPlatform, selectedYear, fetchMonthlyData, fetchWeeklyData])

  // Get data for year
  const yearData = useMemo(() => {
    return MONTHS.map((name, idx) => {
      const monthNum = idx + 1
      const data = monthlyData.find(d => {
        const date = new Date(d.report_month)
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === monthNum
      })
      return { name, monthNum, data, hasData: !!data }
    })
  }, [monthlyData, selectedYear])

  // Get weeks for selected month
  const monthWeeks = useMemo(() => {
    return weeklyData.filter(w => w.month === selectedMonth).sort((a, b) => a.week_number - b.week_number)
  }, [weeklyData, selectedMonth])

  // Calculate totals
  const yearTotals = useMemo(() => yearData.reduce((acc, m) => ({
    followers: acc.followers + (m.data?.net_growth || 0),
    reach: acc.reach + (m.data?.total_reach || 0),
    engagement: acc.engagement + (m.data?.total_engagement_interactions || 0),
    likes: acc.likes + (m.data?.total_likes || 0),
    posts: acc.posts + (m.data?.total_posts || 0)
  }), { followers: 0, reach: 0, engagement: 0, likes: 0, posts: 0 }), [yearData])

  const maxEngagement = useMemo(() => Math.max(...yearData.map(m => m.data?.total_engagement_interactions || 0), 1), [yearData])
  const maxFollowers = useMemo(() => Math.max(...yearData.map(m => Math.abs(m.data?.net_growth || 0)), 1), [yearData])

  const openMonthModal = (monthNum: number) => {
    const existing = yearData[monthNum - 1]?.data
    if (existing) {
      setMonthForm({ ...existing, platform: selectedPlatform })
    } else {
      setMonthForm({
        platform: selectedPlatform, report_month: `${selectedYear}-${String(monthNum).padStart(2, '0')}-01`,
        start_followers: 0, end_followers: 0, net_growth: 0, total_reach: 0, total_impressions_views: 0,
        total_engagement_interactions: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_posts: 0, notes: ''
      })
    }
    setEditingMonth(monthNum)
    setEditingWeek(null)
    setShowModal(true)
  }

  const openWeekModal = (weekNum: number) => {
    const existing = monthWeeks.find(w => w.week_number === weekNum)
    if (existing) {
      setWeekForm({ ...existing, platform: selectedPlatform })
    } else {
      setWeekForm({
        platform: selectedPlatform, year: selectedYear, month: selectedMonth, week_number: weekNum,
        start_followers: 0, end_followers: 0, net_growth: 0, total_reach: 0, total_impressions: 0,
        total_engagement: 0, total_likes: 0, total_comments: 0, total_shares: 0, posts_published: 0, notes: ''
      })
    }
    setEditingWeek(weekNum)
    setShowModal(true)
  }

  const saveMonthlyKPI = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const monthStr = `${selectedYear}-${String(editingMonth).padStart(2, '0')}-01`
      const data = { ...monthForm, company_id: companyId, platform: selectedPlatform, report_month: monthStr }
      const existing = yearData[editingMonth! - 1]?.data
      if (existing?.id) {
        await supabase.from('company_kpi_overview').update(data).eq('id', existing.id)
      } else {
        await supabase.from('company_kpi_overview').insert(data)
      }
      setShowModal(false)
      fetchMonthlyData()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const saveWeeklyKPI = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const data = { ...weekForm, company_id: companyId, platform: selectedPlatform, year: selectedYear, month: selectedMonth, week_number: editingWeek }
      const existing = monthWeeks.find(w => w.week_number === editingWeek)
      if (existing?.id) {
        await supabase.from('company_weekly_kpi').update(data).eq('id', existing.id)
      } else {
        await supabase.from('company_weekly_kpi').insert(data)
      }
      setShowModal(false)
      fetchWeeklyData()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

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
        .rpt-header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .rpt-back { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; cursor: pointer; }
        .rpt-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .rpt-controls { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .rpt-select { padding: 0.5rem 1rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.9rem; background: #fff; }
        .rpt-platforms { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .rpt-platform-btn { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: 2px solid transparent; border-radius: 8px; cursor: pointer; text-transform: capitalize; }
        .rpt-toggle { display: flex; background: #f5f5f5; border-radius: 8px; padding: 3px; }
        .rpt-toggle-btn { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #666; }
        .rpt-toggle-btn.active { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .rpt-content { padding: 1.5rem 2rem; }
        .rpt-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .rpt-stat { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1.25rem; text-align: center; }
        .rpt-stat-value { font-size: 1.5rem; font-weight: 600; }
        .rpt-stat-label { font-size: 0.75rem; color: #666; text-transform: uppercase; margin-top: 0.25rem; }
        .rpt-chart-section { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .rpt-chart-title { font-size: 1rem; font-weight: 500; color: #1a1a1a; margin: 0 0 1.25rem 0; }
        .rpt-bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding-top: 30px; }
        .rpt-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
        .rpt-bar { width: 100%; border-radius: 4px 4px 0 0; cursor: pointer; transition: opacity 0.2s; position: relative; min-height: 4px; }
        .rpt-bar:hover { opacity: 0.8; }
        .rpt-bar-value { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 600; color: #333; white-space: nowrap; }
        .rpt-bar-label { font-size: 11px; color: #666; margin-top: 8px; font-weight: 500; }
        .rpt-month-detail { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; }
        .rpt-month-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .rpt-month-title { font-size: 1.125rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .rpt-btn-edit { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; cursor: pointer; }
        .rpt-month-body { padding: 1.5rem; }
        .rpt-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .rpt-metric-card { background: #fafafa; border-radius: 12px; padding: 1rem; text-align: center; }
        .rpt-metric-value { font-size: 1.25rem; font-weight: 600; color: #1a1a1a; }
        .rpt-metric-label { font-size: 0.75rem; color: #666; margin-top: 0.25rem; }
        .rpt-weeks-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f0f0; }
        .rpt-weeks-title { font-size: 0.9rem; font-weight: 500; color: '#1a1a1a'; margin: 0 0 1rem 0; }
        .rpt-weeks-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
        .rpt-week-card { background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 10px; padding: 1rem; cursor: pointer; text-align: center; transition: all 0.2s; }
        .rpt-week-card:hover { border-color: #C483D9; }
        .rpt-week-card.has-data { background: #f0f7ff; border-color: #5884FD; }
        .rpt-week-num { font-size: 0.85rem; font-weight: 500; color: #333; }
        .rpt-week-growth { font-size: 1rem; font-weight: 600; margin-top: 0.25rem; }
        .rpt-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); }
        .rpt-modal-content { background: #fff; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow: auto; }
        .rpt-modal-header { padding: 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => router.push(`/content-calendar/${companyId}`)} className="rpt-back">Back</button>
                <h1 className="rpt-title">{company.name} - Reports</h1>
              </div>
              <div className="rpt-controls">
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rpt-select">
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
            {/* Year Totals */}
            <div className="rpt-stats">
              {[
                { label: 'Followers', value: yearTotals.followers, color: yearTotals.followers >= 0 ? '#10b981' : '#ef4444', prefix: yearTotals.followers >= 0 ? '+' : '' },
                { label: 'Reach', value: yearTotals.reach, color: '#5884FD' },
                { label: 'Engagement', value: yearTotals.engagement, color: '#C483D9' },
                { label: 'Likes', value: yearTotals.likes, color: '#ec4899' },
                { label: 'Posts', value: yearTotals.posts, color: '#f59e0b' }
              ].map(s => (
                <div key={s.label} className="rpt-stat">
                  <div className="rpt-stat-value" style={{ color: s.color }}>{s.prefix || ''}{s.value.toLocaleString()}</div>
                  <div className="rpt-stat-label">{s.label} ({selectedYear})</div>
                </div>
              ))}
            </div>

            {/* Bar Chart - Engagement by Month */}
            <div className="rpt-chart-section">
              <h3 className="rpt-chart-title">Engagement by Month - {selectedYear}</h3>
              <div className="rpt-bar-chart">
                {yearData.map(m => {
                  const engagement = m.data?.total_engagement_interactions || 0
                  const height = engagement > 0 ? Math.max((engagement / maxEngagement) * 100, 5) : 0
                  return (
                    <div key={m.name} className="rpt-bar-col">
                      <div onClick={() => openMonthModal(m.monthNum)} className="rpt-bar" style={{ height: `${height}%`, background: m.hasData ? PLATFORM_COLORS[selectedPlatform] : '#e0e0e0' }}>
                        {engagement > 0 && <span className="rpt-bar-value">{engagement.toLocaleString()}</span>}
                      </div>
                      <span className="rpt-bar-label">{m.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bar Chart - Follower Growth */}
            <div className="rpt-chart-section">
              <h3 className="rpt-chart-title">Follower Growth by Month - {selectedYear}</h3>
              <div className="rpt-bar-chart">
                {yearData.map(m => {
                  const growth = m.data?.net_growth || 0
                  const height = growth !== 0 ? Math.max((Math.abs(growth) / maxFollowers) * 100, 5) : 0
                  return (
                    <div key={m.name} className="rpt-bar-col">
                      <div onClick={() => openMonthModal(m.monthNum)} className="rpt-bar" style={{ height: `${height}%`, background: growth > 0 ? '#10b981' : growth < 0 ? '#ef4444' : '#e0e0e0' }}>
                        {growth !== 0 && <span className="rpt-bar-value">{growth > 0 ? '+' : ''}{growth.toLocaleString()}</span>}
                      </div>
                      <span className="rpt-bar-label">{m.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly View - Selected Month Detail */}
            {viewMode === 'monthly' && (
              <div className="rpt-month-detail">
                <div className="rpt-month-header">
                  <div>
                    <h3 className="rpt-month-title">{FULL_MONTHS[selectedMonth - 1]} {selectedYear} - {selectedPlatform}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rpt-select">
                      {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <button onClick={() => openMonthModal(selectedMonth)} className="rpt-btn-edit">{yearData[selectedMonth - 1]?.hasData ? 'Edit Data' : 'Add Data'}</button>
                  </div>
                </div>
                <div className="rpt-month-body">
                  {yearData[selectedMonth - 1]?.hasData ? (
                    <div className="rpt-metrics-grid">
                      {[
                        { label: 'Followers', value: yearData[selectedMonth - 1]?.data?.net_growth || 0, prefix: (yearData[selectedMonth - 1]?.data?.net_growth || 0) >= 0 ? '+' : '', color: (yearData[selectedMonth - 1]?.data?.net_growth || 0) >= 0 ? '#10b981' : '#ef4444' },
                        { label: 'Reach', value: yearData[selectedMonth - 1]?.data?.total_reach || 0 },
                        { label: 'Engagement', value: yearData[selectedMonth - 1]?.data?.total_engagement_interactions || 0 },
                        { label: 'Likes', value: yearData[selectedMonth - 1]?.data?.total_likes || 0 },
                        { label: 'Comments', value: yearData[selectedMonth - 1]?.data?.total_comments || 0 },
                        { label: 'Shares', value: yearData[selectedMonth - 1]?.data?.total_shares || 0 },
                        { label: 'Impressions', value: yearData[selectedMonth - 1]?.data?.total_impressions_views || 0 },
                        { label: 'Posts', value: yearData[selectedMonth - 1]?.data?.total_posts || 0 }
                      ].map(m => (
                        <div key={m.label} className="rpt-metric-card">
                          <div className="rpt-metric-value" style={{ color: m.color || '#1a1a1a' }}>{m.prefix || ''}{m.value.toLocaleString()}</div>
                          <div className="rpt-metric-label">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <p>No data for {FULL_MONTHS[selectedMonth - 1]} yet</p>
                      <button onClick={() => openMonthModal(selectedMonth)} className="rpt-btn rpt-btn-primary" style={{ marginTop: '1rem' }}>Add Data</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly View */}
            {viewMode === 'weekly' && (
              <div className="rpt-month-detail">
                <div className="rpt-month-header">
                  <h3 className="rpt-month-title">{FULL_MONTHS[selectedMonth - 1]} {selectedYear} - Weekly Data</h3>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rpt-select">
                    {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="rpt-month-body">
                  <div className="rpt-weeks-grid">
                    {[1, 2, 3, 4, 5].map(weekNum => {
                      const weekData = monthWeeks.find(w => w.week_number === weekNum)
                      return (
                        <div key={weekNum} onClick={() => openWeekModal(weekNum)} className={`rpt-week-card ${weekData ? 'has-data' : ''}`}>
                          <div className="rpt-week-num">Week {weekNum}</div>
                          {weekData ? (
                            <>
                              <div className="rpt-week-growth" style={{ color: weekData.net_growth >= 0 ? '#10b981' : '#ef4444' }}>
                                {weekData.net_growth >= 0 ? '+' : ''}{weekData.net_growth}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>followers</div>
                              <div style={{ fontSize: '0.8rem', color: '#333', marginTop: '0.5rem' }}>{weekData.total_engagement} eng</div>
                            </>
                          ) : (
                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>Click to add</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="rpt-modal" onClick={() => setShowModal(false)}>
          <div className="rpt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3 className="rpt-modal-title">
                {editingWeek ? `Week ${editingWeek} - ${FULL_MONTHS[selectedMonth - 1]}` : FULL_MONTHS[editingMonth! - 1]} {selectedYear} - {selectedPlatform}
              </h3>
              <button onClick={() => setShowModal(false)} className="rpt-modal-close">x</button>
            </div>
            <div className="rpt-modal-body">
              {editingWeek ? (
                <>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Start Followers</label><input type="number" value={weekForm.start_followers} onChange={(e) => setWeekForm({ ...weekForm, start_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">End Followers</label><input type="number" value={weekForm.end_followers} onChange={(e) => setWeekForm({ ...weekForm, end_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Net Growth</label><input type="number" value={weekForm.net_growth} onChange={(e) => setWeekForm({ ...weekForm, net_growth: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Posts Published</label><input type="number" value={weekForm.posts_published} onChange={(e) => setWeekForm({ ...weekForm, posts_published: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Reach</label><input type="number" value={weekForm.total_reach} onChange={(e) => setWeekForm({ ...weekForm, total_reach: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Impressions</label><input type="number" value={weekForm.total_impressions} onChange={(e) => setWeekForm({ ...weekForm, total_impressions: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Engagement</label><input type="number" value={weekForm.total_engagement} onChange={(e) => setWeekForm({ ...weekForm, total_engagement: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Likes</label><input type="number" value={weekForm.total_likes} onChange={(e) => setWeekForm({ ...weekForm, total_likes: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Comments</label><input type="number" value={weekForm.total_comments} onChange={(e) => setWeekForm({ ...weekForm, total_comments: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Shares</label><input type="number" value={weekForm.total_shares} onChange={(e) => setWeekForm({ ...weekForm, total_shares: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rpt-form-grid">
                    <div className="rpt-form-group"><label className="rpt-label">Start Followers</label><input type="number" value={monthForm.start_followers} onChange={(e) => setMonthForm({ ...monthForm, start_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">End Followers</label><input type="number" value={monthForm.end_followers} onChange={(e) => setMonthForm({ ...monthForm, end_followers: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Net Growth</label><input type="number" value={monthForm.net_growth} onChange={(e) => setMonthForm({ ...monthForm, net_growth: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Posts</label><input type="number" value={monthForm.total_posts} onChange={(e) => setMonthForm({ ...monthForm, total_posts: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Reach</label><input type="number" value={monthForm.total_reach} onChange={(e) => setMonthForm({ ...monthForm, total_reach: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Impressions</label><input type="number" value={monthForm.total_impressions_views} onChange={(e) => setMonthForm({ ...monthForm, total_impressions_views: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Engagement</label><input type="number" value={monthForm.total_engagement_interactions} onChange={(e) => setMonthForm({ ...monthForm, total_engagement_interactions: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Likes</label><input type="number" value={monthForm.total_likes} onChange={(e) => setMonthForm({ ...monthForm, total_likes: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Comments</label><input type="number" value={monthForm.total_comments} onChange={(e) => setMonthForm({ ...monthForm, total_comments: Number(e.target.value) })} className="rpt-input" /></div>
                    <div className="rpt-form-group"><label className="rpt-label">Total Shares</label><input type="number" value={monthForm.total_shares} onChange={(e) => setMonthForm({ ...monthForm, total_shares: Number(e.target.value) })} className="rpt-input" /></div>
                  </div>
                  <div className="rpt-form-group">
                    <label className="rpt-label">Notes</label>
                    <input type="text" value={monthForm.notes} onChange={(e) => setMonthForm({ ...monthForm, notes: e.target.value })} className="rpt-input" placeholder="Optional notes" />
                  </div>
                </>
              )}
            </div>
            <div className="rpt-modal-footer">
              <button onClick={() => setShowModal(false)} className="rpt-btn rpt-btn-secondary">Cancel</button>
              <button onClick={editingWeek ? saveWeeklyKPI : saveMonthlyKPI} className="rpt-btn rpt-btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
