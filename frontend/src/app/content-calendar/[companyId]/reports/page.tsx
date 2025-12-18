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
    start_followers: 0,
    end_followers: 0,
    net_growth: 0,
    total_posts: 0,
    total_reach: 0,
    total_impressions_views: 0,
    total_engagement_interactions: 0,
    notes: ''
  })

  const [metricsForm, setMetricsForm] = useState({
    metric_scope: 'lifetime',
    range_start: '',
    range_end: '',
    reach: 0,
    impressions_views: 0,
    interactions: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    net_follows: 0,
    views: 0,
    clicks: 0
  })

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

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (error) throw error
      setCompany(data)
    } catch (err) {
      router.push('/content-calendar')
    }
  }, [companyId, router])

  const fetchPosts = useCallback(async () => {
    if (!companyId) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: postsData, error } = await supabase
        .from('content_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('planned_date', { ascending: false })
      
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
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  const fetchKPI = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_kpi_overview').select('*').eq('company_id', companyId)
      setKpiData(data || [])
    } catch (err) {
      console.error('Error:', err)
    }
  }, [companyId])

  useEffect(() => {
    if (user?.id && companyId) {
      fetchCompany()
      fetchPosts()
      fetchKPI()
    }
  }, [user?.id, companyId, fetchCompany, fetchPosts, fetchKPI])

  // Get first day of selected month
  const getMonthStart = (monthStr: string) => {
    return `${monthStr}-01`
  }

  // Get posts for selected month and platform
  const filteredPosts = useMemo(() => {
    const monthStart = getMonthStart(selectedMonth)
    const monthEnd = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1) - 1).toISOString().split('T')[0]
    
    return posts.filter(post => {
      const postDate = post.planned_date
      return postDate >= monthStart && postDate <= monthEnd
    })
  }, [posts, selectedMonth])

  // Get targets for selected platform
  const platformTargets = useMemo(() => {
    if (!selectedPlatform) return []
    return filteredPosts.flatMap(post => 
      (post.targets || []).filter(t => t.platform === selectedPlatform).map(t => ({ ...t, post }))
    )
  }, [filteredPosts, selectedPlatform])

  // Get KPI for selected month and platform
  const currentKPI = useMemo(() => {
    if (!selectedPlatform) return null
    const monthStart = getMonthStart(selectedMonth)
    return kpiData.find(k => k.platform === selectedPlatform && k.report_month === monthStart)
  }, [kpiData, selectedPlatform, selectedMonth])

  // Calculate totals from post metrics
  const calculatedTotals = useMemo(() => {
    const targets = platformTargets
    let totalReach = 0, totalImpressions = 0, totalEngagement = 0
    
    targets.forEach(t => {
      const lifetimeMetrics = t.metrics?.find(m => m.metric_scope === 'lifetime')
      if (lifetimeMetrics) {
        totalReach += lifetimeMetrics.reach || 0
        totalImpressions += lifetimeMetrics.impressions_views || 0
        totalEngagement += lifetimeMetrics.interactions || 0
      }
    })
    
    return { totalReach, totalImpressions, totalEngagement, totalPosts: targets.filter(t => t.platform_status === 'published').length }
  }, [platformTargets])

  // Top posts by engagement
  const topPostsByEngagement = useMemo(() => {
    return [...platformTargets]
      .map(t => {
        const metrics = t.metrics?.find(m => m.metric_scope === 'lifetime')
        return { ...t, engagement: metrics?.interactions || 0 }
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
  }, [platformTargets])

  // Top posts by reach
  const topPostsByReach = useMemo(() => {
    return [...platformTargets]
      .map(t => {
        const metrics = t.metrics?.find(m => m.metric_scope === 'lifetime')
        return { ...t, reach: metrics?.reach || 0 }
      })
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5)
  }, [platformTargets])

  // Platform summary for tiles
  const platformSummary = useMemo(() => {
    const monthStart = getMonthStart(selectedMonth)
    
    return PLATFORMS.map(platform => {
      const kpi = kpiData.find(k => k.platform === platform && k.report_month === monthStart)
      const targets = filteredPosts.flatMap(post => (post.targets || []).filter(t => t.platform === platform))
      const publishedCount = targets.filter(t => t.platform_status === 'published').length
      
      return {
        platform,
        netGrowth: kpi?.net_growth || 0,
        totalPosts: publishedCount,
        totalReach: kpi?.total_reach || 0,
        totalImpressions: kpi?.total_impressions_views || 0,
        totalEngagement: kpi?.total_engagement_interactions || 0
      }
    })
  }, [filteredPosts, kpiData, selectedMonth])

  const handleSaveKPI = async () => {
    if (!selectedPlatform) return
    const monthStart = getMonthStart(selectedMonth)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (currentKPI) {
        await supabase.from('company_kpi_overview').update({ ...kpiForm }).eq('id', currentKPI.id)
      } else {
        await supabase.from('company_kpi_overview').insert({
          company_id: companyId,
          report_month: monthStart,
          platform: selectedPlatform,
          ...kpiForm
        })
      }
      
      setShowKPIModal(false)
      fetchKPI()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleSaveMetrics = async () => {
    if (!selectedTarget) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Check if metrics exist for this target
      const existingMetrics = selectedTarget.metrics?.find(m => m.metric_scope === metricsForm.metric_scope)
      
      if (existingMetrics) {
        await supabase.from('content_post_metrics').update({ ...metricsForm }).eq('id', existingMetrics.id)
      } else {
        await supabase.from('content_post_metrics').insert({
          post_target_id: selectedTarget.id,
          ...metricsForm
        })
      }
      
      setShowMetricsModal(false)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const openKPIModal = () => {
    if (currentKPI) {
      setKpiForm({
        start_followers: currentKPI.start_followers,
        end_followers: currentKPI.end_followers,
        net_growth: currentKPI.net_growth,
        total_posts: currentKPI.total_posts,
        total_reach: currentKPI.total_reach,
        total_impressions_views: currentKPI.total_impressions_views,
        total_engagement_interactions: currentKPI.total_engagement_interactions,
        notes: currentKPI.notes || ''
      })
    } else {
      setKpiForm({
        start_followers: 0,
        end_followers: 0,
        net_growth: 0,
        total_posts: calculatedTotals.totalPosts,
        total_reach: calculatedTotals.totalReach,
        total_impressions_views: calculatedTotals.totalImpressions,
        total_engagement_interactions: calculatedTotals.totalEngagement,
        notes: ''
      })
    }
    setShowKPIModal(true)
  }

  const openMetricsModal = (target: ContentPostTarget & { post: ContentPost }) => {
    setSelectedTarget(target)
    const existingMetrics = target.metrics?.find(m => m.metric_scope === 'lifetime')
    if (existingMetrics) {
      setMetricsForm({
        metric_scope: existingMetrics.metric_scope,
        range_start: existingMetrics.range_start || '',
        range_end: existingMetrics.range_end || '',
        reach: existingMetrics.reach,
        impressions_views: existingMetrics.impressions_views,
        interactions: existingMetrics.interactions,
        reactions: existingMetrics.reactions,
        comments: existingMetrics.comments,
        shares: existingMetrics.shares,
        saves: existingMetrics.saves,
        net_follows: existingMetrics.net_follows,
        views: existingMetrics.views,
        clicks: existingMetrics.clicks
      })
    } else {
      setMetricsForm({
        metric_scope: 'lifetime',
        range_start: '',
        range_end: '',
        reach: 0,
        impressions_views: 0,
        interactions: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        net_follows: 0,
        views: 0,
        clicks: 0
      })
    }
    setShowMetricsModal(true)
  }

  if (authLoading || !company) {
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
        {isMobile && <MobileHeader title={company.name} isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => router.push(`/content-calendar/${companyId}`)} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Back</button>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>{company.name}</h1>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Reports</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              />
              {selectedPlatform && (
                <button onClick={() => setSelectedPlatform(null)} style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                  All Platforms
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          {!selectedPlatform ? (
            /* Platform Tiles View */
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 20px 0' }}>Platform Overview - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {platformSummary.map(p => (
                  <div
                    key={p.platform}
                    onClick={() => setSelectedPlatform(p.platform)}
                    style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = PLATFORM_COLORS[p.platform]}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: PLATFORM_COLORS[p.platform], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>{p.platform.charAt(0)}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>{p.platform}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Click to view details</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Net Growth</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: p.netGrowth >= 0 ? '#16a34a' : '#dc2626' }}>{p.netGrowth >= 0 ? '+' : ''}{p.netGrowth.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Posts</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{p.totalPosts}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Reach</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{p.totalReach.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Engagement</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{p.totalEngagement.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Platform Insights View */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: PLATFORM_COLORS[selectedPlatform], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>{selectedPlatform.charAt(0)}</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, textTransform: 'capitalize' }}>{selectedPlatform} Insights</h2>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', padding: '4px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
                {(['overview', 'posts', 'top'] as const).map(tab => (
                  <button key={tab} onClick={() => setPlatformTab(tab)} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', background: platformTab === tab ? PLATFORM_COLORS[selectedPlatform] : 'transparent', color: platformTab === tab ? '#fff' : '#6b7280', textTransform: 'capitalize' }}>
                    {tab === 'top' ? 'Top Posts' : tab}
                  </button>
                ))}
              </div>

              {platformTab === 'overview' && (
                <div>
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: 'Start Followers', value: currentKPI?.start_followers || 0 },
                      { label: 'End Followers', value: currentKPI?.end_followers || 0 },
                      { label: 'Net Growth', value: currentKPI?.net_growth || 0, color: (currentKPI?.net_growth || 0) >= 0 ? '#16a34a' : '#dc2626' },
                      { label: 'Total Posts', value: currentKPI?.total_posts || calculatedTotals.totalPosts },
                      { label: 'Total Reach', value: currentKPI?.total_reach || calculatedTotals.totalReach },
                      { label: 'Total Impressions', value: currentKPI?.total_impressions_views || calculatedTotals.totalImpressions },
                      { label: 'Total Engagement', value: currentKPI?.total_engagement_interactions || calculatedTotals.totalEngagement },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: item.color || '#111827' }}>{item.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={openKPIModal}
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: 'none', background: PLATFORM_COLORS[selectedPlatform], color: '#fff', cursor: 'pointer' }}
                  >
                    {currentKPI ? 'Edit KPI Data' : 'Add KPI Data'}
                  </button>
                </div>
              )}

              {platformTab === 'posts' && (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
                  {platformTargets.length === 0 ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <p style={{ color: '#6b7280' }}>No posts for this platform in selected month</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Title', 'Date', 'Status', 'Permalink', 'Reach', 'Impressions', 'Engagement', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {platformTargets.map((target: any) => {
                          const metrics = target.metrics?.find((m: ContentPostMetrics) => m.metric_scope === 'lifetime')
                          return (
                            <tr key={target.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827' }}>{target.post.title}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{new Date(target.post.planned_date).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '20px', background: PLATFORM_STATUS_COLORS[target.platform_status]?.bg, color: PLATFORM_STATUS_COLORS[target.platform_status]?.text }}>{target.platform_status}</span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {target.permalink ? (
                                  <a href={target.permalink} target="_blank" rel="noopener noreferrer" style={{ color: PLATFORM_COLORS[selectedPlatform], fontSize: '12px' }}>View</a>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{(metrics?.reach || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{(metrics?.impressions_views || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{(metrics?.interactions || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <button onClick={() => openMetricsModal(target)} style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit Metrics</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Top by Engagement</h3>
                    {topPostsByEngagement.length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>No data</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topPostsByEngagement.map((t: any, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>{idx + 1}</span>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{t.post.title}</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: PLATFORM_COLORS[selectedPlatform] }}>{t.engagement.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Top by Reach</h3>
                    {topPostsByReach.length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>No data</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topPostsByReach.map((t: any, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>{idx + 1}</span>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{t.post.title}</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: PLATFORM_COLORS[selectedPlatform] }}>{t.reach.toLocaleString()}</span>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowKPIModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0', textTransform: 'capitalize' }}>{selectedPlatform} KPI</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</label>
                  <input type="number" value={(kpiForm as any)[key]} onChange={(e) => setKpiForm({ ...kpiForm, [key]: Number(e.target.value) })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Notes</label>
              <textarea value={kpiForm.notes} onChange={(e) => setKpiForm({ ...kpiForm, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowKPIModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveKPI} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: PLATFORM_COLORS[selectedPlatform], color: '#fff', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && selectedTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowMetricsModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Post Metrics</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>{(selectedTarget as any).post?.title}</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Metric Scope</label>
              <select value={metricsForm.metric_scope} onChange={(e) => setMetricsForm({ ...metricsForm, metric_scope: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                {['lifetime', 'week', 'month', 'custom'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</label>
                  <input type="number" value={(metricsForm as any)[key]} onChange={(e) => setMetricsForm({ ...metricsForm, [key]: Number(e.target.value) })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowMetricsModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveMetrics} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
