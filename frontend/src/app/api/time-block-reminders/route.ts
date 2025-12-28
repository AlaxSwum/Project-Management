import { NextRequest, NextResponse } from 'next/server';
import { resendService } from '../../../lib/resend-service';

// Email notification service for time blocks
// Uses the centralized Resend service for consistent email delivery

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
    
    console.log(`📧 Sending time block reminder to: ${userEmail} for: ${block.title}`);
    
    const result = await resendService.sendTimeBlockReminder({
      userEmail,
      title: block.title,
      description: block.description,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      type: block.type,
      meetingLink: block.meetingLink,
      notificationTime: block.notificationTime,
      checklist: block.checklist,
      category: block.category,
    });
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Reminder sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
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

// GET: Health check for the reminder service
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'time-block-reminders',
    message: 'Time block reminder service is running',
    timestamp: new Date().toISOString(),
  });
}
