'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import {
  Company, ContentPost, ContentPostTarget, ContentPostMetrics, CompanyKPIOverview,
  Platform, PLATFORMS, PLATFORM_COLORS, STATUS_COLORS, PLATFORM_STATUS_COLORS
} from '@/types/content-calendar-v3'

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
  
  const [kpiForm, setKpiForm] = useState({
    start_followers: 0, end_followers: 0, net_growth: 0,
    total_posts: 0, total_reach: 0, total_impressions_views: 0,
    total_engagement_interactions: 0, notes: ''
  })

  const [metricsForm, setMetricsForm] = useState({
    metric_scope: 'lifetime', range_start: '', range_end: '',
    reach: 0, impressions_views: 0, interactions: 0, reactions: 0,
    comments: 0, shares: 0, saves: 0, net_follows: 0, views: 0, clicks: 0
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (error) throw error
      setCompany(data)
    } catch (err) { router.push('/content-calendar') }
  }, [companyId, router])

  const fetchPosts = useCallback(async () => {
    if (!companyId) return
    setIsLoading(true)
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

  const fetchKPI = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_kpi_overview').select('*').eq('company_id', companyId)
      setKpiData(data || [])
    } catch (err) { console.error('Error:', err) }
  }, [companyId])

  useEffect(() => {
    if (user?.id && companyId) { fetchCompany(); fetchPosts(); fetchKPI() }
  }, [user?.id, companyId, fetchCompany, fetchPosts, fetchKPI])

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
    platformTargets.forEach(t => {
      const m = (t as any).metrics?.find((m: any) => m.metric_scope === 'lifetime')
      if (m) { totalReach += m.reach || 0; totalImpressions += m.impressions_views || 0; totalEngagement += m.interactions || 0 }
    })
    return { totalReach, totalImpressions, totalEngagement, totalPosts: platformTargets.filter(t => t.platform_status === 'published').length }
  }, [platformTargets])

  const topPostsByEngagement = useMemo(() => {
    return [...platformTargets].map((t: any) => ({ ...t, engagement: t.metrics?.find((m: any) => m.metric_scope === 'lifetime')?.interactions || 0 })).sort((a, b) => b.engagement - a.engagement).slice(0, 5)
  }, [platformTargets])

  const topPostsByReach = useMemo(() => {
    return [...platformTargets].map((t: any) => ({ ...t, reach: t.metrics?.find((m: any) => m.metric_scope === 'lifetime')?.reach || 0 })).sort((a, b) => b.reach - a.reach).slice(0, 5)
  }, [platformTargets])

  const platformSummary = useMemo(() => {
    const monthStart = getMonthStart(selectedMonth)
    return PLATFORMS.map(platform => {
      const kpi = kpiData.find(k => k.platform === platform && k.report_month === monthStart)
      const targets = filteredPosts.flatMap(post => (post.targets || []).filter(t => t.platform === platform))
      return {
        platform,
        netGrowth: kpi?.net_growth || 0,
        totalPosts: targets.filter(t => t.platform_status === 'published').length,
        totalReach: kpi?.total_reach || 0,
        totalImpressions: kpi?.total_impressions_views || 0,
        totalEngagement: kpi?.total_engagement_interactions || 0,
        startFollowers: kpi?.start_followers || 0,
        endFollowers: kpi?.end_followers || 0
      }
    })
  }, [filteredPosts, kpiData, selectedMonth])

  const overallStats = useMemo(() => {
    const all = platformSummary.reduce((acc, p) => ({
      totalPosts: acc.totalPosts + p.totalPosts,
      totalReach: acc.totalReach + p.totalReach,
      totalEngagement: acc.totalEngagement + p.totalEngagement,
      totalGrowth: acc.totalGrowth + p.netGrowth
    }), { totalPosts: 0, totalReach: 0, totalEngagement: 0, totalGrowth: 0 })
    return all
  }, [platformSummary])

  const handleSaveKPI = async () => {
    if (!selectedPlatform) return
    const monthStart = getMonthStart(selectedMonth)
    try {
      const { supabase } = await import('@/lib/supabase')
      if (currentKPI) {
        await supabase.from('company_kpi_overview').update({ ...kpiForm }).eq('id', currentKPI.id)
      } else {
        await supabase.from('company_kpi_overview').insert({ company_id: companyId, report_month: monthStart, platform: selectedPlatform, ...kpiForm })
      }
      setShowKPIModal(false)
      fetchKPI()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleSaveMetrics = async () => {
    if (!selectedTarget) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const existingMetrics = (selectedTarget as any).metrics?.find((m: any) => m.metric_scope === metricsForm.metric_scope)
      if (existingMetrics) {
        await supabase.from('content_post_metrics').update({ ...metricsForm }).eq('id', existingMetrics.id)
      } else {
        await supabase.from('content_post_metrics').insert({ post_target_id: selectedTarget.id, ...metricsForm })
      }
      setShowMetricsModal(false)
      fetchPosts()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const openKPIModal = () => {
    if (currentKPI) {
      setKpiForm({ start_followers: currentKPI.start_followers, end_followers: currentKPI.end_followers, net_growth: currentKPI.net_growth, total_posts: currentKPI.total_posts, total_reach: currentKPI.total_reach, total_impressions_views: currentKPI.total_impressions_views, total_engagement_interactions: currentKPI.total_engagement_interactions, notes: currentKPI.notes || '' })
    } else {
      setKpiForm({ start_followers: 0, end_followers: 0, net_growth: 0, total_posts: calculatedTotals.totalPosts, total_reach: calculatedTotals.totalReach, total_impressions_views: calculatedTotals.totalImpressions, total_engagement_interactions: calculatedTotals.totalEngagement, notes: '' })
    }
    setShowKPIModal(true)
  }

  const openMetricsModal = (target: any) => {
    setSelectedTarget(target)
    const existingMetrics = target.metrics?.find((m: any) => m.metric_scope === 'lifetime')
    if (existingMetrics) {
      setMetricsForm({ metric_scope: existingMetrics.metric_scope, range_start: existingMetrics.range_start || '', range_end: existingMetrics.range_end || '', reach: existingMetrics.reach, impressions_views: existingMetrics.impressions_views, interactions: existingMetrics.interactions, reactions: existingMetrics.reactions, comments: existingMetrics.comments, shares: existingMetrics.shares, saves: existingMetrics.saves, net_follows: existingMetrics.net_follows, views: existingMetrics.views, clicks: existingMetrics.clicks })
    } else {
      setMetricsForm({ metric_scope: 'lifetime', range_start: '', range_end: '', reach: 0, impressions_views: 0, interactions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, net_follows: 0, views: 0, clicks: 0 })
    }
    setShowMetricsModal(true)
  }

  // Visual bar component
  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0
    return (
      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(percentage, 100)}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
    )
  }

  if (authLoading || !company) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title={company.name} isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '16px 32px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => router.push(`/content-calendar/${companyId}`)} style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>Back</button>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{company.name}</h1>
                <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>Performance Reports</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '10px 16px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none' }} />
              {selectedPlatform && (
                <button onClick={() => setSelectedPlatform(null)} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                  All Platforms
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          {!selectedPlatform ? (
            /* Overview Dashboard */
            <div>
              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Total Posts', value: overallStats.totalPosts, color: '#4f46e5', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { label: 'Total Reach', value: overallStats.totalReach.toLocaleString(), color: '#10b981', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                  { label: 'Total Engagement', value: overallStats.totalEngagement.toLocaleString(), color: '#f59e0b', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                  { label: 'Net Growth', value: (overallStats.totalGrowth >= 0 ? '+' : '') + overallStats.totalGrowth.toLocaleString(), color: overallStats.totalGrowth >= 0 ? '#16a34a' : '#dc2626', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2"><path d={stat.icon} /></svg>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Period Label */}
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 24px 0' }}>
                {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Performance
              </h2>
              
              {/* Platform Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {platformSummary.map(p => {
                  const maxReach = Math.max(...platformSummary.map(x => x.totalReach), 1)
                  const maxEngagement = Math.max(...platformSummary.map(x => x.totalEngagement), 1)
                  return (
                    <div
                      key={p.platform}
                      onClick={() => setSelectedPlatform(p.platform)}
                      style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = PLATFORM_COLORS[p.platform]; e.currentTarget.style.transform = 'translateY(-4px)' }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: PLATFORM_COLORS[p.platform], display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${PLATFORM_COLORS[p.platform]}40` }}>
                            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase' }}>{p.platform.charAt(0)}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{p.platform}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>Click for details</div>
                          </div>
                        </div>
                        
                        {/* Metrics with visual bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>Reach</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{p.totalReach.toLocaleString()}</span>
                            </div>
                            <ProgressBar value={p.totalReach} max={maxReach} color={PLATFORM_COLORS[p.platform]} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>Engagement</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{p.totalEngagement.toLocaleString()}</span>
                            </div>
                            <ProgressBar value={p.totalEngagement} max={maxEngagement} color={PLATFORM_COLORS[p.platform]} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Stats */}
                      <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{p.totalPosts}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{p.endFollowers.toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Followers</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: p.netGrowth >= 0 ? '#16a34a' : '#dc2626' }}>{p.netGrowth >= 0 ? '+' : ''}{p.netGrowth.toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Platform Details View */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: PLATFORM_COLORS[selectedPlatform], display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${PLATFORM_COLORS[selectedPlatform]}40` }}>
                  <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase' }}>{selectedPlatform.charAt(0)}</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>{selectedPlatform}</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', width: 'fit-content' }}>
                {(['overview', 'posts', 'top'] as const).map(tab => (
                  <button key={tab} onClick={() => setPlatformTab(tab)} style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer', background: platformTab === tab ? PLATFORM_COLORS[selectedPlatform] : 'transparent', color: platformTab === tab ? '#fff' : '#64748b', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {tab === 'top' ? 'Top Posts' : tab}
                  </button>
                ))}
              </div>

              {platformTab === 'overview' && (
                <div>
                  {/* KPI Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                      { label: 'Start Followers', value: currentKPI?.start_followers || 0 },
                      { label: 'End Followers', value: currentKPI?.end_followers || 0 },
                      { label: 'Net Growth', value: currentKPI?.net_growth || 0, color: (currentKPI?.net_growth || 0) >= 0 ? '#16a34a' : '#dc2626' },
                      { label: 'Posts Published', value: currentKPI?.total_posts || calculatedTotals.totalPosts },
                      { label: 'Total Reach', value: currentKPI?.total_reach || calculatedTotals.totalReach },
                      { label: 'Impressions', value: currentKPI?.total_impressions_views || calculatedTotals.totalImpressions },
                      { label: 'Engagement', value: currentKPI?.total_engagement_interactions || calculatedTotals.totalEngagement },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: item.color || '#1e293b' }}>{item.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={openKPIModal} style={{ padding: '14px 28px', fontSize: '14px', fontWeight: 600, borderRadius: '12px', border: 'none', background: PLATFORM_COLORS[selectedPlatform], color: '#fff', cursor: 'pointer', boxShadow: `0 8px 24px ${PLATFORM_COLORS[selectedPlatform]}40` }}>
                    {currentKPI ? 'Edit KPI Data' : 'Add KPI Data'}
                  </button>
                </div>
              )}

              {platformTab === 'posts' && (
                <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'auto' }}>
                  {platformTargets.length === 0 ? (
                    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '15px' }}>No posts for this platform</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                          {['Title', 'Date', 'Status', 'Permalink', 'Reach', 'Impr.', 'Eng.', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {platformTargets.map((target: any) => {
                          const metrics = target.metrics?.find((m: any) => m.metric_scope === 'lifetime')
                          return (
                            <tr key={target.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{target.post.title}</td>
                              <td style={{ padding: '14px 16px', color: '#475569' }}>{new Date(target.post.planned_date).toLocaleDateString()}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '20px', background: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.bg || '#f1f5f9', color: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.text || '#475569' }}>{target.platform_status}</span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                {target.permalink ? <a href={target.permalink} target="_blank" rel="noopener noreferrer" style={{ color: PLATFORM_COLORS[selectedPlatform], fontWeight: 500 }}>View</a> : '-'}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{(metrics?.reach || 0).toLocaleString()}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{(metrics?.impressions_views || 0).toLocaleString()}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{(metrics?.interactions || 0).toLocaleString()}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <button onClick={() => openMetricsModal(target)} style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {platformTab === 'top' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px 0' }}>Top by Engagement</h3>
                    {topPostsByEngagement.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '14px' }}>No data</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topPostsByEngagement.map((t: any, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${PLATFORM_COLORS[selectedPlatform]}20`, color: PLATFORM_COLORS[selectedPlatform], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>{idx + 1}</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{t.post.title}</span>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: PLATFORM_COLORS[selectedPlatform] }}>{t.engagement.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px 0' }}>Top by Reach</h3>
                    {topPostsByReach.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '14px' }}>No data</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topPostsByReach.map((t: any, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${PLATFORM_COLORS[selectedPlatform]}20`, color: PLATFORM_COLORS[selectedPlatform], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>{idx + 1}</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{t.post.title}</span>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: PLATFORM_COLORS[selectedPlatform] }}>{t.reach.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* KPI Modal */}
      {showKPIModal && selectedPlatform && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowKPIModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0', textTransform: 'capitalize' }}>{selectedPlatform} KPI</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'start_followers', label: 'Start Followers' },
                { key: 'end_followers', label: 'End Followers' },
                { key: 'net_growth', label: 'Net Growth' },
                { key: 'total_posts', label: 'Total Posts' },
                { key: 'total_reach', label: 'Total Reach' },
                { key: 'total_impressions_views', label: 'Total Impressions' },
                { key: 'total_engagement_interactions', label: 'Total Engagement' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{label}</label>
                  <input type="number" value={(kpiForm as any)[key]} onChange={(e) => setKpiForm({ ...kpiForm, [key]: Number(e.target.value) })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Notes</label>
              <textarea value={kpiForm.notes} onChange={(e) => setKpiForm({ ...kpiForm, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowKPIModal(false)} style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveKPI} style={{ padding: '14px 28px', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '10px', background: PLATFORM_COLORS[selectedPlatform], color: '#fff', cursor: 'pointer', boxShadow: `0 8px 24px ${PLATFORM_COLORS[selectedPlatform]}40` }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && selectedTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowMetricsModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflow: 'auto', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>Post Metrics</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>{(selectedTarget as any).post?.title}</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Metric Scope</label>
              <select value={metricsForm.metric_scope} onChange={(e) => setMetricsForm({ ...metricsForm, metric_scope: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                {['lifetime', 'week', 'month', 'custom'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { key: 'reach', label: 'Reach' },
                { key: 'impressions_views', label: 'Impressions/Views' },
                { key: 'interactions', label: 'Interactions' },
                { key: 'reactions', label: 'Reactions' },
                { key: 'comments', label: 'Comments' },
                { key: 'shares', label: 'Shares' },
                { key: 'saves', label: 'Saves' },
                { key: 'views', label: 'Video Views' },
                { key: 'clicks', label: 'Clicks' },
                { key: 'net_follows', label: 'Net Follows' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{label}</label>
                  <input type="number" value={(metricsForm as any)[key]} onChange={(e) => setMetricsForm({ ...metricsForm, [key]: Number(e.target.value) })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowMetricsModal(false)} style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveMetrics} style={{ padding: '14px 28px', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '10px', background: '#4f46e5', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
