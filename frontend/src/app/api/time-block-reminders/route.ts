import { NextRequest, NextResponse } from 'next/server';

// Email notification service for time blocks
// This can be integrated with Resend, SendGrid, or any email service

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'focus' | 'meeting' | 'personal' | 'goal' | 'project';
  meetingLink?: string;
  notificationTime?: number;
  userEmail?: string;
  checklist?: ChecklistItem[];
  category?: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Format time for display
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Generate email HTML template
const generateEmailHTML = (block: TimeBlock): string => {
  const typeColors: Record<string, string> = {
    focus: '#3b82f6',
    meeting: '#a855f7',
    personal: '#22c55e',
    goal: '#f59e0b',
    project: '#6366f1',
  };
  
  const typeLabels: Record<string, string> = {
    focus: '🎯 Focus Time',
    meeting: '📹 Meeting',
    personal: '🌟 Personal',
    goal: '🏆 Goal',
    project: '📁 Project',
  };
  
  const color = typeColors[block.type] || '#3b82f6';
  const label = typeLabels[block.type] || block.type;
  
  // Generate checklist HTML if present
  const checklistHTML = block.checklist && block.checklist.length > 0 ? `
    <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${color};">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 Task List
      </p>
      ${block.checklist.map((item, index) => `
        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${index < block.checklist!.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
          <span style="width: 20px; height: 20px; border-radius: 50%; background: ${item.completed ? '#10b981' : '#e5e7eb'}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">
            ${item.completed ? '✓' : (index + 1)}
          </span>
          <span style="font-size: 14px; color: ${item.completed ? '#9ca3af' : '#374151'}; ${item.completed ? 'text-decoration: line-through;' : ''}">${item.text}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  // Generate description HTML if present
  const descriptionHTML = block.description ? `
    <div style="margin-top: 16px; padding: 12px 16px; background: #fffbeb; border-radius: 8px; border-left: 3px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${block.description}</p>
    </div>
  ` : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Block Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif; background-color: #f5f5f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 320px;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%); border-bottom: 1px solid #f0f0f0;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: ${color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">${block.type === 'focus' ? '🎯' : block.type === 'meeting' ? '📹' : block.type === 'goal' ? '🏆' : block.type === 'project' ? '📁' : '🌟'}</span>
                </div>
              </div>
              <h1 style="margin: 16px 0 0; font-size: 24px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.02em;">
                Upcoming: ${block.title}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #86868b;">
                ${label}${block.category ? ` • ${block.category}` : ''}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 24px 32px;">
              <!-- Time -->
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 36px; height: 36px; background: #f5f5f7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 16px;">⏰</span>
                </div>
                <div>
                  <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1d1d1f;">
                    ${formatTime(block.startTime)} - ${formatTime(block.endTime)}
                  </p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #86868b;">
                    ${new Date(block.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <!-- Notification time -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #86868b; background: #f5f5f7; padding: 12px 16px; border-radius: 8px;">
                ⏰ Starting in ${block.notificationTime} minutes
              </p>
              
              ${block.meetingLink ? `
              <!-- Meeting Link -->
              <a href="${block.meetingLink}" style="display: block; text-align: center; background: linear-gradient(135deg, ${color}, ${color}dd); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 16px; box-shadow: 0 4px 12px ${color}40;">
                📹 Join Meeting
              </a>
              <p style="margin: 0 0 16px; font-size: 12px; color: #86868b; text-align: center; word-break: break-all;">
                ${block.meetingLink}
              </p>
              ` : ''}
              
              ${descriptionHTML}
              ${checklistHTML}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f9f9f9; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #86868b; text-align: center;">
                Focus Project — Your Personal Productivity App
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Generate plain text email
const generateEmailText = (block: TimeBlock): string => {
  const typeLabels: Record<string, string> = {
    focus: 'Focus Time',
    meeting: 'Meeting',
    personal: 'Personal',
    goal: 'Goal',
    project: 'Project',
  };
  
  let text = `
═══════════════════════════════════════
UPCOMING: ${block.title}
═══════════════════════════════════════

Type: ${typeLabels[block.type] || block.type}${block.category ? ` | Category: ${block.category}` : ''}

⏰ Time: ${formatTime(block.startTime)} - ${formatTime(block.endTime)}
📅 Date: ${new Date(block.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

🔔 Starting in ${block.notificationTime} minutes
`;

  if (block.meetingLink) {
    text += `
───────────────────────────────────────
📹 MEETING LINK
───────────────────────────────────────
${block.meetingLink}
`;
  }

  if (block.description) {
    text += `
───────────────────────────────────────
📝 DESCRIPTION
───────────────────────────────────────
${block.description}
`;
  }

  if (block.checklist && block.checklist.length > 0) {
    text += `
───────────────────────────────────────
📋 TASK LIST
───────────────────────────────────────
`;
    block.checklist.forEach((item, index) => {
      const status = item.completed ? '✓' : '○';
      text += `${status} ${index + 1}. ${item.text}\n`;
    });
  }

  text += `
═══════════════════════════════════════
Focus Project — Your Personal Productivity App
`;
  
  return text;
};

// Send email using Resend (you can replace this with SendGrid or any other service)
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log('Email notification (RESEND_API_KEY not configured):');
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    return true; // Return true for development/testing
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Focus <notifications@focus.app>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// POST: Send a reminder for a specific time block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { block, userEmail } = body as { block: TimeBlock; userEmail: string };
    
    if (!block || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: block and userEmail' },
        { status: 400 }
      );
    }
    
    const emailPayload: EmailPayload = {
      to: userEmail,
      subject: `⏰ Reminder: ${block.title} starting soon`,
      html: generateEmailHTML(block),
      text: generateEmailText(block),
    };
    
    const success = await sendEmail(emailPayload);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Reminder sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Check for upcoming blocks and send reminders
// This endpoint should be called by a cron job every minute
export async function GET(request: NextRequest) {
  try {
    // This would typically:
    // 1. Query the database for all blocks starting in the next hour
    // 2. Filter to those whose notification time matches
    // 3. Send emails for each matching block
    
    // For now, return a simple status
    return NextResponse.json({
      status: 'ok',
      message: 'Reminder service is running',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in reminder service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

