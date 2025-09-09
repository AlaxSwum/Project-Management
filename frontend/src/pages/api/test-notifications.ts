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
        result = await brevoService.sendTestEmail({
          email,
          name: 'Test User'
        });
        break;

      case 'task-assignment':
        // Test task assignment email
        result = await brevoService.sendTaskAssignmentNotification(
          [{ email, name: 'Test User' }],
          {
            taskName: 'Test Task Assignment',
            taskDescription: 'This is a test task to verify the notification system is working correctly.',
            projectName: 'Test Project',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            priority: 'medium',
            assignedBy: 'System Administrator',
            assignedByEmail: 'admin@projectmanagement.com',
            projectUrl: 'http://localhost:3000/projects/1',
            taskUrl: 'http://localhost:3000/projects/1#task-1'
          }
        );
        break;

      case 'task-reminder':
        // Test task reminder email
        result = await brevoService.sendTaskReminderNotification(
          [{ email, name: 'Test User' }],
          {
            taskName: 'Test Task Reminder',
            taskDescription: 'This is a test task reminder to verify the notification system is working correctly.',
            projectName: 'Test Project',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            priority: 'high',
            timeUntilDue: 'tomorrow',
            projectUrl: 'http://localhost:3000/projects/1',
            taskUrl: 'http://localhost:3000/projects/1#task-1'
          }
        );
        break;

      case 'account-info':
        // Test Brevo account connection
        result = await brevoService.getAccountInfo();
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
