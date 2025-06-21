'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskService } from '@/lib/api-compatibility';
import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import GoogleDriveExplorer from './GoogleDriveExplorer';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  name: string;
  [key: string]: any;
}

interface Comment {
  id: number;
  comment: string;
  author: string;
  author_email: string;
  created_at: string;
  task_id: number;
}

interface Attachment {
  id: number;
  name: string;
  size: number;
  type: string;
  uploaded_by: string;
  uploaded_at: string;
  task_id: number;
  url: string;
}

interface TaskInteractionSectionProps {
  task: Task;
  onClose?: () => void;
}



export default function TaskInteractionSection({ task }: TaskInteractionSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (task?.id) {
      fetchCommentsAndAttachments();
    }
  }, [task?.id]);

  const fetchCommentsAndAttachments = async () => {
    if (!task?.id) return;
    
    setLoading(true);
    try {
      const [commentsData, attachmentsData] = await Promise.all([
        taskService.getTaskComments(task.id),
        taskService.getTaskAttachments(task.id)
      ]);
      
      setComments(commentsData);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error('Failed to fetch task comments/attachments:', error);
      setComments([]);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    
    try {
      const commentData = await taskService.createTaskComment(task.id, {
        comment: newComment.trim()
      });
      
      setComments([...comments, commentData]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };



  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .task-interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 250px;
            background: #ffffff;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
          }
          
          /* Tab Navigation */
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #000000;
            background: #f8fafc;
            flex-shrink: 0;
            z-index: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          .tab-btn {
            flex: 1;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-right: 1px solid #e5e7eb;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            min-height: 60px;
          }
          .tab-btn:last-child {
            border-right: none;
          }
          .tab-btn:hover {
            background: #e5e7eb;
            color: #000000;
          }
          .tab-btn.active {
            background: #ffffff;
            color: #000000;
            border-bottom: 3px solid #000000;
            margin-bottom: -2px;
          }

          /* Comments Section */
          .comments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
          }
          .comments-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .empty-comments, .empty-files {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
          }
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
          }
          .comment-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #f3f4f6;
          }
          .comment-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .author-avatar, .current-user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            flex-shrink: 0;
          }
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .author-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
          }
          .comment-time {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .comment-content {
            margin-left: 2.75rem;
            font-size: 0.875rem;
            color: #374151;
            line-height: 1.5;
          }
          .add-comment {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem;
            background: #f8fafc;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
          }
          .comment-input-container {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }
          .comment-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .send-comment-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .send-comment-btn:hover:not(:disabled) {
            background: #374151;
            transform: translateY(-1px);
          }
          .send-comment-btn:disabled {
            background: #d1d5db;
            cursor: not-allowed;
          }

          /* Files Section */
          .files-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
          }
          .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
          }
          .files-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #000000;
            margin: 0;
          }
          .upload-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .upload-btn:hover {
            background: #374151;
            transform: translateY(-1px);
          }
          .files-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .file-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
          }
          .file-item:hover {
            border-color: #000000;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .file-item:last-child {
            margin-bottom: 0;
          }
          .file-icon {
            width: 40px;
            height: 40px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
          }
          .file-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .file-actions {
            display: flex;
            gap: 0.5rem;
          }
          .download-btn {
            background: #ffffff;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .download-btn:hover {
            color: #000000;
            border-color: #000000;
            transform: translateY(-1px);
          }
        `
      }} />
      
      <div className="task-interaction-section">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('comments')}
            className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          >
            <ChatBubbleLeftRightIcon style={{ width: '16px', height: '16px' }} />
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          >
            <PaperClipIcon style={{ width: '16px', height: '16px' }} />
            Files & Drive
          </button>
        </div>

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="comments-section">
            <div className="comments-list">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="empty-comments">
                  <ChatBubbleLeftRightIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#d1d5db' }} />
                  <p>No comments yet</p>
                  <p>Be the first to add a comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="author-avatar">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-meta">
                        <div className="author-name">{comment.author}</div>
                        <div className="comment-time">
                          {new Date(comment.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="comment-content">{comment.comment}</div>
                  </div>
                ))
              )}
            </div>

            <div className="add-comment">
              <div className="comment-input-container">
                <div className="current-user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="comment-input"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="send-comment-btn"
                >
                  <PaperAirplaneIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="files-section">
            <GoogleDriveExplorer
              onFileSelect={(file) => {
                console.log('Selected file:', file);
                // Optionally open file in new tab
                if (file.webViewLink) {
                  window.open(file.webViewLink, '_blank');
                }
              }}
              onFolderSelect={(folderId, folderName) => {
                console.log('Selected folder:', { folderId, folderName });
              }}
              allowFileSelection={true}
              allowFolderSelection={true}
              showCreateFolder={true}
              mode="select"
            />
          </div>
        )}
      </div>
    </>
  );
} 