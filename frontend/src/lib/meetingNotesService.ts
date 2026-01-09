// Sub-section for organizing notes by person/topic
export interface NoteSection {
  id: string;
  name: string;
  notes: string[];
}

export interface MeetingNote {
  id?: number;
  meeting_id: number;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  discussion_points: string[];
  decisions_made: string[];
  action_items: string[];
  next_steps: string[];
  // New sectioned notes - stored as JSON
  discussion_sections?: NoteSection[];
  decision_sections?: NoteSection[];
  action_sections?: NoteSection[];
  next_step_sections?: NoteSection[];
  follow_up_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

class MeetingNotesService {
  async getMeetingNotes(meetingId: number): Promise<MeetingNote | null> {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

      if (error) {
        console.error('Error fetching meeting notes:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getMeetingNotes:', error);
      return null;
    }
  }

  async createMeetingNotes(notes: MeetingNote): Promise<MeetingNote> {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('meeting_notes')
        .insert([notes])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create meeting notes: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createMeetingNotes:', error);
      throw error;
    }
  }

  async updateMeetingNotes(id: number, notes: Partial<MeetingNote>): Promise<MeetingNote> {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('meeting_notes')
        .update({ ...notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update meeting notes: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateMeetingNotes:', error);
      throw error;
    }
  }

  async deleteMeetingNotes(id: number): Promise<void> {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('meeting_notes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete meeting notes: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteMeetingNotes:', error);
      throw error;
    }
  }
}

export const meetingNotesService = new MeetingNotesService(); 