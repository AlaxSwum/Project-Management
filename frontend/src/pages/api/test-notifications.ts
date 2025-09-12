// API endpoint for testing the notification system

import { NextApiRequest, NextApiResponse } from 'next';
import { brevoService } from '../../lib/brevo-service';
import { notificationService } from '../../lib/notification-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, testType = 'basic' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let result;

    switch (testType) {
      case 'basic':
        // Test basic email functionality
        result = await brevoService.sendEmail({
          to: [email],
          subject: 'Test Email from Project Management System',
          htmlContent: `<h1>Test Email</h1><p>Hello Test User, this is a test email from your project management system.</p>`,
          sender: {
            name: 'Project Management System',
            email: 'noreply@projectmanagement.com'
          }
        });
        break;

      case 'task-assignment':
        // Test task assignment email
        result = await brevoService.sendTaskAssignmentEmail(
          email,
          'Test User',
          'Test Task Assignment',
          'This is a test task to verify the notification system is working correctly.',
          'Test Project'
        );
        break;

      case 'task-reminder':
        // Test task reminder email
        result = await brevoService.sendTaskReminderEmail(
          email,
          'Test User',
          [{
            title: 'Test Task Reminder',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            project_name: 'Test Project'
          }]
        );
        break;

      case 'account-info':
        // Test Brevo account connection
        result = { success: true, message: 'Brevo service is configured' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }

    return res.status(200).json({
      success: true,
      message: `${testType} test completed successfully`,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test notification failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Test notification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
