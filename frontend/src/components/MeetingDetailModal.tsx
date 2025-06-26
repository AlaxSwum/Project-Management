'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import MeetingNotesModal from './MeetingNotesModal';

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
}

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: (meetingData: any) => Promise<void>;
  onDelete: (meetingId: number) => Promise<void>;
  projectMembers?: any[];
  projects?: any[];
  onProjectChange?: (projectId: number) => void;
}

export default function MeetingDetailModal({
  meeting,
  onClose,
  onUpdate,
  onDelete,
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
  });

  // Fetch project members when project changes
  useEffect(() => {
    if (isEditing && editedMeeting.project_id && onProjectChange) {
      onProjectChange(editedMeeting.project_id);
    }
  }, [editedMeeting.project_id, isEditing, onProjectChange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        attendee_ids: editedMeeting.attendee_ids.length > 0 ? editedMeeting.attendee_ids : undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update meeting:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await onDelete(meeting.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete meeting:', error);
      }
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
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            width: 100%;
            max-width: 450px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            margin: 0 auto;
          }
          .meeting-modal-fixed {
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            max-width: 450px !important;
            background: #ffffff !important;
          }
          .modal-content {
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            padding: 1rem;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: #f8fafc;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin: 0;
            flex: 1;
            margin-right: 1rem;
          }
          .modal-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .action-btn {
            padding: 0.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .action-btn:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .action-btn.edit { background: #f3f4f6; }
          .action-btn.save { background: #000000; color: #ffffff; }
          .action-btn.delete { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
          .action-btn.close { background: #fef2f2; border-color: #fecaca; }
          .modal-body {
            padding: 1rem;
          }
          .meeting-info {
            display: grid;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .info-icon {
            color: #6b7280;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          .info-value {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
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
          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #000000;
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
            border-top: 1px solid #e5e7eb;
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
            color: #000000;
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
            border-top: 1px solid #e5e7eb;
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
            background: #ffffff;
            color: #000000;
            border-color: #e5e7eb;
          }
          .btn-secondary:hover {
            border-color: #000000;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .attendee-tag {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.5rem;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 500;
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
                <button
                  onClick={() => setIsEditing(true)}
                  className="action-btn edit"
                  title="Edit meeting"
                >
                  <PencilIcon style={{ width: '16px', height: '16px' }} />
                </button>
                <button
                  onClick={handleDelete}
                  className="action-btn delete"
                  title="Delete meeting"
                >
                  <TrashIcon style={{ width: '16px', height: '16px' }} />
                </button>
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
                
                <div className="info-row">
                  <ClockIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="info-content">
                    <div className="info-label">Time & Duration</div>
                    <div className="info-value">
                      {formatTime(meeting.time)} • {formatDuration(meeting.duration)}
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
                  <label className="form-label">Invite Attendees (Optional)</label>
                  
                  {/* Selected Attendees Display */}
                  {editedMeeting.attendee_ids.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem', 
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
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
                      border: '2px solid #e5e7eb',
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
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              borderLeft: isSelected ? '4px solid #000000' : '4px solid transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: '#000000' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
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
                      color: '#6b7280',
                      border: '2px dashed #e5e7eb',
                      borderRadius: '6px'
                    }}>
                      {editedMeeting.project_id ? 'Loading project members...' : 'Select a project to see available members'}
                    </div>
                  )}
                </div>

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

            {/* Meeting Notes Section */}
            <div className="meeting-notes-section">
              <div className="notes-header">
                <div className="notes-title">
                  <ClipboardDocumentListIcon style={{ width: '20px', height: '20px' }} />
                  Meeting Notes
                </div>
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="toggle-notes-btn"
                >
                  Meeting Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Notes Modal */}
      {showNotesModal && (
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
      )}
    </div>
  );
} 