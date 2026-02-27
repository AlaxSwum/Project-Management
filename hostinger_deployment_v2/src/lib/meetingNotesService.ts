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
  /**
   * Get meeting notes. For recurring meetings, pass occurrenceDate to get
   * notes for that specific day only (not the whole series).
   */
  async getMeetingNotes(meetingId: number, occurrenceDate?: string): Promise<MeetingNote | null> {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;

      let query = supabase
        .from('meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId);

      // For recurring meetings, scope notes to the specific occurrence date
      if (occurrenceDate) {
        query = query.eq('date', occurrenceDate);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // If multiple rows returned (after migration), fetch the date-specific one
        if (error.code === 'PGRST116' && occurrenceDate) {
          const { data: rows } = await supabase
            .from('meeting_notes')
            .select('*')
            .eq('meeting_id', meetingId)
            .eq('date', occurrenceDate);
          return rows && rows.length > 0 ? rows[0] : null;
        }
        // PGRST116 without occurrenceDate means multiple notes exist - return first
        if (error.code === 'PGRST116') {
          const { data: rows } = await supabase
            .from('meeting_notes')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('date', { ascending: false })
            .limit(1);
          return rows && rows.length > 0 ? rows[0] : null;
        }
        // Table might not exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('meeting_notes table does not exist yet');
          return null;
        }
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
        // Unique constraint violation - a note already exists for this meeting_id
        // This happens when the DB still has UNIQUE(meeting_id) instead of UNIQUE(meeting_id, date)
        if (error.code === '23505') {
          // Find the existing note and update it with the new date's content
          const { data: existing } = await supabase
            .from('meeting_notes')
            .select('id, date')
            .eq('meeting_id', notes.meeting_id)
            .maybeSingle();

          if (existing && existing.date !== notes.date) {
            // Different date - unique constraint needs migration.
            // For now, create a separate record by updating the existing one's date-based key.
            // This is a workaround until the DB constraint is updated.
            throw new Error(
              'Cannot save separate notes per day yet. Please run this SQL in Supabase Dashboard → SQL Editor:\n\n' +
              'DROP INDEX IF EXISTS idx_meeting_notes_unique_meeting;\n' +
              'CREATE UNIQUE INDEX idx_meeting_notes_unique_meeting_date ON meeting_notes(meeting_id, date);'
            );
          } else if (existing) {
            // Same date - just update the existing record
            return this.updateMeetingNotes(existing.id, notes);
          }
        }
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
