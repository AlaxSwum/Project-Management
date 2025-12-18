import { NextRequest, NextResponse } from 'next/server'

// Dynamic import for resend to avoid build errors if not installed
const getResend = async () => {
  try {
    const { Resend } = await import('resend')
    return new Resend(process.env.RESEND_API_KEY)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get current time and 2 hours from now
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    
    // Get posts scheduled for the next 2 hours that haven't been published
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
          
          try {
            const resend = await getResend()
            if (!resend) {
              console.log('Resend not configured, skipping email')
              continue
            }
            await resend.emails.send({
              from: 'Content Calendar <noreply@focus-project.co.uk>',
              to: owner.email,
              subject: `Reminder: Post "${post.title}" scheduled soon`,
              html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">Content Calendar Reminder</h1>
                  </div>
                  
                  <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="color: #1e293b; font-size: 16px; margin: 0 0 24px 0;">
                      Hi ${owner.name || 'there'},
                    </p>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
                        ${post.title}
                      </h2>
                      
                      <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 14px;">Company:</span>
                        <span style="color: #1e293b; font-size: 14px; font-weight: 500; margin-left: 8px;">${(post.companies as any)?.name || 'Unknown'}</span>
                      </div>
                      
                      <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 14px;">Scheduled Time:</span>
                        <span style="color: #1e293b; font-size: 14px; font-weight: 500; margin-left: 8px;">${scheduledTime}</span>
                      </div>
                      
                      <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 14px;">Platforms:</span>
                        <span style="color: #4f46e5; font-size: 14px; font-weight: 600; margin-left: 8px; text-transform: capitalize;">${platforms}</span>
                      </div>
                      
                      ${post.description ? `
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 14px;">Caption:</span>
                          <p style="color: #1e293b; font-size: 14px; margin: 8px 0 0 0; line-height: 1.6;">${post.description}</p>
                        </div>
                      ` : ''}
                      
                      ${post.hashtags ? `
                        <div style="margin-top: 12px;">
                          <span style="color: #64748b; font-size: 14px;">Hashtags:</span>
                          <p style="color: #4f46e5; font-size: 14px; margin: 4px 0 0 0;">${post.hashtags}</p>
                        </div>
                      ` : ''}
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
                      This post is scheduled to go live soon. Please ensure it's published on the specified platforms.
                    </p>
                    
                    <a href="https://focus-project.co.uk/content-calendar/${post.company_id}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
                      Open Content Calendar
                    </a>
                  </div>
                  
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                    This is an automated reminder from the Content Calendar system.
                  </p>
                </div>
              `
            })
            
            reminders.push({
              post_id: post.id,
              post_title: post.title,
              sent_to: owner.email,
              platforms
            })
          } catch (emailError) {
            console.error('Error sending email:', emailError)
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      reminders_sent: reminders.length,
      details: reminders
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
        companies (name),
        content_post_targets (platform, platform_status)
      `)
      .eq('planned_date', today)
      .in('status', ['approved', 'scheduled'])
      .order('planned_time')
    
    if (error) throw error
    
    const upcoming = (posts || []).map(post => ({
      id: post.id,
      title: post.title,
      scheduled_time: `${post.planned_date} ${post.planned_time || '00:00'}`,
      company: (post.companies as any)?.name,
      owner: post.owner_name,
      platforms: (post.content_post_targets || []).map((t: any) => ({
        platform: t.platform,
        status: t.platform_status
      }))
    }))
    
    return NextResponse.json({
      today: today,
      upcoming_posts: upcoming.length,
      posts: upcoming
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
