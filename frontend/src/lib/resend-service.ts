// Resend Email Service for Payroll System and Notifications
// Professional email service using Resend API

interface SendPayrollEmailParams {
  employeeName: string;
  employeeEmail: string;
  monthEnding: string;
  payrollType: 'uk' | 'myanmar';
  pdfBase64: string;
  netPay?: string;
  currency?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TimeBlockReminderParams {
  userEmail: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  meetingLink?: string;
  notificationTime?: number;
  checklist?: ChecklistItem[];
  category?: string;
}

interface MeetingReminderParams {
  attendeeEmails: string[];
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  projectName?: string;
  meetingLink?: string;
  agendaItems?: string[];
  attendeesList?: string[];
  reminderTime?: number;
}

interface EmailResult {
  success: boolean;
  error?: string;
  sentCount?: number;
  failedEmails?: string[];
}

class ResendService {
  private apiKey: string;
  private apiUrl = 'https://api.resend.com/emails';

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';

    if (!this.apiKey) {
      console.warn('RESEND_API_KEY not found in environment variables');
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  private getEmailTemplate(params: SendPayrollEmailParams): { html: string; text: string } {
    const { employeeName, monthEnding, payrollType, netPay, currency } = params;
    const formattedDate = this.formatDate(monthEnding);
    const payType = payrollType === 'uk' ? 'UK' : 'Myanmar';
    const currencySymbol = currency || (payrollType === 'uk' ? '£' : 'MMK ');
    const payAmount = netPay ? `${currencySymbol}${parseFloat(netPay).toLocaleString()}` : null;
    
    // Theme colors matching payslip design
    const teal = '#4DA6A9';
    const lightTeal = '#DCF2F3';
    const darkText = '#333333';
    const grayText = '#666666';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${formattedDate}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${darkText}; letter-spacing: -0.5px;">
                      PAYSLIP
                    </h1>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${teal};">
                      Hush Healthcare
                    </p>
                    <p style="margin: 0; font-size: 11px; color: ${grayText};">
                      Ltd
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Company Bar -->
          <tr>
            <td style="background-color: ${teal}; padding: 10px 30px;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #ffffff;">
                Hush Healthcare Ltd${payrollType === 'myanmar' ? ' - Myanmar Division' : ''}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 8px 30px; border-bottom: 1px solid #dddddd;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 10px; color: ${grayText};">Healthcare Services</p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 10px; color: ${grayText};">${payType} Payroll</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Employee Section -->
          <tr>
            <td style="padding: 20px 30px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: ${teal}; padding: 8px 15px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #ffffff;">
                      Employee Details
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${lightTeal}; padding: 15px;">
                    <p style="margin: 0 0 5px; font-size: 10px; font-weight: 600; color: #555555;">Employee Name</p>
                    <p style="margin: 0; font-size: 14px; color: ${darkText};">${employeeName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Period Row -->
          <tr>
            <td style="padding: 15px 30px; border-bottom: 1px solid #dddddd;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; color: ${darkText};">
                      <strong>Period End:</strong> ${formattedDate}
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 11px; color: ${darkText};">
                      <strong>Issue Date:</strong> ${new Date().toLocaleDateString('en-GB')}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Net Pay Box -->
          ${payAmount ? `
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
                  <td style="background-color: ${teal}; padding: 20px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">NET PAY</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${payAmount}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Message Content -->
          <tr>
            <td style="padding: 20px 30px;">
              <p style="margin: 0 0 20px; font-size: 14px; color: ${darkText}; line-height: 1.6;">
                Dear ${employeeName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 13px; color: #555555; line-height: 1.6;">
                Please find attached your payslip for the period ending <strong>${formattedDate}</strong>.
              </p>
              
              <!-- Important Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: ${teal}; padding: 8px 15px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #ffffff;">
                      Important Information
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${lightTeal}; padding: 15px;">
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #555555; line-height: 1.8;">
                      <li>Please review your payslip carefully for accuracy</li>
                      <li>Keep this document for your personal records</li>
                      <li>Contact HR within 5 working days if you notice any discrepancies</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Attachment Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #f5f5f5; border: 1px solid #dddddd; padding: 12px 15px;">
                    <p style="margin: 0; font-size: 12px; color: #555555;">
                      <strong>Attachment:</strong> Payslip_${formattedDate.replace(/\s/g, '_')}.pdf
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 12px; color: #555555;">
                If you have any questions regarding your payslip, please contact the HR department.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${lightTeal}; padding: 20px 30px; border-top: 1px solid #dddddd;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 3px; font-size: 13px; color: ${darkText}; font-weight: 600;">
                      Hush Healthcare Ltd
                    </p>
                    <p style="margin: 0; font-size: 11px; color: ${grayText};">
                      Payroll Department
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 10px; color: #999999;">
                      This is an automated email.<br>
                      Please do not reply directly.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Legal Footer -->
          <tr>
            <td style="padding: 15px 30px; background-color: ${teal};">
              <p style="margin: 0; font-size: 9px; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.5;">
                This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed. 
                If you have received this email in error, please notify the sender immediately and delete it from your system.
              </p>
            </td>
          </tr>
          
        </table>
        
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #999999;">
                ${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `.trim();

    const text = `
HUSH HEALTHCARE LTD
Payroll Department
------------------------------------------------------------

${payType.toUpperCase()} PAYSLIP | Period: ${formattedDate}

------------------------------------------------------------

Dear ${employeeName},

Please find attached your payslip for the period ending ${formattedDate}.

${payAmount ? `NET PAY THIS PERIOD: ${payAmount}` : ''}

IMPORTANT INFORMATION:
- Please review your payslip carefully for accuracy
- Keep this document for your personal records
- Contact HR within 5 working days if you notice any discrepancies

ATTACHMENT: Payslip_${formattedDate.replace(/\s/g, '_')}.pdf

------------------------------------------------------------

If you have any questions regarding your payslip, please contact the HR department.

------------------------------------------------------------

Hush Healthcare Ltd
Payroll Department

This is an automated email. Please do not reply directly.

CONFIDENTIALITY NOTICE: This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed.

${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
    `.trim();

    return { html, text };
  }

  async sendPayrollEmail(params: SendPayrollEmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    try {
      const { html, text } = this.getEmailTemplate(params);
      const { employeeEmail, monthEnding, pdfBase64 } = params;
      const formattedDate = this.formatDate(monthEnding);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hush Healthcare Payroll <support@rothercarepharmacy.co.uk>',
          to: [employeeEmail],
          subject: `Payslip - ${formattedDate} | Hush Healthcare Ltd`,
          html,
          text,
          attachments: [
            {
              filename: `Payslip_${formattedDate.replace(/\s/g, '_')}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      await response.json();
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending payroll email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Format time for display (e.g., "14:30" -> "2:30 PM")
  private formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Generate time block reminder email template
  private getTimeBlockEmailTemplate(params: TimeBlockReminderParams): { html: string; text: string } {
    const { title, description, date, startTime, endTime, type, meetingLink, notificationTime, checklist, category } = params;
    
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
    
    const color = typeColors[type] || '#3b82f6';
    const label = typeLabels[type] || type;
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Generate checklist HTML
    const checklistHTML = checklist && checklist.length > 0 ? `
      <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${color};">
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
          📋 Task List
        </p>
        ${checklist.map((item, index) => `
          <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${index < checklist.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
            <span style="width: 20px; height: 20px; border-radius: 50%; background: ${item.completed ? '#10b981' : '#e5e7eb'}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">
              ${item.completed ? '✓' : (index + 1)}
            </span>
            <span style="font-size: 14px; color: ${item.completed ? '#9ca3af' : '#374151'}; ${item.completed ? 'text-decoration: line-through;' : ''}">${item.text}</span>
          </div>
        `).join('')}
      </div>
    ` : '';
    
    // Generate description HTML
    const descriptionHTML = description ? `
      <div style="margin-top: 16px; padding: 12px 16px; background: #fffbeb; border-radius: 8px; border-left: 3px solid #f59e0b;">
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${description}</p>
      </div>
    ` : '';
    
    const html = `
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
              <div style="width: 48px; height: 48px; background: ${color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px;">${type === 'focus' ? '🎯' : type === 'meeting' ? '📹' : type === 'goal' ? '🏆' : type === 'project' ? '📁' : '🌟'}</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.02em;">
                Upcoming: ${title}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #86868b;">
                ${label}${category ? ` • ${category}` : ''}
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
                    ${this.formatTimeDisplay(startTime)} - ${this.formatTimeDisplay(endTime)}
                  </p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #86868b;">
                    ${formattedDate}
                  </p>
                </div>
              </div>
              
              <!-- Notification time -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #86868b; background: #f5f5f7; padding: 12px 16px; border-radius: 8px;">
                ⏰ Starting in ${notificationTime || 15} minutes
              </p>
              
              ${meetingLink ? `
              <!-- Meeting Link -->
              <a href="${meetingLink}" style="display: block; text-align: center; background: linear-gradient(135deg, ${color}, ${color}dd); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 16px; box-shadow: 0 4px 12px ${color}40;">
                📹 Join Meeting
              </a>
              <p style="margin: 0 0 16px; font-size: 12px; color: #86868b; text-align: center; word-break: break-all;">
                ${meetingLink}
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

    // Plain text version
    let text = `
═══════════════════════════════════════
UPCOMING: ${title}
═══════════════════════════════════════

Type: ${label}${category ? ` | Category: ${category}` : ''}

⏰ Time: ${this.formatTimeDisplay(startTime)} - ${this.formatTimeDisplay(endTime)}
📅 Date: ${formattedDate}

🔔 Starting in ${notificationTime || 15} minutes
`;

    if (meetingLink) {
      text += `
───────────────────────────────────────
📹 MEETING LINK
───────────────────────────────────────
${meetingLink}
`;
    }

    if (description) {
      text += `
───────────────────────────────────────
📝 DESCRIPTION
───────────────────────────────────────
${description}
`;
    }

    if (checklist && checklist.length > 0) {
      text += `
───────────────────────────────────────
📋 TASK LIST
───────────────────────────────────────
`;
      checklist.forEach((item, index) => {
        const status = item.completed ? '✓' : '○';
        text += `${status} ${index + 1}. ${item.text}\n`;
      });
    }

    text += `
═══════════════════════════════════════
Focus Project — Your Personal Productivity App
`;

    return { html, text };
  }

  // Send time block reminder email
  async sendTimeBlockReminder(params: TimeBlockReminderParams): Promise<EmailResult> {
    if (!this.apiKey) {
      console.log('Time block reminder (API key not configured):', params.title);
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    try {
      const { html, text } = this.getTimeBlockEmailTemplate(params);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Focus Project <support@rothercarepharmacy.co.uk>',
          to: [params.userEmail],
          subject: `⏰ Reminder: ${params.title} starting soon`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      await response.json();
      console.log(`✅ Time block reminder sent to: ${params.userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending time block reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generate meeting reminder email template
  private getMeetingEmailTemplate(params: MeetingReminderParams): { html: string; text: string } {
    const { title, description, date, time, duration, projectName, meetingLink, agendaItems, attendeesList, reminderTime } = params;
    
    const color = '#f59e0b';
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Generate agenda HTML
    const agendaHTML = agendaItems && agendaItems.length > 0 ? `
      <div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
          📋 Meeting Agenda
        </p>
        ${agendaItems.map((item, index) => `
          <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; ${index < agendaItems.length - 1 ? 'border-bottom: 1px solid #fde68a;' : ''}">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #f59e0b; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">
              ${index + 1}
            </span>
            <span style="font-size: 14px; color: #78350f; line-height: 1.5;">${item}</span>
          </div>
        `).join('')}
      </div>
    ` : '';
    
    // Generate attendees HTML
    const attendeesHTML = attendeesList && attendeesList.length > 0 ? `
      <div style="margin-top: 16px;">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
          👥 Attendees (${attendeesList.length})
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${attendeesList.map(attendee => `
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
    
    // Generate description HTML
    const descriptionHTML = description ? `
      <div style="margin-top: 16px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border-left: 3px solid #6b7280;">
        <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Description</p>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${description}</p>
      </div>
    ` : '';
    
    const html = `
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
              <div style="width: 56px; height: 56px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); margin-bottom: 16px;">
                <span style="font-size: 28px;">📹</span>
              </div>
              ${projectName ? `
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                ${projectName}
              </p>
              ` : ''}
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #78350f; letter-spacing: -0.02em; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <!-- Time & Date Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center; width: 33%;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">📅 DATE</p>
                    <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">${formattedDate}</p>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center; width: 33%;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">⏰ TIME</p>
                    <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">${this.formatTimeDisplay(time)}</p>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="padding: 16px; background: #fef3c7; border-radius: 12px; text-align: center; width: 33%;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">⏱️ DURATION</p>
                    <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 600;">${duration} min</p>
                  </td>
                </tr>
              </table>
              
              <!-- Notification time -->
              <p style="margin: 0 0 20px; font-size: 14px; color: #ffffff; background: linear-gradient(135deg, #f59e0b, #d97706); padding: 14px 18px; border-radius: 10px; text-align: center; font-weight: 600;">
                🔔 Meeting starts in ${reminderTime || 15} minutes
              </p>
              
              ${meetingLink ? `
              <!-- Meeting Link -->
              <a href="${meetingLink}" style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 18px 24px; border-radius: 14px; font-size: 16px; font-weight: 600; margin-bottom: 12px; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                📹 Join Meeting Now
              </a>
              <p style="margin: 0 0 20px; font-size: 12px; color: #6b7280; text-align: center; word-break: break-all;">
                ${meetingLink}
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

    // Plain text version
    let text = `
═══════════════════════════════════════════════
📹 MEETING REMINDER: ${title}
═══════════════════════════════════════════════

${projectName ? `Project: ${projectName}\n` : ''}
📅 Date: ${formattedDate}
⏰ Time: ${this.formatTimeDisplay(time)}
⏱️ Duration: ${duration} minutes

🔔 Meeting starts in ${reminderTime || 15} minutes
`;

    if (meetingLink) {
      text += `
───────────────────────────────────────────────
📹 MEETING LINK
───────────────────────────────────────────────
${meetingLink}
`;
    }

    if (description) {
      text += `
───────────────────────────────────────────────
📝 DESCRIPTION
───────────────────────────────────────────────
${description}
`;
    }

    if (agendaItems && agendaItems.length > 0) {
      text += `
───────────────────────────────────────────────
📋 MEETING AGENDA
───────────────────────────────────────────────
`;
      agendaItems.forEach((item, index) => {
        text += `${index + 1}. ${item}\n`;
      });
    }

    if (attendeesList && attendeesList.length > 0) {
      text += `
───────────────────────────────────────────────
👥 ATTENDEES (${attendeesList.length})
───────────────────────────────────────────────
${attendeesList.join(', ')}
`;
    }

    text += `
═══════════════════════════════════════════════
Focus Project — Project Management & Productivity
`;

    return { html, text };
  }

  // Send meeting reminder email to all attendees
  async sendMeetingReminder(params: MeetingReminderParams): Promise<EmailResult> {
    if (!this.apiKey) {
      console.log('Meeting reminder (API key not configured):', params.title);
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    const { attendeeEmails } = params;
    if (!attendeeEmails || attendeeEmails.length === 0) {
      return {
        success: false,
        error: 'No attendee emails provided',
      };
    }

    const { html, text } = this.getMeetingEmailTemplate(params);
    const failedEmails: string[] = [];
    let sentCount = 0;

    for (const email of attendeeEmails) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Focus Project <support@rothercarepharmacy.co.uk>',
            to: [email],
            subject: `📹 Reminder: ${params.title} - Starting in ${params.reminderTime || 15} minutes`,
            html,
            text,
          }),
        });

        if (response.ok) {
          sentCount++;
          console.log(`✅ Meeting reminder sent to: ${email}`);
        } else {
          failedEmails.push(email);
          console.error(`❌ Failed to send to: ${email}`);
        }
      } catch (error) {
        failedEmails.push(email);
        console.error(`❌ Error sending to ${email}:`, error);
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    };
  }
}

export const resendService = new ResendService();
