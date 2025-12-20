'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { Company, ContentPost, ContentPostTarget, CompanyKPIOverview, Platform, PLATFORMS, PLATFORM_COLORS, STATUS_COLORS, PLATFORM_STATUS_COLORS } from '@/types/content-calendar-v3'

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const companyId = params?.companyId as string || ''

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [kpiData, setKpiData] = useState<CompanyKPIOverview[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [platformTab, setPlatformTab] = useState<'overview' | 'posts' | 'top'>('overview')
  const [showKPIModal, setShowKPIModal] = useState(false)
  const [showMetricsModal, setShowMetricsModal] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<ContentPostTarget | null>(null)
  
  const [kpiForm, setKpiForm] = useState({ start_followers: 0, end_followers: 0, net_growth: 0, total_posts: 0, total_reach: 0, total_impressions_views: 0, total_engagement_interactions: 0, notes: '' })
  const [metricsForm, setMetricsForm] = useState({ metric_scope: 'lifetime', range_start: '', range_end: '', reach: 0, impressions_views: 0, interactions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, net_follows: 0, views: 0, clicks: 0 })

  useEffect(() => { const checkMobile = () => setIsMobile(window.innerWidth < 768); checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile) }, [])
  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/login') }, [authLoading, isAuthenticated, router])

  const fetchCompany = useCallback(async () => { if (!companyId) return; try { const { supabase } = await import('@/lib/supabase'); const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single(); if (error) throw error; setCompany(data) } catch { router.push('/content-calendar') } }, [companyId, router])

  const fetchPosts = useCallback(async () => {
    if (!companyId) return; setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: postsData, error } = await supabase.from('content_posts').select('*').eq('company_id', companyId).order('planned_date', { ascending: false })
      if (error) throw error
      const postsWithTargets = await Promise.all((postsData || []).map(async (post) => {
        const { data: targets } = await supabase.from('content_post_targets').select('*').eq('post_id', post.id)
        const targetsWithMetrics = await Promise.all((targets || []).map(async (target) => {
          const { data: metrics } = await supabase.from('content_post_metrics').select('*').eq('post_target_id', target.id)
          return { ...target, metrics: metrics || [] }
        }))
        return { ...post, targets: targetsWithMetrics }
      }))
      setPosts(postsWithTargets)
    } catch (err) { console.error('Error:', err) } finally { setIsLoading(false) }
  }, [companyId])

  const fetchKPI = useCallback(async () => { if (!companyId) return; try { const { supabase } = await import('@/lib/supabase'); const { data } = await supabase.from('company_kpi_overview').select('*').eq('company_id', companyId); setKpiData(data || []) } catch (err) { console.error('Error:', err) } }, [companyId])

  useEffect(() => { if (user?.id && companyId) { fetchCompany(); fetchPosts(); fetchKPI() } }, [user?.id, companyId, fetchCompany, fetchPosts, fetchKPI])

  const getMonthStart = (monthStr: string) => `${monthStr}-01`

  const filteredPosts = useMemo(() => {
    const monthStart = getMonthStart(selectedMonth)
    const monthEnd = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1) - 1).toISOString().split('T')[0]
    return posts.filter(post => post.planned_date >= monthStart && post.planned_date <= monthEnd)
  }, [posts, selectedMonth])

  const platformTargets = useMemo(() => {
    if (!selectedPlatform) return []
    return filteredPosts.flatMap(post => (post.targets || []).filter(t => t.platform === selectedPlatform).map(t => ({ ...t, post })))
  }, [filteredPosts, selectedPlatform])

  const currentKPI = useMemo(() => {
    if (!selectedPlatform) return null
    return kpiData.find(k => k.platform === selectedPlatform && k.report_month === getMonthStart(selectedMonth))
  }, [kpiData, selectedPlatform, selectedMonth])

  const calculatedTotals = useMemo(() => {
    let totalReach = 0, totalImpressions = 0, totalEngagement = 0
    platformTargets.forEach(t => { const m = (t as any).metrics?.find((m: any) => m.metric_scope === 'lifetime'); if (m) { totalReach += m.reach || 0; totalImpressions += m.impressions_views || 0; totalEngagement += m.interactions || 0 } })
    return { totalReach, totalImpressions, totalEngagement, totalPosts: platformTargets.filter(t => t.platform_status === 'published').length }
  }, [platformTargets])

  const topPostsByEngagement = useMemo(() => [...platformTargets].map((t: any) => ({ ...t, engagement: t.metrics?.find((m: any) => m.metric_scope === 'lifetime')?.interactions || 0 })).sort((a, b) => b.engagement - a.engagement).slice(0, 5), [platformTargets])
  const topPostsByReach = useMemo(() => [...platformTargets].map((t: any) => ({ ...t, reach: t.metrics?.find((m: any) => m.metric_scope === 'lifetime')?.reach || 0 })).sort((a, b) => b.reach - a.reach).slice(0, 5), [platformTargets])

  const platformSummary = useMemo(() => {
    const monthStart = getMonthStart(selectedMonth)
    return PLATFORMS.map(platform => {
      const kpi = kpiData.find(k => k.platform === platform && k.report_month === monthStart)
      const targets = filteredPosts.flatMap(post => (post.targets || []).filter(t => t.platform === platform))
      const totalBudget = targets.reduce((sum, t) => sum + (t.ad_budget || 0), 0)
      return { platform, netGrowth: kpi?.net_growth || 0, totalPosts: targets.filter(t => t.platform_status === 'published').length, totalReach: kpi?.total_reach || 0, totalImpressions: kpi?.total_impressions_views || 0, totalEngagement: kpi?.total_engagement_interactions || 0, startFollowers: kpi?.start_followers || 0, endFollowers: kpi?.end_followers || 0, totalBudget }
    })
  }, [filteredPosts, kpiData, selectedMonth])

  const overallStats = useMemo(() => platformSummary.reduce((acc, p) => ({ totalPosts: acc.totalPosts + p.totalPosts, totalReach: acc.totalReach + p.totalReach, totalEngagement: acc.totalEngagement + p.totalEngagement, totalGrowth: acc.totalGrowth + p.netGrowth, totalBudget: acc.totalBudget + p.totalBudget }), { totalPosts: 0, totalReach: 0, totalEngagement: 0, totalGrowth: 0, totalBudget: 0 }), [platformSummary])

  const handleSaveKPI = async () => {
    if (!selectedPlatform) return
    const monthStart = getMonthStart(selectedMonth)
    try {
      const { supabase } = await import('@/lib/supabase')
      if (currentKPI) {
        const { error } = await supabase.from('company_kpi_overview').update({ ...kpiForm }).eq('id', currentKPI.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('company_kpi_overview').insert({ company_id: companyId, report_month: monthStart, platform: selectedPlatform, ...kpiForm })
        if (error) throw error
      }
      setShowKPIModal(false); fetchKPI()
      alert('KPI saved successfully!')
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleSaveMetrics = async () => {
    if (!selectedTarget) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const metricsData = {
        metric_scope: metricsForm.metric_scope, range_start: metricsForm.range_start || null, range_end: metricsForm.range_end || null,
        reach: metricsForm.reach || 0, impressions_views: metricsForm.impressions_views || 0, interactions: metricsForm.interactions || 0,
        reactions: metricsForm.reactions || 0, comments: metricsForm.comments || 0, shares: metricsForm.shares || 0,
        saves: metricsForm.saves || 0, net_follows: metricsForm.net_follows || 0, views: metricsForm.views || 0, clicks: metricsForm.clicks || 0
      }
      const existingMetrics = (selectedTarget as any).metrics?.find((m: any) => m.metric_scope === metricsForm.metric_scope)
      if (existingMetrics) {
        const { error } = await supabase.from('content_post_metrics').update(metricsData).eq('id', existingMetrics.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('content_post_metrics').insert({ post_target_id: selectedTarget.id, ...metricsData })
        if (error) throw error
      }
      setShowMetricsModal(false); fetchPosts()
      alert('Metrics saved successfully!')
    } catch (err: any) { alert('Error saving metrics: ' + err.message) }
  }

  const openKPIModal = () => {
    if (currentKPI) setKpiForm({ start_followers: currentKPI.start_followers, end_followers: currentKPI.end_followers, net_growth: currentKPI.net_growth, total_posts: currentKPI.total_posts, total_reach: currentKPI.total_reach, total_impressions_views: currentKPI.total_impressions_views, total_engagement_interactions: currentKPI.total_engagement_interactions, notes: currentKPI.notes || '' })
    else setKpiForm({ start_followers: 0, end_followers: 0, net_growth: 0, total_posts: calculatedTotals.totalPosts, total_reach: calculatedTotals.totalReach, total_impressions_views: calculatedTotals.totalImpressions, total_engagement_interactions: calculatedTotals.totalEngagement, notes: '' })
    setShowKPIModal(true)
  }

  const openMetricsModal = (target: any) => {
    setSelectedTarget(target)
    const existingMetrics = target.metrics?.find((m: any) => m.metric_scope === 'lifetime')
    if (existingMetrics) setMetricsForm({ metric_scope: existingMetrics.metric_scope, range_start: existingMetrics.range_start || '', range_end: existingMetrics.range_end || '', reach: existingMetrics.reach || 0, impressions_views: existingMetrics.impressions_views || 0, interactions: existingMetrics.interactions || 0, reactions: existingMetrics.reactions || 0, comments: existingMetrics.comments || 0, shares: existingMetrics.shares || 0, saves: existingMetrics.saves || 0, net_follows: existingMetrics.net_follows || 0, views: existingMetrics.views || 0, clicks: existingMetrics.clicks || 0 })
    else setMetricsForm({ metric_scope: 'lifetime', range_start: '', range_end: '', reach: 0, impressions_views: 0, interactions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, net_follows: 0, views: 0, clicks: 0 })
    setShowMetricsModal(true)
  }

  // Pie Chart Component
  const PieChart = ({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>
    
    let cumulativePercent = 0
    const segments = data.map(d => {
      const percent = (d.value / total) * 100
      const startAngle = cumulativePercent * 3.6
      cumulativePercent += percent
      return { ...d, percent, startAngle }
    })
    
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent)
      const y = Math.sin(2 * Math.PI * percent)
      return [x, y]
    }
    
    let pathD = ''
    let currentPercent = 0
    segments.forEach((seg, i) => {
      const startPercent = currentPercent
      const endPercent = currentPercent + seg.percent / 100
      const [startX, startY] = getCoordinatesForPercent(startPercent)
      const [endX, endY] = getCoordinatesForPercent(endPercent)
      const largeArcFlag = seg.percent > 50 ? 1 : 0
      pathD += `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z `
      currentPercent = endPercent
    })
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {segments.map((seg, i) => {
            const startPercent = segments.slice(0, i).reduce((sum, s) => sum + s.percent / 100, 0)
            const endPercent = startPercent + seg.percent / 100
            const [startX, startY] = getCoordinatesForPercent(startPercent)
            const [endX, endY] = getCoordinatesForPercent(endPercent)
            const largeArcFlag = seg.percent > 50 ? 1 : 0
            return (
              <path key={i} d={`M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`} fill={seg.color} stroke="#fff" strokeWidth="0.02" />
            )
          })}
        </svg>
      </div>
    )
  }

  // Bar Chart
  const BarChart = ({ data, maxValue, height = 150 }: { data: { label: string; value: number; color: string }[]; maxValue: number; height?: number }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height, padding: '0 8px' }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: `${Math.max((item.value / (maxValue || 1)) * 100, 5)}%`, background: item.color, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease', minHeight: '8px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 600, color: '#333', whiteSpace: 'nowrap' }}>{item.value.toLocaleString()}</div>
          </div>
          <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )

  // Progress bar
  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, background: color, borderRadius: '5px', transition: 'width 0.5s ease' }} />
    </div>
  )

  if (authLoading || !company) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const pieChartData = platformSummary.map(p => ({ label: p.platform, value: p.totalPosts, color: PLATFORM_COLORS[p.platform] }))
  const budgetPieData = platformSummary.map(p => ({ label: p.platform, value: p.totalBudget, color: PLATFORM_COLORS[p.platform] }))

  return (
    <div>
      <MobileHeader title={company.name} isMobile={isMobile} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #F5F5ED; }
        .rpt-container { min-height: 100vh; display: flex; background: #F5F5ED; }
        .rpt-main { flex: 1; margin-left: ${isMobile ? '0' : '256px'}; background: #F5F5ED; padding-top: ${isMobile ? '70px' : '0'}; }
        .rpt-header { padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: #fff; border-bottom: 1px solid #e8e8e8; }
        .rpt-nav { display: flex; align-items: center; gap: 1rem; }
        .rpt-back { padding: 0.625rem 1rem; font-size: 0.9rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 10px; background: #fff; cursor: pointer; color: #333; }
        .rpt-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .rpt-subtitle { font-size: 0.85rem; color: #666; margin: 0.25rem 0 0 0; }
        .rpt-actions { display: flex; align-items: center; gap: 0.75rem; }
        .rpt-month-input { padding: 0.625rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; background: #fff; font-size: 0.9rem; }
        .rpt-btn-secondary { padding: 0.625rem 1.25rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 10px; background: #fff; cursor: pointer; color: #333; }
        .rpt-content { padding: 1.5rem 2rem; }
        .rpt-stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .rpt-stat-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; padding: 1.5rem; text-align: center; }
        .rpt-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .rpt-stat-value { font-size: 1.75rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.25rem; }
        .rpt-stat-label { font-size: 0.8rem; color: #666; }
        .rpt-charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        .rpt-chart-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; padding: 1.5rem; }
        .rpt-chart-title { font-size: 1rem; font-weight: 500; color: #1a1a1a; margin: 0 0 1.25rem 0; }
        .rpt-chart-content { display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
        .rpt-chart-legend { display: flex; flex-direction: column; gap: 0.5rem; }
        .rpt-legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; }
        .rpt-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        .rpt-platforms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .rpt-platform-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
        .rpt-platform-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }
        .rpt-platform-header { padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
        .rpt-platform-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-weight: 700; }
        .rpt-platform-name { font-size: 1.125rem; font-weight: 500; color: #1a1a1a; text-transform: capitalize; }
        .rpt-platform-sub { font-size: 0.8rem; color: #666; }
        .rpt-platform-metrics { padding: 0 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .rpt-metric-row { display: flex; justify-content: space-between; align-items: center; }
        .rpt-metric-label { font-size: 0.85rem; color: #666; }
        .rpt-metric-value { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; }
        .rpt-platform-footer { padding: 1rem 1.25rem; background: #fafafa; border-top: 1px solid #f0f0f0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; }
        .rpt-footer-value { font-size: 1rem; font-weight: 600; color: #1a1a1a; }
        .rpt-footer-label { font-size: 0.65rem; color: #666; text-transform: uppercase; }
        .rpt-tabs { display: flex; background: #fff; border-radius: 10px; padding: 4px; margin-bottom: 1.5rem; border: 1px solid #e8e8e8; width: fit-content; }
        .rpt-tab { padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; background: transparent; color: #666; }
        .rpt-tab.active { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .rpt-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .rpt-kpi-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1.25rem; text-align: center; }
        .rpt-kpi-label { font-size: 0.75rem; font-weight: 500; color: #666; text-transform: uppercase; margin-bottom: 0.5rem; }
        .rpt-kpi-value { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; }
        .rpt-btn-primary { padding: 0.875rem 1.75rem; font-size: 0.9rem; font-weight: 500; border-radius: 10px; border: none; background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; cursor: pointer; box-shadow: 0 4px 14px rgba(196, 131, 217, 0.3); }
        .rpt-table-container { background: #fff; border-radius: 16px; overflow: auto; border: 1px solid #e8e8e8; }
        .rpt-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .rpt-table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; border-bottom: 2px solid #f0f0f0; background: #fafafa; }
        .rpt-table td { padding: 1rem; border-bottom: 1px solid #f5f5f5; }
        .rpt-table tr:hover { background: #fafafa; }
        .rpt-top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .rpt-top-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; padding: 1.5rem; }
        .rpt-top-title { font-size: 1rem; font-weight: 500; color: #1a1a1a; margin: 0 0 1.25rem 0; }
        .rpt-top-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .rpt-top-item { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem; background: #fafafa; border-radius: 10px; }
        .rpt-top-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; margin-right: 0.75rem; }
        .rpt-top-name { font-size: 0.9rem; font-weight: 500; color: #1a1a1a; }
        .rpt-top-value { font-size: 1rem; font-weight: 600; }
        .rpt-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); }
        .rpt-modal-content { background: #fff; border-radius: 20px; width: 100%; max-width: 540px; max-height: 90vh; overflow: auto; padding: 2rem; }
        .rpt-modal-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0 0 0.5rem 0; }
        .rpt-modal-subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem 0; }
        .rpt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .rpt-form-group { margin-bottom: 0; }
        .rpt-label { display: block; font-size: 0.85rem; font-weight: 500; color: #333; margin-bottom: 0.5rem; }
        .rpt-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; font-size: 0.9rem; box-sizing: border-box; }
        .rpt-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f0f0; }
        .rpt-empty { padding: 4rem 1.5rem; text-align: center; color: #666; }
        .rpt-section-title { font-size: 1.125rem; font-weight: 500; color: #1a1a1a; margin: 0 0 1.5rem 0; }
      `}} />

      <div className="rpt-container">
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <main className="rpt-main">
          <header className="rpt-header">
            <div className="rpt-nav">
              <button onClick={() => router.push(`/content-calendar/${companyId}`)} className="rpt-back">Back</button>
              <div>
                <h1 className="rpt-title">{company.name}</h1>
                <p className="rpt-subtitle">Performance Reports</p>
              </div>
            </div>
            <div className="rpt-actions">
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rpt-month-input" />
              {selectedPlatform && <button onClick={() => setSelectedPlatform(null)} className="rpt-btn-secondary">All Platforms</button>}
            </div>
          </header>

          <div className="rpt-content">
            {!selectedPlatform ? (
              <>
                {/* Stats Row */}
                <div className="rpt-stats-row">
                  {[
                    { label: 'Total Posts', value: overallStats.totalPosts, color: '#C483D9', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { label: 'Total Reach', value: overallStats.totalReach, color: '#5884FD', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                    { label: 'Engagement', value: overallStats.totalEngagement, color: '#10b981', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                    { label: 'Net Growth', value: overallStats.totalGrowth, color: overallStats.totalGrowth >= 0 ? '#10b981' : '#ef4444', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                    { label: 'Ad Budget', value: overallStats.totalBudget, color: '#f59e0b', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', prefix: '$' }
                  ].map(stat => (
                    <div key={stat.label} className="rpt-stat-card">
                      <div className="rpt-stat-icon" style={{ background: `${stat.color}15` }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2"><path d={stat.icon} /></svg>
                      </div>
                      <div className="rpt-stat-value" style={{ color: stat.color }}>{stat.prefix || ''}{stat.value.toLocaleString()}</div>
                      <div className="rpt-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="rpt-charts-row">
                  <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">Posts by Platform</h3>
                    <div className="rpt-chart-content">
                      <PieChart data={pieChartData} size={140} />
                      <div className="rpt-chart-legend">
                        {pieChartData.map(d => (
                          <div key={d.label} className="rpt-legend-item">
                            <div className="rpt-legend-dot" style={{ background: d.color }} />
                            <span style={{ textTransform: 'capitalize' }}>{d.label}: {d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">Budget by Platform</h3>
                    <div className="rpt-chart-content">
                      <PieChart data={budgetPieData} size={140} />
                      <div className="rpt-chart-legend">
                        {budgetPieData.map(d => (
                          <div key={d.label} className="rpt-legend-item">
                            <div className="rpt-legend-dot" style={{ background: d.color }} />
                            <span style={{ textTransform: 'capitalize' }}>{d.label}: ${d.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">Engagement Comparison</h3>
                    <BarChart data={platformSummary.map(p => ({ label: p.platform.slice(0, 2).toUpperCase(), value: p.totalEngagement, color: PLATFORM_COLORS[p.platform] }))} maxValue={Math.max(...platformSummary.map(p => p.totalEngagement), 1)} />
                  </div>
                </div>

                {/* Platform Cards */}
                <h2 className="rpt-section-title">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} by Platform</h2>
                <div className="rpt-platforms-grid">
                  {platformSummary.map(p => {
                    const maxVal = Math.max(...platformSummary.map(x => x.totalReach), 1)
                    return (
                      <div key={p.platform} className="rpt-platform-card" onClick={() => setSelectedPlatform(p.platform)}>
                        <div className="rpt-platform-header">
                          <div className="rpt-platform-icon" style={{ background: PLATFORM_COLORS[p.platform] }}>{p.platform.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="rpt-platform-name">{p.platform}</div>
                            <div className="rpt-platform-sub">Click for details</div>
                          </div>
                        </div>
                        <div className="rpt-platform-metrics">
                          <div>
                            <div className="rpt-metric-row"><span className="rpt-metric-label">Reach</span><span className="rpt-metric-value">{p.totalReach.toLocaleString()}</span></div>
                            <ProgressBar value={p.totalReach} max={maxVal} color={PLATFORM_COLORS[p.platform]} />
                          </div>
                          <div>
                            <div className="rpt-metric-row"><span className="rpt-metric-label">Engagement</span><span className="rpt-metric-value">{p.totalEngagement.toLocaleString()}</span></div>
                            <ProgressBar value={p.totalEngagement} max={Math.max(...platformSummary.map(x => x.totalEngagement), 1)} color={PLATFORM_COLORS[p.platform]} />
                          </div>
                        </div>
                        <div className="rpt-platform-footer">
                          <div><div className="rpt-footer-value">{p.totalPosts}</div><div className="rpt-footer-label">Posts</div></div>
                          <div><div className="rpt-footer-value">{p.endFollowers.toLocaleString()}</div><div className="rpt-footer-label">Followers</div></div>
                          <div><div className="rpt-footer-value" style={{ color: p.netGrowth >= 0 ? '#10b981' : '#ef4444' }}>{p.netGrowth >= 0 ? '+' : ''}{p.netGrowth.toLocaleString()}</div><div className="rpt-footer-label">Growth</div></div>
                          <div><div className="rpt-footer-value" style={{ color: '#f59e0b' }}>${p.totalBudget.toLocaleString()}</div><div className="rpt-footer-label">Budget</div></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Platform Detail View */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="rpt-platform-icon" style={{ background: PLATFORM_COLORS[selectedPlatform] }}>{selectedPlatform.charAt(0).toUpperCase()}</div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#1a1a1a', margin: 0, textTransform: 'capitalize' }}>{selectedPlatform}</h2>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="rpt-tabs">
                  {(['overview', 'posts', 'top'] as const).map(tab => (
                    <button key={tab} onClick={() => setPlatformTab(tab)} className={`rpt-tab ${platformTab === tab ? 'active' : ''}`}>{tab === 'top' ? 'Top Posts' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                  ))}
                </div>

                {platformTab === 'overview' && (
                  <>
                    <div className="rpt-kpi-grid">
                      {[
                        { label: 'Start Followers', value: currentKPI?.start_followers || 0 },
                        { label: 'End Followers', value: currentKPI?.end_followers || 0 },
                        { label: 'Net Growth', value: currentKPI?.net_growth || 0, color: (currentKPI?.net_growth || 0) >= 0 ? '#10b981' : '#ef4444' },
                        { label: 'Posts Published', value: currentKPI?.total_posts || calculatedTotals.totalPosts },
                        { label: 'Total Reach', value: currentKPI?.total_reach || calculatedTotals.totalReach },
                        { label: 'Impressions', value: currentKPI?.total_impressions_views || calculatedTotals.totalImpressions },
                        { label: 'Engagement', value: currentKPI?.total_engagement_interactions || calculatedTotals.totalEngagement }
                      ].map(item => (
                        <div key={item.label} className="rpt-kpi-card">
                          <div className="rpt-kpi-label">{item.label}</div>
                          <div className="rpt-kpi-value" style={{ color: item.color || '#1a1a1a' }}>{item.value.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={openKPIModal} className="rpt-btn-primary">{currentKPI ? 'Edit KPI Data' : 'Add KPI Data'}</button>
                  </>
                )}

                {platformTab === 'posts' && (
                  <div className="rpt-table-container">
                    {platformTargets.length === 0 ? (
                      <div className="rpt-empty">No posts for this platform</div>
                    ) : (
                      <table className="rpt-table">
                        <thead><tr>{['Title', 'Date', 'Budget', 'Status', 'Link', 'Reach', 'Eng.', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {platformTargets.map((target: any) => {
                            const metrics = target.metrics?.find((m: any) => m.metric_scope === 'lifetime')
                            return (
                              <tr key={target.id}>
                                <td style={{ fontWeight: 500, color: '#1a1a1a' }}>{target.post.title}</td>
                                <td style={{ color: '#666' }}>{new Date(target.post.planned_date).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600, color: '#f59e0b' }}>${(target.ad_budget || 0).toLocaleString()}</td>
                                <td><span style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '20px', background: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.bg || '#f0f0f0', color: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.text || '#666' }}>{target.platform_status}</span></td>
                                <td>{target.permalink ? <a href={target.permalink} target="_blank" rel="noopener noreferrer" style={{ color: PLATFORM_COLORS[selectedPlatform], fontWeight: 500 }}>View</a> : '-'}</td>
                                <td style={{ fontWeight: 500 }}>{(metrics?.reach || 0).toLocaleString()}</td>
                                <td style={{ fontWeight: 500 }}>{(metrics?.interactions || 0).toLocaleString()}</td>
                                <td><button onClick={() => openMetricsModal(target)} className="rpt-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Edit</button></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {platformTab === 'top' && (
                  <div className="rpt-top-grid">
                    <div className="rpt-top-card">
                      <h3 className="rpt-top-title">Top by Engagement</h3>
                      {topPostsByEngagement.length === 0 ? <p style={{ color: '#666' }}>No data</p> : (
                        <div className="rpt-top-list">
                          {topPostsByEngagement.map((t: any, idx) => (
                            <div key={t.id} className="rpt-top-item">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="rpt-top-rank" style={{ background: `${PLATFORM_COLORS[selectedPlatform]}20`, color: PLATFORM_COLORS[selectedPlatform] }}>{idx + 1}</span>
                                <span className="rpt-top-name">{t.post.title}</span>
                              </div>
                              <span className="rpt-top-value" style={{ color: PLATFORM_COLORS[selectedPlatform] }}>{t.engagement.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rpt-top-card">
                      <h3 className="rpt-top-title">Top by Reach</h3>
                      {topPostsByReach.length === 0 ? <p style={{ color: '#666' }}>No data</p> : (
                        <div className="rpt-top-list">
                          {topPostsByReach.map((t: any, idx) => (
                            <div key={t.id} className="rpt-top-item">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="rpt-top-rank" style={{ background: `${PLATFORM_COLORS[selectedPlatform]}20`, color: PLATFORM_COLORS[selectedPlatform] }}>{idx + 1}</span>
                                <span className="rpt-top-name">{t.post.title}</span>
                              </div>
                              <span className="rpt-top-value" style={{ color: PLATFORM_COLORS[selectedPlatform] }}>{t.reach.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* KPI Modal */}
      {showKPIModal && selectedPlatform && (
        <div className="rpt-modal" onClick={() => setShowKPIModal(false)}>
          <div className="rpt-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="rpt-modal-title" style={{ textTransform: 'capitalize' }}>{selectedPlatform} KPI</h3>
            <p className="rpt-modal-subtitle">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <div className="rpt-form-grid">
              {[{ key: 'start_followers', label: 'Start Followers' }, { key: 'end_followers', label: 'End Followers' }, { key: 'net_growth', label: 'Net Growth' }, { key: 'total_posts', label: 'Total Posts' }, { key: 'total_reach', label: 'Total Reach' }, { key: 'total_impressions_views', label: 'Total Impressions' }, { key: 'total_engagement_interactions', label: 'Total Engagement' }].map(({ key, label }) => (
                <div key={key} className="rpt-form-group">
                  <label className="rpt-label">{label}</label>
                  <input type="number" value={(kpiForm as any)[key]} onChange={(e) => setKpiForm({ ...kpiForm, [key]: Number(e.target.value) })} className="rpt-input" />
                </div>
              ))}
            </div>
            <div className="rpt-form-group">
              <label className="rpt-label">Notes</label>
              <textarea value={kpiForm.notes} onChange={(e) => setKpiForm({ ...kpiForm, notes: e.target.value })} rows={2} className="rpt-input" style={{ resize: 'none' }} />
            </div>
            <div className="rpt-modal-footer">
              <button onClick={() => setShowKPIModal(false)} className="rpt-btn-secondary">Cancel</button>
              <button onClick={handleSaveKPI} className="rpt-btn-primary">Save KPI</button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && selectedTarget && (
        <div className="rpt-modal" onClick={() => setShowMetricsModal(false)}>
          <div className="rpt-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="rpt-modal-title">Post Metrics</h3>
            <p className="rpt-modal-subtitle">{(selectedTarget as any).post?.title}</p>
            <div className="rpt-form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="rpt-label">Metric Scope</label>
              <select value={metricsForm.metric_scope} onChange={(e) => setMetricsForm({ ...metricsForm, metric_scope: e.target.value })} className="rpt-input">{['lifetime', 'week', 'month', 'custom'].map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="rpt-form-grid">
              {[{ key: 'reach', label: 'Reach' }, { key: 'impressions_views', label: 'Impressions/Views' }, { key: 'interactions', label: 'Interactions' }, { key: 'reactions', label: 'Reactions' }, { key: 'comments', label: 'Comments' }, { key: 'shares', label: 'Shares' }, { key: 'saves', label: 'Saves' }, { key: 'views', label: 'Video Views' }, { key: 'clicks', label: 'Clicks' }, { key: 'net_follows', label: 'Net Follows' }].map(({ key, label }) => (
                <div key={key} className="rpt-form-group">
                  <label className="rpt-label">{label}</label>
                  <input type="number" value={(metricsForm as any)[key]} onChange={(e) => setMetricsForm({ ...metricsForm, [key]: Number(e.target.value) })} className="rpt-input" />
                </div>
              ))}
            </div>
            <div className="rpt-modal-footer">
              <button onClick={() => setShowMetricsModal(false)} className="rpt-btn-secondary">Cancel</button>
              <button onClick={handleSaveMetrics} className="rpt-btn-primary">Save Metrics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
