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
  activeSection?: 'comments' | 'files';
  onClose?: () => void;
}

export default function TaskInteractionSection({ task, activeSection = 'comments' }: TaskInteractionSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
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
      
      if (commentData) {
        setComments([...comments, commentData]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          .task-interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          /* Comments Section */
          .comments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            gap: 0;
          }
          
          .comments-list {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            min-height: 200px;
            max-height: calc(100% - 120px);
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 179, 51, 0.3) transparent;
          }
          
          .comments-list::-webkit-scrollbar {
            width: 8px;
          }
          
          .comments-list::-webkit-scrollbar-track {
            background: rgba(255, 179, 51, 0.1);
            border-radius: 4px;
          }
          
          .comments-list::-webkit-scrollbar-thumb {
            background: rgba(255, 179, 51, 0.3);
            border-radius: 4px;
          }
          
          .comments-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 179, 51, 0.5);
          }
          
          .empty-comments, .empty-files {
            text-align: center;
            padding: 2rem 1rem;
            color: #6B7280;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 2px solid rgba(255, 179, 51, 0.2);
            margin: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
            font-weight: 500;
          }
          
          .empty-comments p:first-of-type, .empty-files p:first-of-type {
            font-weight: 600;
            color: #374151;
            font-size: 1rem;
          }
          
          .comment-item {
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 2px solid rgba(255, 179, 51, 0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          
          .comment-item:hover {
            border-color: rgba(255, 179, 51, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          }
          
          .comment-item:last-child {
            margin-bottom: 0;
          }
          
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          
          .author-avatar, .current-user-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #FFB333, #F87239);
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            color: #FFFFFF;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
          }
          
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          
          .author-name {
            font-weight: 600;
            color: #374151;
            font-size: 0.925rem;
            letter-spacing: -0.025em;
          }
          
          .comment-time {
            font-size: 0.8rem;
            color: #6B7280;
            font-weight: 500;
          }
          
          .comment-content {
            margin-left: 0;
            font-size: 0.925rem;
            color: #374151;
            line-height: 1.6;
            font-weight: 500;
          }
          
          .add-comment {
            border-top: 2px solid rgba(255, 179, 51, 0.2);
            padding: 1rem;
            background: rgba(255, 255, 255, 0.9);
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
            backdrop-filter: blur(10px);
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
            padding: 1rem;
            border: 2px solid rgba(255, 179, 51, 0.3);
            border-radius: 12px;
            font-size: 0.925rem;
            line-height: 1.5;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            color: #374151;
            font-weight: 500;
            font-family: inherit;
          }
          
          .comment-input:focus {
            outline: none;
            border-color: #FFB333;
            box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
            background: #FFFFFF;
          }
          
          .comment-input::placeholder {
            color: #9CA3AF;
            font-weight: 500;
          }
          
          .send-comment-btn {
            background: linear-gradient(135deg, #FFB333, #F87239);
            color: #FFFFFF;
            border: none;
            padding: 1rem;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.3);
          }
          
          .send-comment-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #F87239, #DC2626);
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.4);
          }
          
          .send-comment-btn:disabled {
            background: linear-gradient(135deg, #D1D5DB, #9CA3AF);
            cursor: not-allowed;
            transform: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          /* Files Section */
          .files-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            padding: 1rem;
            gap: 1rem;
          }
          
          .files-header {
            background: rgba(255, 255, 255, 0.9);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid rgba(255, 179, 51, 0.2);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .files-header h3 {
            margin: 0 0 0.5rem 0;
            color: #FFB333;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.025em;
          }
          
          .files-header p {
            margin: 0;
            color: #6B7280;
            font-size: 0.925rem;
            font-weight: 500;
            line-height: 1.5;
          }
          
          .drive-explorer-container {
            flex: 1;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 2px solid rgba(255, 179, 51, 0.2);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          /* Loading state */
          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: #6B7280;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 2px solid rgba(255, 179, 51, 0.2);
            margin: 1rem;
            backdrop-filter: blur(10px);
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .comments-list {
              padding: 0.75rem;
            }
            
            .comment-item {
              padding: 0.75rem;
            }
            
            .add-comment {
              padding: 0.75rem;
            }
            
            .comment-input {
              min-height: 60px;
              font-size: 0.875rem;
            }
            
            .author-avatar, .current-user-avatar {
              width: 32px;
              height: 32px;
              font-size: 0.8rem;
            }
            
            .files-section {
              padding: 0.75rem;
            }
            
            .files-header {
              padding: 1rem;
            }
          }
        `
      }} />
      
      <div className="task-interaction-section">
        {/* Comments Section */}
        {activeSection === 'comments' && (
          <div className="comments-section">
            <div className="comments-list">
              {loading ? (
                <div className="loading-state">
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

        {/* Files Section */}
        {activeSection === 'files' && (
          <div className="files-section">
            <div className="files-header">
              <h3>📁 Files & Documents</h3>
              <p>Browse and organize your project files. Click on folders to expand them and view files inside.</p>
            </div>
            
            <div className="drive-explorer-container">
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
          </div>
        )}
      </div>
    </>
  );
} 