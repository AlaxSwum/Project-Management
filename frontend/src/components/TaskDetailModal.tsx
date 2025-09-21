'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  // Helper function to format date to YYYY-MM-DD for date inputs
  const formatDateForInput = useCallback((dateValue: string | null) => {
    if (!dateValue) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // If it's a full ISO string, extract just the date part
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    // Parse and convert to YYYY-MM-DD
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  }, []);

  const [editedTask, setEditedTask] = useState({
    name: task.name,
    description: task.description,
    priority: task.priority,
    due_date: formatDateForInput(task.due_date),
    start_date: formatDateForInput(task.start_date),
    assignee_ids: task.assignees ? task.assignees.map(a => a.id) : (task.assignee ? [task.assignee.id] : []),
    tags: task.tags_list.join(', '),
  });

  // ✅ Update editedTask state when task prop changes (after save)
  useEffect(() => {
    setEditedTask({
      name: task.name,
      description: task.description,
      priority: task.priority,
      due_date: formatDateForInput(task.due_date),
      start_date: formatDateForInput(task.start_date),
      assignee_ids: task.assignees ? task.assignees.map(a => a.id) : (task.assignee ? [task.assignee.id] : []),
      tags: task.tags_list.join(', '),
    });
  }, [task, formatDateForInput]);

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
      // Fix date format to ensure it's in YYYY-MM-DD format
      const formatDate = (dateValue: string) => {
        if (!dateValue) return null;
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        // If it's a full ISO string, extract just the date part
        if (dateValue.includes('T')) {
          return dateValue.split('T')[0];
        }
        // If it's in MM-DD-YYYY or other format, convert to YYYY-MM-DD
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        return null;
      };

      const taskData = {
        ...editedTask,
        tags: editedTask.tags,
        assignee_ids: editedTask.assignee_ids && editedTask.assignee_ids.length > 0 ? editedTask.assignee_ids : [],
        // Remove assignee_id completely - only use assignee_ids for multiple assignee support
        due_date: formatDate(editedTask.due_date),
        start_date: formatDate(editedTask.start_date),
      };
      
      console.log('Saving task with assignee_ids:', taskData.assignee_ids); // Debug log
      console.log('Saving task with formatted dates:', { due_date: taskData.due_date, start_date: taskData.start_date }); // Debug log
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
    { id: 'comments', label: 'Comments & Files', icon: <ChatBubbleLeftRightIcon style={{ width: '16px', height: '16px' }} /> }
  ];

  const modalContent = (
    <div className="task-modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          
          .task-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 100000;
            animation: fadeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          
          .task-modal-content {
            background: rgba(255, 255, 255, 0.98);
            border: 2px solid #FFB333;
            border-radius: 20px;
            width: 100%;
            max-width: min(1200px, calc(100vw - 2rem));
            height: 85vh;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(20px);
            animation: slideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
            margin: 0 auto;
            z-index: 100001;
          }
          
          .task-modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #F87239, #C483D9, #5884FD);
            border-radius: 20px 20px 0 0;
          }
          
          .task-modal-header {
            padding: 2rem 2.5rem 1.5rem 2.5rem;
            border-bottom: 2px solid rgba(255, 179, 51, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1.5rem;
            flex-shrink: 0;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            position: relative;
            z-index: 1;
          }
          
          .task-modal-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: #F5F5ED;
          }
          
          .tab-navigation {
            display: flex;
            background: rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
            border-bottom: 2px solid rgba(255, 179, 51, 0.1);
            backdrop-filter: blur(10px);
          }
          
          .tab-button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1.25rem 1.5rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 600;
            color: #6B7280;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            border-right: 1px solid rgba(255, 179, 51, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .tab-button:last-child {
            border-right: none;
          }
          
          .tab-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 179, 51, 0.05);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .tab-button:hover {
            color: #FFB333;
            transform: translateY(-2px);
          }
          
          .tab-button:hover::before {
            opacity: 1;
          }
          
          .tab-button.active {
            background: #FFB333;
            color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.3);
          }
          
          .tab-button.active svg {
            color: #FFFFFF;
          }
          
          .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 2rem 2.5rem;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          }
          
          .task-title-section {
            flex: 1;
          }
          
          .task-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #374151;
            margin-bottom: 1rem;
            line-height: 1.3;
            letter-spacing: -0.025em;
          }
          
          .task-meta-badges {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }
          
          .task-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .task-badge.priority {
            background: rgba(255, 179, 51, 0.15);
            border: 2px solid #FFB333;
            color: #F87239;
          }
          
          .task-badge.status {
            background: rgba(88, 132, 253, 0.15);
            border: 2px solid #5884FD;
            color: #5884FD;
          }
          
          .task-badge.overdue {
            background: rgba(239, 68, 68, 0.15);
            border: 2px solid #EF4444;
            color: #EF4444;
            animation: pulse 2s infinite;
          }
          
          .task-header-actions {
            display: flex;
            gap: 0.75rem;
          }
          
          .task-action-btn {
            padding: 0.75rem;
            border: 2px solid transparent;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }
          
          .task-action-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          }
          
          .task-action-btn.edit {
            border-color: #5884FD;
            color: #5884FD;
          }
          
          .task-action-btn.edit:hover {
            background: #5884FD;
            color: #FFFFFF;
          }
          
          .task-action-btn.delete {
            border-color: #EF4444;
            color: #EF4444;
          }
          
          .task-action-btn.delete:hover {
            background: #EF4444;
            color: #FFFFFF;
          }
          
          .task-action-btn.close {
            border-color: #C483D9;
            color: #C483D9;
          }
          
          .task-action-btn.close:hover {
            background: #C483D9;
            color: #FFFFFF;
          }
          
          .task-description {
            background: rgba(255, 255, 255, 0.9);
            padding: 1.5rem;
            border: 2px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            margin-bottom: 2rem;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .task-description.empty {
            color: #9CA3AF;
            font-style: italic;
            text-align: center;
          }
          
          .task-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .task-detail-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem;
            border: 2px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .task-detail-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border-color: #FFB333;
          }
          
          .task-detail-icon {
            flex-shrink: 0;
            color: #FFB333;
            width: 20px;
            height: 20px;
          }
          
          .task-detail-content {
            flex: 1;
          }
          
          .task-detail-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #6B7280;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .task-detail-value {
            font-weight: 600;
            color: #374151;
            font-size: 0.925rem;
          }
          
          .task-status-actions-inline {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 2rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .status-actions-title {
            font-weight: 700;
            color: #374151;
            margin-bottom: 1rem;
            font-size: 1rem;
            letter-spacing: -0.025em;
          }
          
          .status-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          
          .status-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border: 2px solid #FFB333;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            font-weight: 600;
            font-size: 0.875rem;
            flex: 1;
            min-width: auto;
            justify-content: center;
            color: #FFB333;
          }
          
          .status-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.3);
            background: #FFB333;
            color: #FFFFFF;
          }
          
          .status-btn.current {
            background: #FFB333;
            color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.3);
          }
          
          .status-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .edit-form {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .form-label {
            font-weight: 700;
            color: #374151;
            font-size: 0.925rem;
            letter-spacing: 0.025em;
          }
          
          .form-input, .form-textarea, .form-select {
            padding: 1rem 1.25rem;
            border: 2px solid rgba(255, 179, 51, 0.3);
            border-radius: 12px;
            font-size: 0.925rem;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            backdrop-filter: blur(10px);
            color: #374151;
            font-weight: 500;
          }
          
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #FFB333;
            box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
            background: #FFFFFF;
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 120px;
            font-family: inherit;
            line-height: 1.6;
          }
          
          .form-actions {
            display: flex;
            gap: 1.25rem;
            margin-top: 1rem;
            padding-top: 1.5rem;
            border-top: 2px solid rgba(255, 179, 51, 0.2);
          }
          
          .btn {
            flex: 1;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            border: 2px solid;
            font-size: 0.925rem;
            letter-spacing: 0.025em;
          }
          
          .btn-primary {
            background: #FFB333;
            color: #FFFFFF;
            border-color: #FFB333;
          }
          
          .btn-primary:hover {
            background: #F87239;
            border-color: #F87239;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(255, 179, 51, 0.4);
          }
          
          .btn-secondary {
            background: rgba(255, 255, 255, 0.9);
            color: #6B7280;
            border-color: rgba(245, 245, 237, 0.8);
          }
          
          .btn-secondary:hover {
            background: #F9FAFB;
            color: #374151;
            border-color: #D1D5DB;
            transform: translateY(-3px);
          }
          
          .confirm-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 100002;
            animation: fadeIn 0.3s ease-out;
          }
          
          .confirm-modal-content {
            background: rgba(255, 255, 255, 0.98);
            border: 2px solid #EF4444;
            border-radius: 16px;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
          }
          
          .confirm-modal-title {
            font-size: 1.375rem;
            font-weight: 700;
            color: #EF4444;
            margin-bottom: 1rem;
            letter-spacing: -0.025em;
          }
          
          .confirm-modal-text {
            color: #6B7280;
            margin-bottom: 2rem;
            line-height: 1.6;
            font-weight: 500;
          }
          
          .confirm-modal-actions {
            display: flex;
            gap: 1rem;
          }
          
          .btn-danger {
            flex: 1;
            background: #EF4444;
            color: #FFFFFF;
            border: 2px solid #EF4444;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .btn-danger:hover {
            background: #DC2626;
            border-color: #DC2626;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(239, 68, 68, 0.4);
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .task-modal-overlay {
              padding: 0.75rem;
              z-index: 100000;
            }
            .task-modal-content {
              max-width: calc(100vw - 1.5rem);
              border-radius: 16px;
              height: 90vh;
              margin: 0 auto;
              z-index: 100001;
            }
            .task-modal-header {
              padding: 1.5rem;
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
            }
            .task-header-actions {
              justify-content: center;
            }
            .tab-content {
              padding: 1.5rem;
            }
            .task-details-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .task-detail-item {
              padding: 1rem;
            }
            .edit-form div[style*="grid"] {
              grid-template-columns: 1fr !important;
            }
            .form-actions {
              flex-direction: column;
              gap: 1rem;
            }
            .btn {
              padding: 1.25rem;
              font-size: 1rem;
            }
            .tab-button {
              padding: 1rem;
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
                <TaskInteractionSection task={task} />
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

  // Use portal to render modal outside of any container that might have z-index stacking context issues
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
} 