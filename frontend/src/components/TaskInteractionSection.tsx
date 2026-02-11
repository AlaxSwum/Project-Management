'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskService } from '@/lib/api-compatibility';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  FolderIcon,
  CloudArrowUpIcon,
  DocumentIcon
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
  attachments?: Attachment[];
}

interface Attachment {
  id: number;
  file: string;
  filename: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  created_at: string;
  file_size: number;
  // Extended properties for file display
  name?: string;
  size?: number;
  type?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  task_id?: number;
  url?: string;
  source?: 'upload' | 'drive';
  drive_file_id?: string;
}

interface TaskInteractionSectionProps {
  task: Task;
  onClose?: () => void;
}

export default function TaskInteractionSection({ task }: TaskInteractionSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // File upload states
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showDriveExplorer, setShowDriveExplorer] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      
      setComments(commentsData || []);
    } catch (error) {
      console.error('Failed to fetch task comments/attachments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && selectedFiles.length === 0 && selectedDriveFiles.length === 0) return;
    if (!task?.id) return;
    
    setIsUploading(true);
    try {
      // Create comment with text
      const commentData = await taskService.createTaskComment(task.id, {
        comment: newComment.trim() || 'Shared files'
      });
      
      // Handle file uploads
      const attachments = [];
      
              // Upload selected files
        for (const file of selectedFiles) {
          try {
            const attachment = await taskService.uploadTaskAttachment(task.id, file);
            if (attachment) {
              const enhancedAttachment: Attachment = {
                ...attachment,
                source: 'upload' as const,
                name: attachment.filename,
                size: attachment.file_size,
                url: attachment.file,
                uploaded_by: attachment.user?.name || 'Unknown',
                uploaded_at: attachment.created_at
              };
              attachments.push(enhancedAttachment);
            }
          } catch (error) {
            console.error('Failed to upload file:', file.name, error);
          }
        }
        
        // Handle Google Drive files
        for (const driveFile of selectedDriveFiles) {
          try {
            // Create attachment record for Drive file
            const attachment: Attachment = {
              id: Date.now() + Math.random(),
              file: driveFile.webViewLink || driveFile.webContentLink || '',
              filename: driveFile.name,
              user: {
                id: user?.id || 0,
                name: user?.name || 'Unknown',
                email: user?.email || 'Unknown',
                role: user?.role || 'user'
              },
              created_at: new Date().toISOString(),
              file_size: driveFile.size || 0,
              name: driveFile.name,
              size: driveFile.size || 0,
              type: driveFile.mimeType || 'application/octet-stream',
              uploaded_by: user?.name || user?.email || 'Unknown',
              uploaded_at: new Date().toISOString(),
              task_id: task.id,
              url: driveFile.webViewLink || driveFile.webContentLink,
              source: 'drive' as const,
              drive_file_id: driveFile.id
            };
            attachments.push(attachment);
          } catch (error) {
            console.error('Failed to attach Drive file:', driveFile.name, error);
          }
        }
      
      if (commentData) {
        const commentWithAttachments = {
          ...commentData,
          attachments: attachments
        };
        setComments([...comments, commentWithAttachments]);
        setNewComment('');
        setSelectedFiles([]);
        setSelectedDriveFiles([]);
        setShowFileOptions(false);
        setShowDriveExplorer(false);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleDriveFileSelect = (file: any) => {
    setSelectedDriveFiles([...selectedDriveFiles, file]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeSelectedDriveFile = (index: number) => {
    setSelectedDriveFiles(selectedDriveFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .task-interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #1F1F1F;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

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
            max-height: calc(100% - 200px);
            scrollbar-width: thin;
            scrollbar-color: rgba(55, 65, 81, 0.3) transparent;
          }
          
          .comments-list::-webkit-scrollbar {
            width: 6px;
          }
          
          .comments-list::-webkit-scrollbar-track {
            background: rgba(55, 65, 81, 0.1);
            border-radius: 3px;
          }
          
          .comments-list::-webkit-scrollbar-thumb {
            background: rgba(55, 65, 81, 0.3);
            border-radius: 3px;
          }
          
          .comments-list::-webkit-scrollbar-thumb:hover {
            background: rgba(55, 65, 81, 0.5);
          }
          
          .empty-comments {
            text-align: center;
            padding: 2rem 1rem;
            color: #71717A;
            background: #1A1A1A;
            border-radius: 8px;
            border: 1px solid #2D2D2D;
            margin: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }
          
          .empty-comments p {
            margin: 0.5rem 0;
            font-weight: 500;
          }
          
          .empty-comments p:first-of-type {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 1rem;
          }
          
          .comment-item {
            margin-bottom: 1rem;
            padding: 1rem;
            background: #1A1A1A;
            border-radius: 8px;
            border: 1px solid #2D2D2D;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
          }
          
          .comment-item:hover {
            border-color: #3D3D3D;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
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
            background: #111827;
            border: 1px solid #2D2D2D;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
            flex-shrink: 0;
          }
          
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          
          .author-name {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
          }
          
          .comment-time {
            font-size: 0.75rem;
            color: #71717A;
            font-weight: 500;
          }
          
          .comment-content {
            margin-left: 0;
            font-size: 0.875rem;
            color: #A1A1AA;
            line-height: 1.5;
            font-weight: 500;
            margin-bottom: 0.75rem;
          }

          .comment-attachments {
            margin-top: 0.75rem;
          }

          .attachment-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 6px;
            margin-bottom: 0.5rem;
            transition: all 0.2s ease;
          }

          .attachment-item:hover {
            background: #1F1F1F;
            border-color: #3D3D3D;
          }

          .attachment-icon {
            width: 20px;
            height: 20px;
            color: #71717A;
            flex-shrink: 0;
          }

          .attachment-info {
            flex: 1;
          }

          .attachment-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: #A1A1AA;
            margin-bottom: 0.25rem;
          }

          .attachment-meta {
            font-size: 0.75rem;
            color: #71717A;
          }
          
          .add-comment {
            border-top: 1px solid #2D2D2D;
            padding: 1rem;
            background: #1A1A1A;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
          }
          
          .comment-input-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .comment-input-row {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            width: 100%;
          }
          
          .comment-input {
            flex: 1;
            padding: 0.875rem 1rem;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.5;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
            background: #1A1A1A;
            color: #A1A1AA;
            font-weight: 500;
            font-family: inherit;
          }
          
          .comment-input:focus {
            outline: none;
            border-color: #2D2D2D;
            box-shadow: 0 0 0 3px rgba(45, 45, 45, 0.3);
          }
          
          .comment-input::placeholder {
            color: #71717A;
            font-weight: 500;
          }

          .comment-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
          }

          .file-actions {
            display: flex;
            gap: 0.5rem;
          }

          .file-action-btn {
            padding: 0.5rem;
            background: #1A1A1A;
            border: 1px solid #3D3D3D;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #71717A;
          }

          .file-action-btn:hover {
            background: #141414;
            border-color: #2D2D2D;
            color: #A1A1AA;
          }

          .file-action-btn.active {
            background: #1F1F1F;
            border-color: #2D2D2D;
            color: #A1A1AA;
          }
          
          .send-comment-btn {
            background: #111827;
            color: #ffffff;
            border: none;
            padding: 0.875rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.875rem;
          }
          
          .send-comment-btn:hover:not(:disabled) {
            background: #1f2937;
          }
          
          .send-comment-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .selected-files {
            margin-top: 0.75rem;
          }

          .selected-files-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 0.5rem;
          }

          .selected-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem;
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 6px;
            margin-bottom: 0.5rem;
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
          }

          .file-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: #A1A1AA;
          }

          .file-size {
            font-size: 0.75rem;
            color: #71717A;
          }

          .remove-file-btn {
            padding: 0.25rem;
            background: none;
            border: none;
            cursor: pointer;
            color: #ef4444;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .remove-file-btn:hover {
            background: #fee2e2;
          }

          .drive-explorer-modal {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 1000;
          }

          .drive-explorer-content {
            background: #1A1A1A;
            border-radius: 12px;
            width: 100%;
            max-width: 800px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          }

          .drive-explorer-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #2D2D2D;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .drive-explorer-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #FFFFFF;
          }

          .close-explorer-btn {
            padding: 0.5rem;
            background: none;
            border: none;
            cursor: pointer;
            color: #71717A;
            border-radius: 6px;
            transition: all 0.2s ease;
          }

          .close-explorer-btn:hover {
            background: #1F1F1F;
            color: #A1A1AA;
          }

          .drive-explorer-body {
            flex: 1;
            overflow: hidden;
          }

          .file-input-hidden {
            display: none;
          }

          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: #71717A;
            font-weight: 500;
            background: #1A1A1A;
            border-radius: 8px;
            border: 1px solid #2D2D2D;
            margin: 1rem;
          }
          
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
              font-size: 0.75rem;
            }

            .comment-actions {
              flex-direction: column;
              align-items: stretch;
              gap: 0.75rem;
            }

            .file-actions {
              justify-content: center;
            }

            .drive-explorer-content {
              max-width: 95vw;
              height: 80vh;
            }
          }
        `
      }} />
      
      <div className="task-interaction-section">
        <div className="comments-section">
          <div className="comments-list">
            {loading ? (
              <div className="loading-state">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="empty-comments">
                <ChatBubbleLeftRightIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#3D3D3D' }} />
                <p>No comments yet</p>
                <p>Be the first to add a comment or share files!</p>
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
                  
                                     {comment.attachments && comment.attachments.length > 0 && (
                     <div className="comment-attachments">
                       {comment.attachments.map((attachment, index) => (
                         <div key={index} className="attachment-item">
                           <DocumentIcon className="attachment-icon" />
                           <div className="attachment-info">
                             <div className="attachment-name">
                               {attachment.name || attachment.filename}
                             </div>
                             <div className="attachment-meta">
                               {formatFileSize(attachment.size || attachment.file_size)} • {attachment.source === 'drive' ? 'Google Drive' : 'Uploaded'}
                             </div>
                           </div>
                           {(attachment.url || attachment.file) && (
                             <a
                               href={attachment.url || attachment.file}
                               target="_blank"
                               rel="noopener noreferrer"
                               style={{
                                 padding: '0.25rem 0.5rem',
                                 background: '#1F1F1F',
                                 border: '1px solid #3D3D3D',
                                 borderRadius: '4px',
                                 color: '#A1A1AA',
                                 textDecoration: 'none',
                                 fontSize: '0.75rem',
                                 fontWeight: '500'
                               }}
                             >
                               View
                             </a>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              ))
            )}
          </div>

          <div className="add-comment">
            <div className="comment-input-container">
              <div className="comment-input-row">
                <div className="current-user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or share files..."
                  className="comment-input"
                />
              </div>

              {(selectedFiles.length > 0 || selectedDriveFiles.length > 0) && (
                <div className="selected-files">
                  <div className="selected-files-title">Attached Files:</div>
                  
                  {selectedFiles.map((file, index) => (
                    <div key={`file-${index}`} className="selected-file-item">
                      <div className="file-info">
                        <DocumentIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="remove-file-btn"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {selectedDriveFiles.map((file, index) => (
                    <div key={`drive-${index}`} className="selected-file-item">
                      <div className="file-info">
                        <DocumentIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">(Google Drive)</span>
                      </div>
                      <button
                        onClick={() => removeSelectedDriveFile(index)}
                        className="remove-file-btn"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="comment-actions">
                <div className="file-actions">
                  <button
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="file-action-btn"
                    type="button"
                    title="Upload files"
                  >
                    <CloudArrowUpIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                  <button
                    onClick={() => setShowDriveExplorer(true)}
                    className="file-action-btn"
                    type="button"
                    title="Choose from Google Drive"
                  >
                    <FolderIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
                
                <button
                  onClick={handleAddComment}
                  disabled={(!newComment.trim() && selectedFiles.length === 0 && selectedDriveFiles.length === 0) || isUploading}
                  className="send-comment-btn"
                >
                  {isUploading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="file-input-hidden"
            />
          </div>
        </div>
      </div>

      {/* Google Drive Explorer Modal */}
      {showDriveExplorer && (
        <div className="drive-explorer-modal" onClick={() => setShowDriveExplorer(false)}>
          <div className="drive-explorer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drive-explorer-header">
              <h3 className="drive-explorer-title">Choose from Google Drive</h3>
              <button
                onClick={() => setShowDriveExplorer(false)}
                className="close-explorer-btn"
              >
                ✕
              </button>
            </div>
            <div className="drive-explorer-body">
              <GoogleDriveExplorer
                onFileSelect={handleDriveFileSelect}
                onFolderSelect={() => {}}
                allowFileSelection={true}
                allowFolderSelection={false}
                showCreateFolder={false}
                mode="select"
              />
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </>
  );
} 