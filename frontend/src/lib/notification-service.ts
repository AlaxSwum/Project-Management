// Notification Service for Project Management System

interface NotificationData {
  recipient_id: number;
  sender_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
}

class NotificationService {
  private supabase: any;

  constructor() {
    this.initSupabase();
  }

  private async initSupabase() {
    if (!this.supabase) {
      const { supabase } = await import('@/lib/supabase');
      this.supabase = supabase;
    }
  }

  async sendNotification(notificationData: NotificationData) {
    await this.initSupabase();
    
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert([{
          recipient_id: notificationData.recipient_id,
          sender_id: notificationData.sender_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error sending notification:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return { success: false, error };
    }
  }

  async sendTaskAssignmentNotification(taskId: number, assignedUserId: number, assignedByUserId: number, taskTitle: string) {
    return await this.sendNotification({
      recipient_id: assignedUserId,
      sender_id: assignedByUserId,
      type: 'task_assignment',
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${taskTitle}`,
      data: { task_id: taskId, task_title: taskTitle }
    });
  }

  async sendTaskUpdateNotification(taskId: number, userId: number, updatedByUserId: number, taskTitle: string, updateType: string) {
    return await this.sendNotification({
      recipient_id: userId,
      sender_id: updatedByUserId,
      type: 'task_update',
      title: 'Task Updated',
      message: `Task "${taskTitle}" has been ${updateType}`,
      data: { task_id: taskId, task_title: taskTitle, update_type: updateType }
    });
  }

  async sendProjectInviteNotification(projectId: number, invitedUserId: number, invitedByUserId: number, projectName: string) {
    return await this.sendNotification({
      recipient_id: invitedUserId,
      sender_id: invitedByUserId,
      type: 'project_invite',
      title: 'Project Invitation',
      message: `You have been invited to join project: ${projectName}`,
      data: { project_id: projectId, project_name: projectName }
    });
  }

  async markAsRead(notificationId: number) {
    await this.initSupabase();
    
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error };
    }
  }

  async getNotifications(userId: number, limit: number = 50) {
    await this.initSupabase();
    
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { success: false, error };
    }
  }
}

export const notificationService = new NotificationService();