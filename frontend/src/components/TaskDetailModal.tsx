'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PencilIcon, 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import TaskInteractionSection from './TaskInteractionSection';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignees: User[];  // Changed from single assignee to multiple assignees
  assignee?: User | null;  // Keep for backwards compatibility
  created_by: User | null;
  tags_list: string[];
  created_at: string;
  updated_at: string;
  project_id: number;
}

interface TaskDetailModalProps {
  task: Task;
  users: User[];
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  onStatusChange?: (taskId: number, newStatus: string) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
}

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', icon: '', color: '#10b981' },
  { value: 'medium', label: 'Medium', icon: '', color: '#f59e0b' },
  { value: 'high', label: 'High', icon: '', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', icon: '', color: '#dc2626' },
];

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', icon: '', color: '#e5e7eb' },
  { value: 'in_progress', label: 'In Progress', icon: '', color: '#dbeafe' },
  { value: 'review', label: 'Review', icon: '', color: '#fef3c7' },
  { value: 'done', label: 'Done', icon: '', color: '#d1fae5' },
];

export default function TaskDetailModal({ task, users, onClose, onSave, onStatusChange, onDelete }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('task'); // New state for active tab
  const [editedTask, setEditedTask] = useState({
    name: task.name,
    description: task.description,
    priority: task.priority,
    due_date: task.due_date || '',
    start_date: task.start_date || '',
    estimated_hours: task.estimated_hours || '',
    assignee_ids: task.assignees ? task.assignees.map(a => a.id) : (task.assignee ? [task.assignee.id] : []),
    assignee_id: task.assignee?.id || 0,  // Keep for backwards compatibility
    tags: task.tags_list.join(', '),
  });

  // ✅ Update editedTask state when task prop changes (after save)
  useEffect(() => {
    setEditedTask({
      name: task.name,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date || '',
      start_date: task.start_date || '',
      estimated_hours: task.estimated_hours || '',
      assignee_ids: task.assignees ? task.assignees.map(a => a.id) : (task.assignee ? [task.assignee.id] : []),
      assignee_id: task.assignee?.id || 0,
      tags: task.tags_list.join(', '),
    });
  }, [task]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1];
  };

  const getStatusConfig = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleSave = async () => {
    try {
      const taskData = {
        ...editedTask,
        tags: editedTask.tags,
        estimated_hours: editedTask.estimated_hours ? Number(editedTask.estimated_hours) : null,
        assignee_ids: editedTask.assignee_ids && editedTask.assignee_ids.length > 0 ? editedTask.assignee_ids : null,
        assignee_id: editedTask.assignee_id && editedTask.assignee_id !== 0 ? Number(editedTask.assignee_id) : null,  // Keep for backwards compatibility
        due_date: editedTask.due_date || null,
        start_date: editedTask.start_date || null,
      };
      
      console.log('Saving task with assignee_ids:', taskData.assignee_ids); // Debug log
      await onSave(taskData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(task.id, newStatus);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(task.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const overdue = isOverdue(task.due_date);

  const tabs = [
    { id: 'task', label: 'Task', icon: <CheckCircleIcon style={{ width: '16px', height: '16px' }} /> },
    { id: 'comments', label: 'Comments', icon: <ChatBubbleLeftRightIcon style={{ width: '16px', height: '16px' }} /> },
    { id: 'files', label: 'Files & Upload', icon: <PaperClipIcon style={{ width: '16px', height: '16px' }} /> }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .task-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.3s ease-out;
            box-sizing: border-box;
          }
          .task-modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            width: 100%;
            max-width: min(1200px, calc(100vw - 1.5rem));
            height: 85vh;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideIn 0.3s ease-out;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }
          .task-modal-header {
            padding: 1.5rem 2rem;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
            flex-shrink: 0;
          }
          .task-modal-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #e5e7eb;
            background: #f9fafb;
            flex-shrink: 0;
          }
          .tab-button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem 1.5rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 500;
            color: #6b7280;
            transition: all 0.2s ease;
            border-right: 1px solid #e5e7eb;
          }
          .tab-button:last-child {
            border-right: none;
          }
          .tab-button:hover {
            background: #f3f4f6;
            color: #374151;
          }
          .tab-button.active {
            background: #ffffff;
            color: #000000;
            border-bottom: 2px solid #000000;
            margin-bottom: -2px;
          }
          .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
          }
          .tab-content.editing {
            overflow-y: auto;
          }
          .task-title-section {
            flex: 1;
          }
          .task-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0.5rem;
            line-height: 1.3;
          }
          .task-meta-badges {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
          }
          .task-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .task-badge.priority {
            background: ${priorityConfig.color}20;
            border-color: ${priorityConfig.color}40;
            color: ${priorityConfig.color};
          }
          .task-badge.status {
            background: ${statusConfig.color};
            border-color: #000000;
          }
          .task-badge.overdue {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
            animation: pulse 2s infinite;
          }
          .task-header-actions {
            display: flex;
            gap: 0.5rem;
          }
          .task-action-btn {
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
          .task-action-btn:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .task-action-btn.edit {
            background: #f3f4f6;
          }
          .task-action-btn.close {
            background: #fef2f2;
            border-color: #fecaca;
          }
          .task-action-btn.delete {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
          }
          .task-description {
            background: #f9fafb;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
          }
          .task-description.empty {
            color: #9ca3af;
            font-style: italic;
          }
          .task-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .task-detail-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
          }
          .task-detail-icon {
            flex-shrink: 0;
            color: #6b7280;
          }
          .task-detail-content {
            flex: 1;
          }
          .task-detail-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          .task-detail-value {
            font-weight: 600;
            color: #000000;
          }
          .task-status-actions-inline {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
          }
          .status-actions-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .status-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .status-btn {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border: 2px solid #000000;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.8rem;
            flex: 1;
            min-width: auto;
            justify-content: center;
          }
          .status-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .status-btn.current {
            background: #000000;
            color: #ffffff;
          }
          .status-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .edit-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .form-label {
            font-weight: 600;
            color: #000000;
            font-size: 0.9rem;
          }
          .form-input, .form-textarea, .form-select {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 1rem;
            transition: all 0.2s ease;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .form-textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
          }
          .btn {
            flex: 1;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid;
          }
          .btn-primary {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .btn-secondary {
            background: #ffffff;
            color: #000000;
            border-color: #e5e7eb;
          }
          .btn-secondary:hover {
            border-color: #000000;
          }
          .confirm-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 60;
            animation: fadeIn 0.2s ease-out;
          }
          .confirm-modal-content {
            background: #ffffff;
            border: 2px solid #dc2626;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
            animation: slideIn 0.2s ease-out;
          }
          .confirm-modal-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 1rem;
          }
          .confirm-modal-text {
            color: #374151;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .confirm-modal-actions {
            display: flex;
            gap: 1rem;
          }
          .btn-danger {
            flex: 1;
            background: #dc2626;
            color: #ffffff;
            border: 2px solid #dc2626;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-danger:hover {
            background: #b91c1c;
            border-color: #b91c1c;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .task-modal-overlay {
              padding: 0.5rem;
            }
            .task-modal-content {
              max-width: calc(100vw - 1rem);
              border-radius: 8px;
            }
            .task-modal-header {
              padding: 1rem 1.5rem;
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
            }
            .task-header-actions {
              justify-content: center;
            }
            .tab-content {
              padding: 1rem 1.5rem;
            }
            .task-details-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            .task-detail-item {
              padding: 0.75rem;
            }
            .edit-form div[style*="grid"] {
              grid-template-columns: 1fr !important;
            }
            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }
            .btn {
              padding: 1rem;
              font-size: 1rem;
            }
            .tab-button {
              padding: 0.75rem 1rem;
              font-size: 0.875rem;
            }
          }
        `
      }} />
      
      <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <div className="task-title-section">
            {isEditing ? (
              <input
                type="text"
                value={editedTask.name}
                onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                className="form-input"
                style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}
              />
            ) : (
              <h2 className="task-title">{task.name}</h2>
            )}
            
            <div className="task-meta-badges">
              <div className="task-badge priority">
                <span>{priorityConfig.icon}</span>
                <span>{priorityConfig.label} Priority</span>
              </div>
              <div className="task-badge status">
                <span>{statusConfig.icon}</span>
                <span>{statusConfig.label}</span>
              </div>
              {overdue && (
                <div className="task-badge overdue">
                  <ExclamationTriangleIcon style={{ width: '16px', height: '16px' }} />
                  <span>Overdue</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="task-header-actions">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="task-action-btn edit"
              title={isEditing ? "Cancel Edit" : "Edit Task"}
            >
              <PencilIcon style={{ width: '18px', height: '18px' }} />
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="task-action-btn delete"
                title="Delete Task"
              >
                <TrashIcon style={{ width: '18px', height: '18px' }} />
              </button>
            )}
            <button
              onClick={onClose}
              className="task-action-btn close"
              title="Close"
            >
              <XMarkIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        <div className="task-modal-body">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={`tab-content ${isEditing ? 'editing' : ''}`}>
            {activeTab === 'task' && (
              <>
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="form-textarea"
                    placeholder="Describe what needs to be done..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                      className="form-select"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.icon} {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assignees</label>
                    <div style={{ 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '0.75rem',
                      background: '#ffffff',
                      minHeight: '100px',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}>
                      {users.length === 0 ? (
                        <div style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                          No team members available
                        </div>
                      ) : (
                        users.map(user => (
                          <label 
                            key={user.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s ease',
                              marginBottom: '0.2rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={editedTask.assignee_ids.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditedTask({ 
                                    ...editedTask, 
                                    assignee_ids: [...editedTask.assignee_ids, user.id] 
                                  });
                                } else {
                                  setEditedTask({ 
                                    ...editedTask, 
                                    assignee_ids: editedTask.assignee_ids.filter(id => id !== user.id)
                                  });
                                }
                              }}
                              style={{ 
                                marginRight: '0.5rem',
                                accentColor: '#000000'
                              }}
                            />
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: editedTask.assignee_ids.includes(user.id) ? '#000000' : '#f3f4f6',
                              color: editedTask.assignee_ids.includes(user.id) ? '#ffffff' : '#000000',
                              border: '2px solid #000000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: '500',
                              color: editedTask.assignee_ids.includes(user.id) ? '#000000' : '#374151'
                            }}>
                              {user.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    {editedTask.assignee_ids.length > 0 && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.4rem', 
                        background: '#f0f9ff', 
                        border: '1px solid #3b82f6', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#1e40af'
                      }}>
                        <strong>{editedTask.assignee_ids.length} assignee{editedTask.assignee_ids.length === 1 ? '' : 's'} selected</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Created by</label>
                    <input
                      type="text"
                      value={task.created_by?.name || 'Unknown User'}
                      className="form-input"
                      disabled
                      style={{ 
                        backgroundColor: '#f9fafb', 
                        color: '#6b7280',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={editedTask.start_date}
                      onChange={(e) => setEditedTask({ ...editedTask, start_date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      value={editedTask.due_date}
                      onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Hours</label>
                    <input
                      type="number"
                      value={editedTask.estimated_hours}
                      onChange={(e) => setEditedTask({ ...editedTask, estimated_hours: e.target.value })}
                      className="form-input"
                      placeholder="Duration in hours"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    value={editedTask.tags}
                    onChange={(e) => setEditedTask({ ...editedTask, tags: e.target.value })}
                    className="form-input"
                    placeholder="frontend, urgent, bug (comma-separated)"
                  />
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={`task-description ${!task.description ? 'empty' : ''}`}>
                  {task.description || 'No description provided.'}
                </div>

                <div className="task-details-grid">
                  <div className="task-detail-item">
                    <UserIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">{task.assignees && task.assignees.length > 1 ? 'Assignees' : 'Assignee'}</div>
                      <div className="task-detail-value">
                        {task.assignees && task.assignees.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {task.assignees.map((assignee, index) => (
                              <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: '#000000',
                                  color: '#ffffff',
                                  border: '2px solid #ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  marginLeft: index > 0 ? '-8px' : '0',
                                  zIndex: task.assignees.length - index,
                                  position: 'relative'
                                }}>
                                  {assignee.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                  {assignee.name}
                                </span>
                                {index < task.assignees.length - 1 && task.assignees.length > 1 && (
                                  <span style={{ color: '#6b7280' }}>,</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : task.assignee ? (
                          task.assignee.name
                        ) : (
                          'Unassigned'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="task-detail-item">
                    <CalendarIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Due Date</div>
                      <div className="task-detail-value">{formatDate(task.due_date)}</div>
                    </div>
                  </div>

                  <div className="task-detail-item">
                    <ClockIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Start Date</div>
                      <div className="task-detail-value">{formatDate(task.start_date)}</div>
                    </div>
                  </div>

                  <div className="task-detail-item">
                    <ClockIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Estimated Hours</div>
                      <div className="task-detail-value">
                        {task.estimated_hours ? `${task.estimated_hours}h` : 'Not set'}
                      </div>
                    </div>
                  </div>

                  {task.tags_list && task.tags_list.length > 0 && (
                    <div className="task-detail-item">
                      <TagIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                      <div className="task-detail-content">
                        <div className="task-detail-label">Tags</div>
                        <div className="task-detail-value">{task.tags_list.join(', ')}</div>
                      </div>
                    </div>
                  )}

                  <div className="task-detail-item">
                    <UserIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Created by</div>
                      <div className="task-detail-value">{task.created_by?.name || 'Unknown User'}</div>
                    </div>
                  </div>

                  <div className="task-detail-item">
                    <CalendarIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Created</div>
                      <div className="task-detail-value">{formatDateTime(task.created_at)}</div>
                    </div>
                  </div>

                  <div className="task-detail-item">
                    <CalendarIcon className="task-detail-icon" style={{ width: '20px', height: '20px' }} />
                    <div className="task-detail-content">
                      <div className="task-detail-label">Last Updated</div>
                      <div className="task-detail-value">{formatDateTime(task.updated_at)}</div>
                    </div>
                  </div>
                </div>

                {!isEditing && onStatusChange && (
                  <div className="task-status-actions-inline">
                    <div className="status-actions-title">Change Status</div>
                    <div className="status-buttons">
                      {TASK_STATUSES.map(status => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(status.value)}
                          className={`status-btn ${status.value === task.status ? 'current' : ''}`}
                          disabled={status.value === task.status}
                        >
                          <span>{status.icon}</span>
                          <span>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
              </>
            )}

            {activeTab === 'comments' && (
              <div style={{ height: '100%' }}>
                <TaskInteractionSection task={task} activeSection="comments" />
              </div>
            )}

            {activeTab === 'files' && (
              <div style={{ height: '100%' }}>
                <TaskInteractionSection task={task} activeSection="files" />
              </div>
          )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">Delete Task</h3>
            <p className="confirm-modal-text">
              Are you sure you want to delete "{task.name}"? This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 