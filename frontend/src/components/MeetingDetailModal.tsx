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
}

// Use the MeetingNoteType from the service instead of defining it here

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: (meetingData: any) => Promise<void>;
  onDelete: (meetingId: number) => Promise<void>;
  projectMembers?: any[];
}

export default function MeetingDetailModal({
  meeting,
  onClose,
  onUpdate,
  onDelete,
  projectMembers = []
}: MeetingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editedMeeting, setEditedMeeting] = useState({
    title: meeting.title,
    description: meeting.description,
    date: meeting.date,
    time: meeting.time,
    duration: meeting.duration,
    attendees: meeting.attendees || '',
  });

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
      await onUpdate(editedMeeting);
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
            max-width: 550px;
            max-height: 85vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            margin: 0 auto;
          }
          .meeting-modal-fixed {
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            max-width: 550px !important;
            background: #ffffff !important;
          }
          .meeting-modal-fixed .modal-content {
            border: none !important;
            box-shadow: none !important;
            padding: 1rem 1.5rem !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 1rem !important;
          }
          .meeting-modal-fixed .info-row {
            border: 1px solid #e5e7eb !important;
            background: #f8fafc !important;
            width: 100% !important;
            max-width: 480px !important;
          }
          .meeting-modal-fixed .meeting-info {
            width: 100% !important;
            max-width: 480px !important;
            margin-bottom: 0 !important;
          }
          .modal-header {
            padding: 1rem 1.5rem;
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
          .modal-content {
            padding: 1rem 1.5rem;
          }
          .meeting-info {
            display: grid;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
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
          .meeting-notes-section {
            padding-top: 1.5rem;
            margin-top: 1.5rem;
            margin-bottom: 2rem;
            width: 100%;
            max-width: 480px;
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
          .notes-form {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .array-field {
            margin-bottom: 1rem;
          }
          .array-item {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            align-items: flex-start;
          }
          .array-input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 0.875rem;
          }
          .array-btn {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .array-btn:hover {
            border-color: #000000;
          }
          .array-btn.add {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .attendees-section {
            margin-bottom: 1rem;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .attendee-tag {
            background: #e5e7eb;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .attendee-remove {
            cursor: pointer;
            color: #dc2626;
            font-weight: 600;
          }
          .attendee-input-row {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .project-members {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          .member-btn {
            padding: 0.25rem 0.5rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .member-btn:hover {
            background: #e5e7eb;
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
                  <ClipboardDocumentListIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="info-content">
                    <div className="info-label">Description</div>
                    <div className="info-value">{meeting.description}</div>
                  </div>
                </div>
              )}

              {meeting.attendees_list && meeting.attendees_list.length > 0 && (
                <div className="info-row">
                  <UserGroupIcon className="info-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="info-content">
                    <div className="info-label">Attendees</div>
                    <div className="info-value">{meeting.attendees_list.join(', ')}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Meeting Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editedMeeting.title}
                  onChange={(e) => setEditedMeeting({...editedMeeting, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editedMeeting.description}
                  onChange={(e) => setEditedMeeting({...editedMeeting, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editedMeeting.date}
                    onChange={(e) => setEditedMeeting({...editedMeeting, date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editedMeeting.time}
                    onChange={(e) => setEditedMeeting({...editedMeeting, time: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editedMeeting.duration}
                    onChange={(e) => setEditedMeeting({...editedMeeting, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Attendees</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter attendees separated by commas"
                  value={editedMeeting.attendees}
                  onChange={(e) => setEditedMeeting({...editedMeeting, attendees: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Meeting Notes Section */}
          <div className="meeting-notes-section">
            <div className="notes-header">
              <h3 className="notes-title">
                <DocumentTextIcon style={{ width: '20px', height: '20px' }} />
                Meeting Notes
              </h3>
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
      
      {/* Meeting Notes Modal */}
      {showNotesModal && (
        <MeetingNotesModal
          meeting={meeting}
          onClose={() => setShowNotesModal(false)}
          projectMembers={projectMembers}
        />
      )}
    </div>
  );
} 