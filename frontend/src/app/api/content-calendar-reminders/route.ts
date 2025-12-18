import { NextRequest, NextResponse } from 'next/server'

// POST endpoint to trigger reminders for posts scheduled in next 2 hours
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get current time and 2 hours from now
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    
    // Get posts scheduled for today
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    const twoHoursTime = twoHoursFromNow.toTimeString().slice(0, 5)
    
    // Fetch posts that are scheduled for today and within 2 hours
    const { data: posts, error: postsError } = await supabase
      .from('content_posts')
      .select(`
        *,
        companies (name),
        content_post_targets (*)
      `)
      .eq('planned_date', today)
      .gte('planned_time', currentTime)
      .lte('planned_time', twoHoursTime)
      .in('status', ['approved', 'scheduled'])
    
    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }
    
    const reminders: any[] = []
    
    for (const post of posts || []) {
      // Get unpublished targets
      const unpublishedTargets = (post.content_post_targets || []).filter(
        (t: any) => t.platform_status !== 'published' && t.platform_status !== 'not_posting'
      )
      
      if (unpublishedTargets.length === 0) continue
      
      // Get owner info
      if (post.owner_id) {
        const { data: owner } = await supabase
          .from('auth_user')
          .select('email, name')
          .eq('id', post.owner_id)
          .single()
        
        if (owner?.email) {
          const platforms = unpublishedTargets.map((t: any) => t.platform).join(', ')
          const scheduledTime = `${post.planned_date} ${post.planned_time || '00:00'}`
          
          // Store reminder in a queue or send via webhook
          reminders.push({
            post_id: post.id,
            post_title: post.title,
            owner_email: owner.email,
            owner_name: owner.name,
            company: (post.companies as any)?.name,
            platforms,
            scheduled_time: scheduledTime,
            description: post.description,
            hashtags: post.hashtags
          })
        }
      }
    }
    
    // If SMTP is configured, send emails
    if (process.env.SMTP_HOST && reminders.length > 0) {
      // Placeholder for email sending - configure with your SMTP
      console.log('Would send emails to:', reminders.map(r => r.owner_email))
    }
    
    return NextResponse.json({
      success: true,
      reminders_count: reminders.length,
      reminders
    })
    
  } catch (error: any) {
    console.error('Reminder error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check upcoming posts
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const { data: posts, error } = await supabase
      .from('content_posts')
      .select(`
        id,
        title,
        planned_date,
        planned_time,
        status,
        owner_name,
        owner_id,
        description,
        hashtags,
        companies (name),
        content_post_targets (platform, platform_status)
      `)
      .eq('planned_date', today)
      .in('status', ['draft', 'approved', 'scheduled'])
      .order('planned_time')
    
    if (error) throw error
    
    // Get owner emails
    const upcoming = await Promise.all((posts || []).map(async (post) => {
      let ownerEmail = null
      if (post.owner_id) {
        const { data: owner } = await supabase
          .from('auth_user')
          .select('email')
          .eq('id', post.owner_id)
          .single()
        ownerEmail = owner?.email
      }
      
      const unpublishedPlatforms = (post.content_post_targets || [])
        .filter((t: any) => t.platform_status !== 'published')
        .map((t: any) => t.platform)
      
      return {
        id: post.id,
        title: post.title,
        scheduled_time: `${post.planned_date} ${post.planned_time || '00:00'}`,
        company: (post.companies as any)?.name,
        owner: post.owner_name,
        owner_email: ownerEmail,
        status: post.status,
        unpublished_platforms: unpublishedPlatforms,
        all_platforms: (post.content_post_targets || []).map((t: any) => ({
          platform: t.platform,
          status: t.platform_status
        }))
      }
    }))
    
    return NextResponse.json({
      today: today,
      current_time: now.toTimeString().slice(0, 5),
      upcoming_posts: upcoming.length,
      posts: upcoming
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
