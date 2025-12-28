import { NextRequest, NextResponse } from 'next/server';
import { resendService } from '../../../lib/resend-service';

// Email notification service for project meetings
// Uses the centralized Resend service for consistent email delivery

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
    
    console.log(`📧 Sending meeting reminder for: ${meeting.title} to ${attendeeEmails.length} attendees`);
    
    const result = await resendService.sendMeetingReminder({
      attendeeEmails,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      projectName: meeting.project_name,
      meetingLink: meeting.meeting_link,
      agendaItems: meeting.agenda_items,
      attendeesList: meeting.attendees_list,
      reminderTime: meeting.reminder_time,
    });
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Sent ${result.sentCount}/${attendeeEmails.length} reminder emails`,
        sentCount: result.sentCount,
        failedEmails: result.failedEmails,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send emails' },
        { status: 500 }
      );
    }
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
