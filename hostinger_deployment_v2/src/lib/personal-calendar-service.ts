import { supabase } from './supabase';

export interface PersonalTask {
  id?: number;
  user_id?: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  category?: string;
  project_id?: number;
  tags?: string[];
  completion_percentage?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  auto_scheduled?: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface PersonalEvent {
  id?: number;
  user_id?: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day?: boolean;
  location?: string;
  event_type?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'confirmed' | 'tentative' | 'cancelled';
  color?: string;
  recurring?: boolean;
  recurrence_pattern?: any;
  reminder_minutes?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface CalendarItem {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  location?: string;
  event_type: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  color: string;
  item_type: 'event' | 'task' | 'time_block' | 'meeting';
  completion_percentage?: number;
  estimated_duration?: number;
  category?: string;
}

class PersonalCalendarService {
  // Get current user ID from auth (as integer for compatibility)
  private async getCurrentUserId(): Promise<number | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Authentication error:', error);
        return null;
      }
      // Convert UUID to integer for compatibility with existing system
      return parseInt(user?.id?.toString() || '0') || null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  // Personal Tasks CRUD - Using personal_tasks table
  async getTasks(): Promise<PersonalTask[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      // Return the data as-is since it matches PersonalTask interface
      return data || [];
    } catch (error) {
      console.error('Error fetching personal tasks:', error);
      return [];
    }
  }

  async getUnscheduledTasks(): Promise<PersonalTask[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      // Get tasks that don't have scheduled times (unscheduled)
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', userId)
        .is('scheduled_start', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching unscheduled tasks:', error);
      return [];
    }
  }

  async createTask(taskData: Omit<PersonalTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PersonalTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([{
          user_id: userId,
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority,
          status: taskData.status || 'todo',
          category: taskData.category || 'personal',
          color: taskData.color || '#FFB333',
          due_date: taskData.due_date,
          tags: taskData.tags || [],
          completion_percentage: taskData.completion_percentage || 0,
          project_id: taskData.project_id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating personal task:', error);
      throw error;
    }
  }

  async updateTask(id: number, updates: Partial<PersonalTask>): Promise<PersonalTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('personal_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating personal task:', error);
      throw error;
    }
  }

  async scheduleTask(taskId: number, startTime: Date, duration?: number): Promise<PersonalTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const taskDuration = duration || 60; // Default 1 hour
      const endTime = new Date(startTime.getTime() + taskDuration * 60 * 1000);

      const { data, error } = await supabase
        .from('personal_tasks')
        .update({
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
          auto_scheduled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error scheduling task:', error);
      throw error;
    }
  }

  async unscheduleTask(taskId: number): Promise<PersonalTask | null> {
    try {
      return await this.updateTask(taskId, {
        scheduled_start: undefined,
        scheduled_end: undefined,
        auto_scheduled: false
      });
    } catch (error) {
      console.error('Error unscheduling task:', error);
      throw error;
    }
  }

  async getTaskById(id: number): Promise<PersonalTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  // Personal Events CRUD
  async getEvents(): Promise<PersonalEvent[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('personal_events')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching personal events:', error);
      return [];
    }
  }

  async createEvent(eventData: Omit<PersonalEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PersonalEvent | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('personal_events')
        .insert([{
          ...eventData,
          user_id: userId,
          color: eventData.color || '#5884FD'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating personal event:', error);
      throw error;
    }
  }

  async updateEvent(id: number, updates: Partial<PersonalEvent>): Promise<PersonalEvent | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('personal_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating personal event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('Authentication required');

      const { error } = await supabase
        .from('personal_events')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting personal event:', error);
      return false;
    }
  }

  // Get all calendar items (events, tasks, meetings) in unified format
  async getCalendarOverview(startDate?: Date, endDate?: Date): Promise<CalendarItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      // Use existing projects_meeting table for compatibility
      let query = supabase
        .from('projects_meeting')
        .select('*')
        .or(`created_by_id.eq.${userId},attendee_ids.cs.{${userId}}`);

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      // Transform to CalendarItem format
      const items: CalendarItem[] = (data || []).map(meeting => {
        const startDateTime = new Date(`${meeting.date}T${meeting.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (meeting.duration * 60000));
        
        return {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description || '',
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          all_day: meeting.all_day || false,
          location: meeting.location || '',
          event_type: meeting.event_type || 'meeting',
          priority: 'medium' as const,
          status: 'confirmed',
          color: meeting.color || '#5884FD',
          item_type: (meeting.event_type === 'task' ? 'task' : 'event') as 'event' | 'task' | 'time_block',
          completion_percentage: undefined,
          category: meeting.event_type || 'meeting'
        };
      });

      return items;
    } catch (error) {
      console.error('Error fetching calendar overview:', error);
      return [];
    }
  }

  // Auto-scheduling logic
  async findNextAvailableSlot(durationMinutes: number, preferredStart?: Date): Promise<{start: Date, end: Date} | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // Get working hours (9 AM - 5 PM by default)
      const workingStartHour = 9;
      const workingEndHour = 17;
      
      // Start looking from preferred time or next working hour
      const now = new Date();
      const searchStart = preferredStart || new Date(now.getTime() + (now.getHours() < workingStartHour ? 0 : 24 * 60 * 60 * 1000));
      searchStart.setHours(workingStartHour, 0, 0, 0);

      // Look for the next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const searchDate = new Date(searchStart);
        searchDate.setDate(searchStart.getDate() + dayOffset);
        
        // Skip weekends
        if (searchDate.getDay() === 0 || searchDate.getDay() === 6) continue;

        const dayStart = new Date(searchDate);
        dayStart.setHours(workingStartHour, 0, 0, 0);
        const dayEnd = new Date(searchDate);
        dayEnd.setHours(workingEndHour, 0, 0, 0);

        // Get existing events for this day
        const existingItems = await this.getCalendarOverview(dayStart, dayEnd);

        // Find available slots in 15-minute increments
        for (let minutes = 0; minutes < (workingEndHour - workingStartHour) * 60; minutes += 15) {
          const slotStart = new Date(dayStart.getTime() + minutes * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

          // Check if slot extends beyond working hours
          if (slotEnd > dayEnd) break;

          // Check for conflicts
          const hasConflict = existingItems.some(item => {
            const itemStart = new Date(item.start_datetime);
            const itemEnd = new Date(item.end_datetime);
            return (slotStart < itemEnd && slotEnd > itemStart);
          });

          if (!hasConflict) {
            return { start: slotStart, end: slotEnd };
          }
        }
      }

      return null; // No available slot found
    } catch (error) {
      console.error('Error finding available slot:', error);
      return null;
    }
  }

  // Helper method to get time slots for a specific day (15-minute intervals)
  getTimeSlots(date: Date): Array<{start: Date, end: Date, available: boolean}> {
    const slots = [];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000);

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: true // Will be determined by checking against existing events
        });
      }
    }

    return slots;
  }
}

export const personalCalendarService = new PersonalCalendarService();
