// API endpoint for sending daily task reminders
// This should be called by a cron job or scheduled task daily

import { NextApiRequest, NextApiResponse } from 'next';
import { notificationService } from '../../lib/notification-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple authentication - you can enhance this with proper API keys
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET || 'your-secret-key';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily task reminder job...');
    
    await notificationService.sendTaskReminderNotifications();
    
    console.log('Daily task reminder job completed successfully');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Task reminders sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Daily task reminder job failed:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send task reminders',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
