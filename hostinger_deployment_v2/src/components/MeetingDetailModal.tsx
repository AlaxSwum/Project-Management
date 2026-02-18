'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  ArrowRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import MeetingNotesModal from './MeetingNotesModal';
import { TIMEZONES, TIMEZONE_KEYS, getDisplayTimes, type TimezoneKey } from '@/lib/timezone-utils';

interface Meeting {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  project_id?: number;
  project_name: string;
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  attendees?: string;
  attendees_list?: string[];
  attendee_ids?: number[];
  agenda_items?: string[];
  input_timezone?: string;
  display_timezones?: string[];
  recurring?: boolean;
  recurring_end_date?: string;
  excluded_dates?: string[];
}

interface MeetingDetailModalProps {
  meeting: Meeting;
  occurrenceDate?: string | null;
  onClose: () => void;
  onUpdate: (meetingData: any) => Promise<void>;
  onDelete: (meetingId: number, mode?: 'all' | 'this', occurrenceDate?: string) => Promise<void>;
  onFollowUp?: (meeting: Meeting) => void;
  projectMembers?: any[];
  projects?: any[];
  onProjectChange?: (projectId: number) => void;
}

export default function MeetingDetailModal({
  meeting,
  occurrenceDate,
  onClose,
  onUpdate,
  onDelete,
  onFollowUp,
  projectMembers = [],
  projects = [],
  onProjectChange
}: MeetingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editedMeeting, setEditedMeeting] = useState({
    title: meeting.title,
    description: meeting.description,
    date: meeting.date,
    time: meeting.time,
    duration: meeting.duration,
    project_id: meeting.project_id || 0,
    attendees: meeting.attendees || '',
    attendee_ids: meeting.attendee_ids || [],
    display_timezones: (meeting.display_timezones || ['UK', 'MM']) as TimezoneKey[],
    recurring: meeting.recurring || false,
    recurring_end_date: meeting.recurring_end_date || '',
  });

  // Use a ref for onProjectChange to avoid infinite re-render loops
  const onProjectChangeRef = useRef(onProjectChange);
  onProjectChangeRef.current = onProjectChange;

  // Fetch project members when project changes
  useEffect(() => {
    if (isEditing && editedMeeting.project_id && onProjectChangeRef.current) {
      onProjectChangeRef.current(editedMeeting.project_id);
    }
  }, [editedMeeting.project_id, isEditing]);

  const formatDate = (dateString: string) => {
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleSave = async () => {
    try {
      await onUpdate({
        ...editedMeeting,
        project: editedMeeting.project_id,
        attendee_ids: editedMeeting.attendee_ids,
        display_timezones: editedMeeting.display_timezones,
        recurring: editedMeeting.recurring,
        recurring_end_date: editedMeeting.recurring ? (editedMeeting.recurring_end_date || null) : null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update meeting:', error);
    }
  };

  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const handleDelete = async () => {
    if (meeting.recurring) {
      setShowDeleteOptions(true);
    } else {
      if (window.confirm('Are you sure you want to delete this meeting?')) {
        try {
          await onDelete(meeting.id, 'all');
          onClose();
        } catch (error) {
          console.error('Failed to delete meeting:', error);
        }
      }
    }
  };

  const handleDeleteThis = async () => {
    try {
      await onDelete(meeting.id, 'this', occurrenceDate || undefined);
      setShowDeleteOptions(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await onDelete(meeting.id, 'all');
      setShowDeleteOptions(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  };

  const [attendeeNames, setAttendeeNames] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { userService } = await import('../lib/api-compatibility');
        const allUsers = await userService.getUsers();
        setUsers(allUsers || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  // Update attendee names when users are loaded or meeting data changes
  useEffect(() => {
    if (meeting.attendee_ids && meeting.attendee_ids.length > 0 && users.length > 0) {
      const names = meeting.attendee_ids.map(id => {
        // First check users from database
        const user = users.find((u: any) => u.id === id);
        if (user) {
          return user.name || user.email?.split('@')[0] || 'Unknown User';
        }
        
        // Fallback to project members
        const member = projectMembers.find(m => m.id === id);
        if (member) {
          return member.name;
        }
        
        return `User ${id}`;
      });
      setAttendeeNames(names);
    } else if (meeting.attendees_list && meeting.attendees_list.length > 0) {
      setAttendeeNames(meeting.attendees_list);
    } else if (meeting.attendees && typeof meeting.attendees === 'string') {
      setAttendeeNames(meeting.attendees.split(',').map(a => a.trim()).filter(a => a));
    } else {
      setAttendeeNames([]);
    }
  }, [meeting.attendee_ids, meeting.attendees_list, meeting.attendees, projectMembers, users]);

  const getAttendeesList = () => {
    return attendeeNames;
  };

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
            z-index: 50;
            animation: fadeIn 0.3s ease-out;
          }
          .meeting-modal {
            background: #1A1A1A;
            border: 1px solid #2D2D2D;
            border-radius: 16px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            margin: 0 auto;
          }
          .meeting-modal-fixed {
            border: 1px solid #2D2D2D !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
            max-width: 520px !important;
            background: #1A1A1A !important;
          }
          .modal-content {
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: linear-gradient(135deg, #C77DFF 0%, #7B2FBE 50%, #3B82F6 100%);
            border-radius: 16px 16px 0 0;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0;
            flex: 1;
            margin-right: 1rem;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }
          .modal-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .action-btn {
            padding: 0.5rem;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(4px);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          }
          .action-btn:hover {
            background: rgba(255,255,255,0.35);
            transform: translateY(-1px);
          }
          .action-btn.edit { background: rgba(255,255,255,0.2); }
          .action-btn.save { background: rgba(255,255,255,0.3); color: #ffffff; }
          .action-btn.delete { background: rgba(220,38,38,0.3); color: #FCA5A5; }
          .action-btn.delete:hover { background: rgba(220,38,38,0.5); }
          .action-btn.close { background: rgba(255,255,255,0.25); color: #FFFFFF; }
          .action-btn.close:hover { background: rgba(255,255,255,0.4); transform: translateY(-1px); }
          .modal-body {
            padding: 1.25rem 1.5rem;
          }
          .meeting-info {
            display: grid;
            gap: 0.625rem;
            margin-bottom: 1rem;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem 1rem;
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 10px;
            transition: border-color 0.2s;
          }
          .info-row:hover {
            border-color: #3D3D3D;
          }
          .info-icon {
            color: #C77DFF;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-label {
            font-size: 0.75rem;
            color: #71717A;
            margin-bottom: 0.25rem;
          }
          .info-value {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #3D3D3D;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
            background: #141414;
            color: #FFFFFF;
            color-scheme: dark;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #3B82F6;
          }
          .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 140px;
            gap: 1rem;
          }
          .meeting-notes-section {
            padding-top: 1rem;
            margin-top: 1rem;
            margin-bottom: 1rem;
            width: 100%;
            text-align: center;
            border-top: 1px solid #2D2D2D;
          }
          .notes-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 1rem;
            gap: 1rem;
          }
          .notes-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .toggle-notes-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .toggle-notes-btn:hover {
            background: #333333;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #2D2D2D;
          }
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid transparent;
          }
          .btn-primary {
            background: #000000;
            color: #ffffff;
          }
          .btn-primary:hover {
            background: #333333;
          }
          .btn-secondary {
            background: #141414;
            color: #FFFFFF;
            border-color: #3D3D3D;
          }
          .btn-secondary:hover {
            border-color: #FFFFFF;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .attendee-tag {
            background: linear-gradient(135deg, #C77DFF22, #3B82F622);
            color: #E4E4E7;
            padding: 0.3rem 0.65rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #3D3D3D;
          }
          @media (max-width: 768px) {
            .meeting-modal {
              max-width: 95vw;
              margin: 1rem;
            }
            .form-grid-3 {
              grid-template-columns: 1fr;
            }
            .modal-header {
              padding: 0.75rem;
            }
            .modal-body {
              padding: 0.75rem;
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
      }} />
      
      <div className="meeting-modal meeting-modal-fixed" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Edit Meeting' : meeting.title}
          </h2>
          <div className="modal-actions">
            {!isEditing ? (
              <>
                {onFollowUp && (
                  <button
                    onClick={() => {
                      onClose();
                      onFollowUp(meeting);
                    }}
                    className="action-btn"
                    title="Schedule follow-up meeting"
                    style={{ 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                    Follow-up
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="action-btn edit"
                  title="Edit meeting"
                >
                  <PencilIcon style={{ width: '16px', height: '16px' }} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleDelete}
                    className="action-btn delete"
                    title="Delete meeting"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                  {showDeleteOptions && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: '#1A1A1A',
                      border: '1px solid #3D3D3D',
                      borderRadius: '10px',
                      padding: '8px',
                      zIndex: 100,
                      minWidth: '200px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      <button
                        onClick={handleDeleteThis}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          background: 'transparent',
                          border: 'none',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          textAlign: 'left',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Delete this day only
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '0.875rem',
                          textAlign: 'left',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Delete all occurrences
                      </button>
                      <button
                        onClick={() => setShowDeleteOptions(false)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          background: 'transparent',
                          border: 'none',
                          color: '#71717A',
                          fontSize: '0.875rem',
                          textAlign: 'left',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="action-btn save"
                title="Save changes"
              >
                <CheckIcon style={{ width: '16px', height: '16px' }} />
              </button>
            )}
            <button
              onClick={onClose}
              className="action-btn close"
              title="Close"
            >
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="modal-body">
            {!isEditing ? (
              <div className="meeting-info">
                <div className="info-row">
                  <CalendarDaysIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="info-content">
                    <div className="info-label">Date</div>
                    <div className="info-value">{formatDate(meeting.date)}</div>
                  </div>
                </div>
                
                <div className="info-row" style={{ alignItems: 'flex-start' }}>
                  <ClockIcon className="info-icon" style={{ width: '20px', height: '20px', marginTop: '2px' }} />
                  <div className="info-content">
                    <div className="info-label">Time & Duration</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {getDisplayTimes(meeting.time, (meeting.display_timezones || ['UK', 'MM']) as TimezoneKey[]).map(dt => (
                        <div key={dt.timezone} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', color: dt.config.color, fontSize: '11px', minWidth: '22px' }}>{dt.config.shortLabel}</span>
                          <span className="info-value" style={{ color: dt.config.color }}>{dt.formatted}</span>
                          {dt.dateLabel && <span style={{ color: '#EF4444', fontSize: '10px', fontWeight: '600' }}>{dt.dateLabel}</span>}
                        </div>
                      ))}
                      <div style={{ color: '#71717A', fontSize: '12px', marginTop: '2px' }}>
                        {formatDuration(meeting.duration)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info-row">
                  <DocumentTextIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="info-content">
                    <div className="info-label">Project</div>
                    <div className="info-value">{meeting.project_name}</div>
                  </div>
                </div>

                {meeting.description && (
                  <div className="info-row">
                    <ListBulletIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="info-content">
                      <div className="info-label">Description</div>
                      <div className="info-value">{meeting.description}</div>
                    </div>
                  </div>
                )}

                {getAttendeesList().length > 0 && (
                  <div className="info-row">
                    <UserGroupIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="info-content">
                      <div className="info-label">Attendees</div>
                      <div className="attendees-list">
                        {getAttendeesList().map((attendee, index) => (
                          <span key={index} className="attendee-tag">
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {meeting.recurring && (
                  <div className="info-row">
                    <ArrowPathIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="info-content">
                      <div className="info-label">Recurring</div>
                      <div className="info-value">
                        Daily until {meeting.recurring_end_date ? formatDate(meeting.recurring_end_date) : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting Agenda Section */}
                {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                  <div className="info-row" style={{ alignItems: 'flex-start' }}>
                    <ClipboardDocumentListIcon className="info-icon" style={{ width: '20px', height: '20px', marginTop: '2px' }} />
                    <div className="info-content">
                      <div className="info-label">Meeting Agenda</div>
                      <div style={{ 
                        marginTop: '8px',
                        background: '#141414',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #2D2D2D'
                      }}>
                        {meeting.agenda_items.map((item, index) => (
                          <div 
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 12px',
                              borderBottom: index < meeting.agenda_items!.length - 1 ? '1px solid #2D2D2D' : 'none',
                              background: '#1A1A1A'
                            }}
                          >
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#5884FD',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              flexShrink: 0
                            }}>
                              {index + 1}
                            </span>
                            <span style={{ fontSize: '13px', color: '#E4E4E7' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter meeting title..."
                    value={editedMeeting.title}
                    onChange={(e) => setEditedMeeting({ ...editedMeeting, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What will be discussed in this meeting?"
                    value={editedMeeting.description}
                    onChange={(e) => setEditedMeeting({ ...editedMeeting, description: e.target.value })}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                {projects.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Project *</label>
                    <select
                      required
                      className="form-select"
                      value={editedMeeting.project_id}
                      onChange={(e) => setEditedMeeting({ ...editedMeeting, project_id: Number(e.target.value), attendee_ids: [] })}
                    >
                      <option value={0}>Select a project</option>
                      {projects.map((project: any) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={editedMeeting.date}
                      onChange={(e) => setEditedMeeting({ ...editedMeeting, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={editedMeeting.time}
                      onChange={(e) => setEditedMeeting({ ...editedMeeting, time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      className="form-input"
                      placeholder="Minutes"
                      value={editedMeeting.duration}
                      onChange={(e) => setEditedMeeting({ ...editedMeeting, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Show timezones</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px 0' }}>
                    {TIMEZONE_KEYS.map(tz => (
                      <label key={tz} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#A1A1AA', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={editedMeeting.display_timezones.includes(tz)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditedMeeting(prev => ({
                              ...prev,
                              display_timezones: checked
                                ? [...prev.display_timezones, tz]
                                : prev.display_timezones.filter(t => t !== tz)
                            }));
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ color: TIMEZONES[tz].color, fontWeight: '600' }}>{TIMEZONES[tz].label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Invite Attendees (Optional)</label>
                  
                  {/* Selected Attendees Display */}
                  {editedMeeting.attendee_ids.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem', 
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '6px'
                    }}>
                      {editedMeeting.attendee_ids.map(memberId => {
                        const member = projectMembers.find(m => m.id === memberId);
                        return member ? (
                          <span key={memberId} style={{
                            display: 'inline-flex',
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            borderRadius: '20px',
                            fontSize: '0.875rem'
                          }}>
                            {member.name}
                            <button
                              type="button"
                              onClick={() => setEditedMeeting(prev => ({
                                ...prev,
                                attendee_ids: prev.attendee_ids.filter(id => id !== memberId)
                              }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                lineHeight: '1'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Member Selection */}
                  {projectMembers.length > 0 ? (
                    <div style={{
                      border: '2px solid #3D3D3D',
                      borderRadius: '6px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {projectMembers.map(member => {
                        const isSelected = editedMeeting.attendee_ids.includes(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => {
                              setEditedMeeting(prev => ({
                                ...prev,
                                attendee_ids: isSelected 
                                  ? prev.attendee_ids.filter(id => id !== member.id)
                                  : [...prev.attendee_ids, member.id]
                              }));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              borderBottom: '1px solid #2D2D2D',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#141414',
                              borderLeft: isSelected ? '4px solid #3B82F6' : '4px solid transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: '#FFFFFF' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#71717A' }}>
                                {member.email}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#71717A',
                      border: '2px dashed #3D3D3D',
                      borderRadius: '6px'
                    }}>
                      {editedMeeting.project_id ? 'Loading project members...' : 'Select a project to see available members'}
                    </div>
                  )}
                </div>

                {/* Recurring Toggle */}
                <div className="form-group">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#141414',
                    border: '2px solid #3D3D3D',
                    borderRadius: '6px',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}>
                      <ArrowPathIcon style={{ width: '18px', height: '18px', color: '#C77DFF' }} />
                      Recurring Meeting
                    </label>
                    <div
                      onClick={() => setEditedMeeting({ ...editedMeeting, recurring: !editedMeeting.recurring })}
                      style={{
                        width: '48px',
                        height: '24px',
                        background: editedMeeting.recurring ? '#C77DFF' : '#3D3D3D',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: '#FFFFFF',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: editedMeeting.recurring ? '26px' : '2px',
                        transition: 'left 0.2s',
                      }} />
                    </div>
                  </div>
                </div>

                {editedMeeting.recurring && (
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editedMeeting.recurring_end_date}
                      onChange={(e) => setEditedMeeting({ ...editedMeeting, recurring_end_date: e.target.value })}
                      min={editedMeeting.date || undefined}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                )}

                <div className="form-actions">
                  <button onClick={handleSave} className="btn btn-primary">
                    Update Meeting
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Follow-up & Meeting Notes Section */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              flexWrap: 'wrap',
              padding: '16px 0',
              borderTop: '1px solid #2D2D2D',
              marginTop: '16px',
            }}>
              {/* Follow-up Button */}
              {onFollowUp && (
                <button
                  onClick={() => {
                    onClose();
                    onFollowUp(meeting);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <ArrowPathIcon style={{ width: '18px', height: '18px' }} />
                  Schedule Follow-up Meeting
                </button>
              )}
              
              {/* Meeting Notes Button */}
              <button
                onClick={() => setShowNotesModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: '#2D2D2D',
                  color: '#E4E4E7',
                  border: '1px solid #3D3D3D',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ClipboardDocumentListIcon style={{ width: '18px', height: '18px' }} />
                Meeting Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Notes Modal - rendered with stopPropagation wrapper to prevent closing detail modal */}
      {showNotesModal && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <MeetingNotesModal
            meeting={{
              id: meeting.id,
              title: meeting.title,
              date: meeting.date,
              time: meeting.time,
              duration: meeting.duration,
              attendees_list: getAttendeesList()
            }}
            onClose={() => setShowNotesModal(false)}
            projectMembers={projectMembers}
          />
        </div>
      )}
    </div>
  );
} 