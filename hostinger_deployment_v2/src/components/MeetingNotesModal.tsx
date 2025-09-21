'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  CheckCircleIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { meetingNotesService, MeetingNote as MeetingNoteType } from '@/lib/meetingNotesService';

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: number;
  attendees_list?: string[];
}

interface MeetingNotesModalProps {
  meeting: Meeting;
  onClose: () => void;
  projectMembers?: any[];
}

export default function MeetingNotesModal({
  meeting,
  onClose,
  projectMembers = []
}: MeetingNotesModalProps) {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNoteType>({
    meeting_id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    attendees: meeting.attendees_list || [],
    discussion_points: [''],
    decisions_made: [''],
    action_items: [''],
    next_steps: [''],
    follow_up_date: '',
  });

  const [existingNotes, setExistingNotes] = useState<MeetingNoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAttendee, setNewAttendee] = useState('');
  const [activeDiscussionIndex, setActiveDiscussionIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notes = await meetingNotesService.getMeetingNotes(meeting.id);
        if (notes) {
          setExistingNotes(notes);
          setMeetingNotes({
            ...notes,
            discussion_points: notes.discussion_points.length > 0 ? notes.discussion_points : [''],
            decisions_made: notes.decisions_made.length > 0 ? notes.decisions_made : [''],
            action_items: notes.action_items.length > 0 ? notes.action_items : [''],
            next_steps: notes.next_steps.length > 0 ? notes.next_steps : [''],
          });
          setIsEditing(false); // Show document view for existing notes
        } else {
          setIsEditing(true); // Show edit mode for new notes
        }
      } catch (error) {
        console.error('Failed to load meeting notes:', error);
        setIsEditing(true); // Default to edit mode on error
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [meeting.id]);

  const addArrayField = (field: keyof MeetingNoteType, index?: number) => {
    setMeetingNotes(prev => {
      const currentArray = prev[field] as string[];
      if (index !== undefined) {
        const newArray = [...currentArray];
        newArray.splice(index + 1, 0, '');
        return { ...prev, [field]: newArray };
      } else {
        return { ...prev, [field]: [...currentArray, ''] };
      }
    });
  };

  const updateArrayField = (field: keyof MeetingNoteType, index: number, value: string) => {
    setMeetingNotes(prev => {
      const currentArray = prev[field] as string[];
      const newArray = [...currentArray];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const removeArrayField = (field: keyof MeetingNoteType, index: number) => {
    setMeetingNotes(prev => {
      const currentArray = prev[field] as string[];
      if (currentArray.length > 1) {
        const newArray = currentArray.filter((_, i) => i !== index);
        return { ...prev, [field]: newArray };
      }
      return prev;
    });
  };

  const addAttendee = () => {
    if (newAttendee.trim()) {
      setMeetingNotes(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (index: number) => {
    setMeetingNotes(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };

  const addProjectMember = (member: any) => {
    if (!meetingNotes.attendees.includes(member.name)) {
      setMeetingNotes(prev => ({
        ...prev,
        attendees: [...prev.attendees, member.name]
      }));
    }
  };

  const saveMeetingNotes = async () => {
    setSaving(true);
    try {
      const cleanedNotes = {
        ...meetingNotes,
        discussion_points: meetingNotes.discussion_points.filter(p => p.trim()),
        decisions_made: meetingNotes.decisions_made.filter(d => d.trim()),
        action_items: meetingNotes.action_items.filter(a => a.trim()),
        next_steps: meetingNotes.next_steps.filter(n => n.trim()),
        follow_up_date: meetingNotes.follow_up_date?.trim() || null,
      };

      let savedNotes;
      if (existingNotes?.id) {
        savedNotes = await meetingNotesService.updateMeetingNotes(existingNotes.id, cleanedNotes);
      } else {
        savedNotes = await meetingNotesService.createMeetingNotes(cleanedNotes);
      }
      
      setExistingNotes(savedNotes);
      setMeetingNotes(savedNotes);
      setIsEditing(false); // Switch to document view after saving
      alert('Meeting notes saved successfully!');
    } catch (error) {
      console.error('Failed to save meeting notes:', error);
      alert('Failed to save meeting notes');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (existingNotes) {
      // Restore original notes
      setMeetingNotes(existingNotes);
      setIsEditing(false);
    } else {
      // Close modal if no existing notes
      onClose();
    }
  };

  const handleDiscussionFocus = (index: number) => {
    setActiveDiscussionIndex(index);
  };

  // Document View Component
  const DocumentView = () => (
    <div className="document-view">
      <div className="document-header">
        <h1 className="document-title">Meeting Notes</h1>
        <div className="document-meta">
          <span className="meta-item">
            <strong>Meeting:</strong> {meetingNotes.title}
          </span>
          <span className="meta-item">
            <strong>Date:</strong> {(() => {
              // Parse date string manually to avoid timezone issues
              const [year, month, day] = meetingNotes.date.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            })()}
          </span>
          <span className="meta-item">
            <strong>Time:</strong> {meetingNotes.time}
          </span>
          {meetingNotes.follow_up_date && (
            <span className="meta-item">
              <strong>Follow-up Date:</strong> {(() => {
                // Parse date string manually to avoid timezone issues
                const [year, month, day] = meetingNotes.follow_up_date.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString();
              })()}
            </span>
          )}
        </div>
      </div>

      {meetingNotes.attendees.length > 0 && (
        <div className="document-section">
          <h3 className="section-heading">Attendees</h3>
          <div className="attendees-grid">
            {meetingNotes.attendees.map((attendee, index) => (
              <span key={index} className="attendee-chip">{attendee}</span>
            ))}
          </div>
        </div>
      )}

      {meetingNotes.discussion_points.filter(p => p.trim()).length > 0 && (
        <div className="document-section">
          <h3 className="section-heading">Key Discussion Points</h3>
          <ol className="discussion-list">
            {meetingNotes.discussion_points.filter(p => p.trim()).map((point, index) => (
              <li key={index} className="discussion-item-doc">{point}</li>
            ))}
          </ol>
        </div>
      )}

      {meetingNotes.decisions_made.filter(d => d.trim()).length > 0 && (
        <div className="document-section">
          <h3 className="section-heading">Decisions Made</h3>
          <ul className="decision-list">
            {meetingNotes.decisions_made.filter(d => d.trim()).map((decision, index) => (
              <li key={index} className="decision-item">{decision}</li>
            ))}
          </ul>
        </div>
      )}

      {meetingNotes.action_items.filter(a => a.trim()).length > 0 && (
        <div className="document-section">
          <h3 className="section-heading">Action Items</h3>
          <ul className="action-list">
            {meetingNotes.action_items.filter(a => a.trim()).map((item, index) => (
              <li key={index} className="action-item">
                <span className="action-number">A{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {meetingNotes.next_steps.filter(n => n.trim()).length > 0 && (
        <div className="document-section">
          <h3 className="section-heading">Next Steps</h3>
          <ul className="next-steps-list">
            {meetingNotes.next_steps.filter(n => n.trim()).map((step, index) => (
              <li key={index} className="next-step-item">
                <span className="step-number">→</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="document-footer">
        <button onClick={handleEdit} className="edit-btn">
          <DocumentTextIcon style={{ width: '1rem', height: '1rem' }} />
          Edit Notes
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading meeting notes...</p>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
              z-index: 60;
            }
            .notes-modal {
              background: #ffffff;
              border: 3px solid #000000;
              border-radius: 16px;
              width: 100%;
              max-width: 900px;
              max-height: 90vh;
              overflow-y: auto;
            }
            .loading-container {
              text-align: center;
              padding: 3rem;
              color: #6b7280;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #e5e7eb;
              border-top: 3px solid #000000;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 60;
            animation: fadeIn 0.3s ease-out;
          }
          .notes-modal {
            background: #ffffff;
            border: 3px solid #000000;
            border-radius: 16px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .notes-header {
            padding: 2rem;
            border-bottom: 3px solid #e5e7eb;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            position: relative;
          }
          .notes-title {
            font-size: 2rem;
            font-weight: 800;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #6b7280;
          }
          .close-btn:hover {
            border-color: #000000;
            color: #000000;
            transform: translateY(-1px);
          }
          .notes-content {
            padding: 2rem;
          }
          .form-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .form-row-three {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .attendees-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
            min-height: 2rem;
            padding: 0.75rem;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            background: #ffffff;
          }
          .attendee-tag {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInTag 0.2s ease-out;
          }
          .attendee-remove {
            cursor: pointer;
            font-weight: 800;
            font-size: 0.875rem;
            transition: transform 0.1s ease;
          }
          .attendee-remove:hover {
            transform: scale(1.2);
          }
          .attendee-input-row {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .add-btn {
            padding: 0.75rem 1rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .add-btn:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .project-members {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }
          .member-btn {
            padding: 0.5rem 0.75rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
          }
          .member-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }
          .discussion-item {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1rem;
            align-items: flex-start;
            position: relative;
            width: 100%;
          }
          .discussion-number {
            background: #000000;
            color: #ffffff;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 0.5rem;
          }
          .discussion-input {
            flex: 1;
            width: 100%;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            min-height: 80px;
            resize: vertical;
            transition: all 0.2s ease;
            position: relative;
            box-sizing: border-box;
          }
          .discussion-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .discussion-input.active {
            border-color: #000000;
            background: #f8fafc;
          }
          .discussion-controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .control-btn {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .control-btn:hover {
            border-color: #000000;
          }
          .control-btn.add {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .control-btn.add:hover {
            background: #333333;
          }
          .previous-line {
            background: #e5e7eb;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
            font-style: italic;
          }
          .save-section {
            padding: 2rem;
            border-top: 3px solid #e5e7eb;
            background: #f8fafc;
            display: flex;
            justify-content: center;
            gap: 1rem;
          }
          .save-btn {
            padding: 1rem 2rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
          }
          .save-btn:hover {
            background: #333333;
            transform: translateY(-2px);
          }
          .save-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
          }
          .cancel-btn {
            padding: 1rem 2rem;
            background: #ffffff;
            color: #000000;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .cancel-btn:hover {
            border-color: #000000;
            transform: translateY(-2px);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInTag {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          /* Document View Styles */
          .document-view {
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            padding: 2rem;
            line-height: 1.6;
            color: #374151;
          }
          .document-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .document-title {
            font-size: 2rem;
            font-weight: 800;
            color: #000000;
            margin: 0 0 1rem 0;
            text-align: center;
          }
          .document-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
            margin-top: 1rem;
          }
          .meta-item {
            background: #f8fafc;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            border: 1px solid #e5e7eb;
          }
          .document-section {
            margin-bottom: 2rem;
          }
          .section-heading {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .attendees-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .attendee-chip {
            background: #000000;
            color: #ffffff;
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .discussion-list, .decision-list, .action-list, .next-steps-list {
            margin: 0;
            padding-left: 1.5rem;
          }
          .discussion-item-doc, .decision-item, .action-item, .next-step-item {
            margin-bottom: 0.75rem;
            font-size: 0.95rem;
            line-height: 1.6;
          }
          .action-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .action-number {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }
          .next-step-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .step-number {
            color: #000000;
            font-weight: 700;
            font-size: 1.25rem;
            flex-shrink: 0;
          }
          .document-footer {
            border-top: 2px solid #e5e7eb;
            padding-top: 1.5rem;
            text-align: center;
          }
          .edit-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }
          .edit-btn:hover {
            background: #333333;
            transform: translateY(-1px);
          }
        `
      }} />
      
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-header">
          <h1 className="notes-title">
            <DocumentTextIcon style={{ width: '2rem', height: '2rem' }} />
            Meeting Notes
          </h1>
          <button onClick={onClose} className="close-btn">
            <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <div className="notes-content">
          {!isEditing ? (
            <DocumentView />
          ) : (
            <>
              {/* Meeting Information */}
              <div className="form-section">
                <h2 className="section-title">
                  <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Meeting Information
                </h2>
                
                <div className="form-group">
                  <label className="form-label">Meeting Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={meetingNotes.title}
                    onChange={(e) => setMeetingNotes({...meetingNotes, title: e.target.value})}
                  />
                </div>

                <div className="form-row-three">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={meetingNotes.date}
                      onChange={(e) => setMeetingNotes({...meetingNotes, date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={meetingNotes.time}
                      onChange={(e) => setMeetingNotes({...meetingNotes, time: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={meetingNotes.follow_up_date || ''}
                      onChange={(e) => setMeetingNotes({...meetingNotes, follow_up_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="form-section">
                <h2 className="section-title">
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Attendees
                </h2>
                
                <div className="attendees-container">
                  {meetingNotes.attendees.map((attendee, index) => (
                    <div key={index} className="attendee-tag">
                      {attendee}
                      <span
                        onClick={() => removeAttendee(index)}
                        className="attendee-remove"
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>

                <div className="attendee-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add attendee..."
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                  />
                  <button onClick={addAttendee} className="add-btn">
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Add
                  </button>
                </div>

                {projectMembers.length > 0 && (
                  <div className="project-members">
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: '0.5rem' }}>
                      Quick add:
                    </span>
                    {projectMembers.map((member, index) => (
                      <button
                        key={index}
                        onClick={() => addProjectMember(member)}
                        className="member-btn"
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Discussion Points - Full Width */}
              <div className="form-section">
                <h2 className="section-title">
                  <ListBulletIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Key Discussion Points
                </h2>
                
                {meetingNotes.discussion_points.map((point, index) => (
                  <div key={index}>
                    {activeDiscussionIndex === index && index > 0 && (
                      <div className="previous-line">
                        Previous: {meetingNotes.discussion_points[index - 1] || 'No previous discussion point'}
                      </div>
                    )}
                    <div className="discussion-item">
                      <div className="discussion-number">{index + 1}</div>
                      <textarea
                        className={`discussion-input ${activeDiscussionIndex === index ? 'active' : ''}`}
                        placeholder="Enter discussion point..."
                        value={point}
                        onChange={(e) => updateArrayField('discussion_points', index, e.target.value)}
                        onFocus={() => handleDiscussionFocus(index)}
                      />
                      <div className="discussion-controls">
                        <button
                          onClick={() => addArrayField('discussion_points', index)}
                          className="control-btn add"
                          title="Add discussion point after this one"
                        >
                          <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        {meetingNotes.discussion_points.length > 1 && (
                          <button
                            onClick={() => removeArrayField('discussion_points', index)}
                            className="control-btn"
                            title="Remove this discussion point"
                          >
                            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            onClick={() => setActiveDiscussionIndex(activeDiscussionIndex === index ? null : index)}
                            className="control-btn"
                            title="Show previous line"
                          >
                            <ArrowUpIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decisions Made */}
              <div className="form-section">
                <h2 className="section-title">
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Decisions Made
                </h2>
                
                {meetingNotes.decisions_made.map((decision, index) => (
                  <div key={index} className="discussion-item">
                    <div className="discussion-number">D{index + 1}</div>
                    <textarea
                      className="discussion-input"
                      placeholder="Enter decision made..."
                      value={decision}
                      onChange={(e) => updateArrayField('decisions_made', index, e.target.value)}
                    />
                    <div className="discussion-controls">
                      <button
                        onClick={() => addArrayField('decisions_made', index)}
                        className="control-btn add"
                      >
                        <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      {meetingNotes.decisions_made.length > 1 && (
                        <button
                          onClick={() => removeArrayField('decisions_made', index)}
                          className="control-btn"
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Items */}
              <div className="form-section">
                <h2 className="section-title">
                  <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Action Items
                </h2>
                
                {meetingNotes.action_items.map((item, index) => (
                  <div key={index} className="discussion-item">
                    <div className="discussion-number">A{index + 1}</div>
                    <textarea
                      className="discussion-input"
                      placeholder="Enter action item..."
                      value={item}
                      onChange={(e) => updateArrayField('action_items', index, e.target.value)}
                    />
                    <div className="discussion-controls">
                      <button
                        onClick={() => addArrayField('action_items', index)}
                        className="control-btn add"
                      >
                        <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      {meetingNotes.action_items.length > 1 && (
                        <button
                          onClick={() => removeArrayField('action_items', index)}
                          className="control-btn"
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Steps */}
              <div className="form-section">
                <h2 className="section-title">
                  <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Next Steps
                </h2>
                
                {meetingNotes.next_steps.map((step, index) => (
                  <div key={index} className="discussion-item">
                    <div className="discussion-number">N{index + 1}</div>
                    <textarea
                      className="discussion-input"
                      placeholder="Enter next step..."
                      value={step}
                      onChange={(e) => updateArrayField('next_steps', index, e.target.value)}
                    />
                    <div className="discussion-controls">
                      <button
                        onClick={() => addArrayField('next_steps', index)}
                        className="control-btn add"
                      >
                        <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      {meetingNotes.next_steps.length > 1 && (
                        <button
                          onClick={() => removeArrayField('next_steps', index)}
                          className="control-btn"
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {isEditing && (
          <div className="save-section">
            <button 
              onClick={saveMeetingNotes} 
              className="save-btn"
              disabled={saving}
            >
              <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              {saving ? 'Saving...' : 'Save Meeting Notes'}
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 