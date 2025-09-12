// Brevo (Sendinblue) Email Service for Project Management System

interface EmailData {
  to: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: {
    name: string;
    email: string;
  };
}

class BrevoService {
  private apiKey: string;
  private apiUrl: string = 'https://api.sendinblue.com/v3';

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
  }

  async sendEmail(emailData: EmailData) {
    if (!this.apiKey) {
      console.error('Brevo API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: emailData.sender || {
            name: 'Project Management System',
            email: 'noreply@projectmanagement.com'
          },
          to: emailData.to.map(email => ({ email })),
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          textContent: emailData.textContent || this.stripHtml(emailData.htmlContent),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Brevo API error:', result);
        return { success: false, error: result };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      return { success: false, error };
    }
  }

  async sendTaskReminderEmail(userEmail: string, userName: string, tasks: any[]) {
    const htmlContent = this.generateTaskReminderHTML(userName, tasks);
    
    return await this.sendEmail({
      to: [userEmail],
      subject: `Task Reminders - ${tasks.length} pending task${tasks.length > 1 ? 's' : ''}`,
      htmlContent,
    });
  }

  async sendProjectInviteEmail(userEmail: string, userName: string, projectName: string, inviteLink: string) {
    const htmlContent = this.generateProjectInviteHTML(userName, projectName, inviteLink);
    
    return await this.sendEmail({
      to: [userEmail],
      subject: `Project Invitation: ${projectName}`,
      htmlContent,
    });
  }

  async sendTaskAssignmentEmail(userEmail: string, userName: string, taskTitle: string, taskDescription: string, projectName: string) {
    const htmlContent = this.generateTaskAssignmentHTML(userName, taskTitle, taskDescription, projectName);
    
    return await this.sendEmail({
      to: [userEmail],
      subject: `New Task Assignment: ${taskTitle}`,
      htmlContent,
    });
  }

  private generateTaskReminderHTML(userName: string, tasks: any[]): string {
    const taskList = tasks.map(task => `
      <li style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #3B82F6; background-color: #F8FAFC;">
        <strong>${task.title}</strong><br>
        <small>Due: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</small><br>
        <small>Project: ${task.project_name || 'Unknown'}</small>
      </li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Task Reminders</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Task Reminders</h2>
            <p>Hi ${userName},</p>
            <p>You have ${tasks.length} pending task${tasks.length > 1 ? 's' : ''} that need your attention:</p>
            <ul style="list-style: none; padding: 0;">
              ${taskList}
            </ul>
            <p>Please log in to your project management system to update these tasks.</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateProjectInviteHTML(userName: string, projectName: string, inviteLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Project Invitation</h2>
            <p>Hi ${userName},</p>
            <p>You have been invited to join the project: <strong>${projectName}</strong></p>
            <p>Click the link below to accept the invitation and start collaborating:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #F3F4F6; padding: 10px; border-radius: 5px;">${inviteLink}</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTaskAssignmentHTML(userName: string, taskTitle: string, taskDescription: string, projectName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Task Assignment</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">New Task Assignment</h2>
            <p>Hi ${userName},</p>
            <p>You have been assigned a new task in project <strong>${projectName}</strong>:</p>
            <div style="background-color: #F8FAFC; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #1F2937; margin-top: 0;">${taskTitle}</h3>
              <p style="margin-bottom: 0;">${taskDescription}</p>
            </div>
            <p>Please log in to your project management system to view the full details and start working on this task.</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const brevoService = new BrevoService();