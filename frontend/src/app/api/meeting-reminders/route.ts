import { NextRequest, NextResponse } from 'next/server';

// Email notification service for project meetings
// This can be integrated with Resend, SendGrid, or any email service

interface Meeting {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  project_name?: string;
  attendees_list?: string[];
  meeting_link?: string;
  agenda_items?: string[];
  reminder_time?: number;
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

// Calculate end time
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return formatTime(`${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`);
};

// Generate email HTML template for meetings
const generateMeetingEmailHTML = (meeting: Meeting): string => {
  const color = '#f59e0b'; // Amber color for meetings
  
  // Generate agenda HTML if present
  const agendaHTML = meeting.agenda_items && meeting.agenda_items.length > 0 ? `
    <div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 Meeting Agenda
      </p>
      ${meeting.agenda_items.map((item, index) => `
        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; ${index < meeting.agenda_items!.length - 1 ? 'border-bottom: 1px solid #fde68a;' : ''}">
          <span style="width: 24px; height: 24px; border-radius: 50%; background: #f59e0b; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">
            ${index + 1}
          </span>
          <span style="font-size: 14px; color: #78350f; line-height: 1.5;">${item}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  // Generate attendees HTML if present
  const attendeesHTML = meeting.attendees_list && meeting.attendees_list.length > 0 ? `
    <div style="margin-top: 16px;">
      <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
        👥 Attendees (${meeting.attendees_list.length})
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${meeting.attendees_list.map(attendee => `
          <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f3f4f6; border-radius: 20px; font-size: 13px; color: #374151;">
            <span style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600;">
              ${attendee.charAt(0).toUpperCase()}
            </span>
            ${attendee}
          </span>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Generate description HTML if present
  const descriptionHTML = meeting.description ? `
    <div style="margin-top: 16px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border-left: 3px solid #6b7280;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Description</p>
      <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${meeting.description}</p>
    </div>
  ` : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif; background-color: #f5f5f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 320px;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 580px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-bottom: 1px solid #fde68a;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 56px; height: 56px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
                  <span style="font-size: 28px;">📹</span>
                </div>
              </div>
              ${meeting.project_name ? `
              <p style="margin: 16px 0 6px; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                ${meeting.project_name}
              </p>
              ` : ''}
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #78350f; letter-spacing: -0.02em; line-height: 1.3;">
                ${meeting.title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <!-- Time & Date Card -->
              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">📅 DATE</p>
                  <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">
                    ${new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div style="flex: 1; padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">⏰ TIME</p>
                  <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">
                    ${formatTime(meeting.time)}
                  </p>
                </div>
                <div style="flex: 1; padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">⏱️ DURATION</p>
                  <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">
                    ${meeting.duration} min
                  </p>
                </div>
              </div>
              
              <!-- Notification time -->
              <p style="margin: 0 0 20px; font-size: 14px; color: #ffffff; background: linear-gradient(135deg, #f59e0b, #d97706); padding: 14px 18px; border-radius: 10px; text-align: center; font-weight: 600;">
                🔔 Meeting starts in ${meeting.reminder_time} minutes
              </p>
              
              ${meeting.meeting_link ? `
              <!-- Meeting Link -->
              <a href="${meeting.meeting_link}" style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 18px 24px; border-radius: 14px; font-size: 16px; font-weight: 600; margin-bottom: 12px; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                📹 Join Meeting Now
              </a>
              <p style="margin: 0 0 20px; font-size: 12px; color: #6b7280; text-align: center; word-break: break-all;">
                ${meeting.meeting_link}
              </p>
              ` : ''}
              
              ${descriptionHTML}
              ${agendaHTML}
              ${attendeesHTML}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                Focus Project — Project Management & Productivity
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

// Generate plain text email for meetings
const generateMeetingEmailText = (meeting: Meeting): string => {
  let text = `
═══════════════════════════════════════════════
📹 MEETING REMINDER: ${meeting.title}
═══════════════════════════════════════════════

${meeting.project_name ? `Project: ${meeting.project_name}\n` : ''}
📅 Date: ${new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
⏰ Time: ${formatTime(meeting.time)} - ${calculateEndTime(meeting.time, meeting.duration)}
⏱️ Duration: ${meeting.duration} minutes

🔔 Meeting starts in ${meeting.reminder_time} minutes
`;

  if (meeting.meeting_link) {
    text += `
───────────────────────────────────────────────
📹 MEETING LINK
───────────────────────────────────────────────
${meeting.meeting_link}
`;
  }

  if (meeting.description) {
    text += `
───────────────────────────────────────────────
📝 DESCRIPTION
───────────────────────────────────────────────
${meeting.description}
`;
  }

  if (meeting.agenda_items && meeting.agenda_items.length > 0) {
    text += `
───────────────────────────────────────────────
📋 MEETING AGENDA
───────────────────────────────────────────────
`;
    meeting.agenda_items.forEach((item, index) => {
      text += `${index + 1}. ${item}\n`;
    });
  }

  if (meeting.attendees_list && meeting.attendees_list.length > 0) {
    text += `
───────────────────────────────────────────────
👥 ATTENDEES (${meeting.attendees_list.length})
───────────────────────────────────────────────
${meeting.attendees_list.join(', ')}
`;
  }

  text += `
═══════════════════════════════════════════════
Focus Project — Project Management & Productivity
`;
  
  return text;
};

// Send email using Resend (you can replace this with SendGrid or any other service)
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log('Meeting email notification (RESEND_API_KEY not configured):');
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
        from: 'Focus Project <notifications@focus-project.co.uk>',
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
    console.error('Failed to send meeting email:', error);
    return false;
  }
}

// POST: Send a reminder for a specific meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meeting, attendeeEmails } = body as { meeting: Meeting; attendeeEmails: string[] };
    
    if (!meeting || !attendeeEmails || attendeeEmails.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: meeting and attendeeEmails' },
        { status: 400 }
      );
    }
    
    const results = await Promise.all(
      attendeeEmails.map(async (email) => {
        const emailPayload: EmailPayload = {
          to: email,
          subject: `📹 Reminder: ${meeting.title} - Starting in ${meeting.reminder_time} minutes`,
          html: generateMeetingEmailHTML(meeting),
          text: generateMeetingEmailText(meeting),
        };
        
        const success = await sendEmail(emailPayload);
        return { email, success };
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failedEmails = results.filter(r => !r.success).map(r => r.email);
    
    return NextResponse.json({ 
      success: true, 
      message: `Sent ${successCount}/${attendeeEmails.length} reminder emails`,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (error) {
    console.error('Error sending meeting reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Health check for the meeting reminder service
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'meeting-reminders',
    message: 'Meeting reminder service is running',
    timestamp: new Date().toISOString(),
  });
}

