'use client';

import React, { useState } from 'react';
import GoogleDriveExplorer from '../../components/GoogleDriveExplorer';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

export default function GoogleDriveDemoPage() {
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');

  const handleFileSelect = (file: DriveFile) => {
    setSelectedFile(file);
    console.log('Selected file:', file);
  };

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    console.log('Selected folder:', { folderId, folderName });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .demo-header {
            margin-bottom: 2rem;
            text-align: center;
          }
          .demo-title {
            font-size: 2rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 1rem;
          }
          .demo-description {
            color: #6b7280;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .demo-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            align-items: start;
          }
          .demo-explorer {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .demo-sidebar {
            background: #f9fafb;
            padding: 1.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            height: fit-content;
          }
          .sidebar-section {
            margin-bottom: 1.5rem;
          }
          .sidebar-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.75rem;
          }
          .sidebar-content {
            color: #374151;
            font-size: 0.9rem;
            line-height: 1.5;
          }
          .file-info {
            background: #ffffff;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            word-break: break-all;
          }
          .file-info-item {
            margin-bottom: 0.5rem;
          }
          .file-info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .file-info-value {
            color: #000000;
          }
          .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .features-list li:last-child {
            border-bottom: none;
          }
          .feature-icon {
            width: 16px;
            height: 16px;
            color: #10b981;
          }
          .folder-info {
            background: #eff6ff;
            padding: 1rem;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            color: #1e40af;
          }
          @media (max-width: 768px) {
            .demo-layout {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />
      
      <div className="demo-header">
        <h1 className="demo-title">🗂️ Hierarchical Google Drive Explorer</h1>
        <p className="demo-description">
          Browse your Google Drive folders in a hierarchical tree structure. 
          Select a folder to see its files, then upload directly to that specific folder.
        </p>
      </div>

      <div className="demo-layout">
        <div className="demo-explorer">
          <GoogleDriveExplorer
            onFileSelect={handleFileSelect}
            onFolderSelect={handleFolderSelect}
            allowFileSelection={true}
            allowFolderSelection={true}
            showCreateFolder={true}
            mode="select"
          />
        </div>

        <div className="demo-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">✨ New Features</h3>
            <ul className="features-list">
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Hierarchical folder tree structure</span>
              </li>
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Expand/collapse folder navigation</span>
              </li>
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Folder selection with visual feedback</span>
              </li>
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Upload to specific selected folders</span>
              </li>
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Two-panel layout (folders + files)</span>
              </li>
              <li>
                <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Parent-child relationship visualization</span>
              </li>
            </ul>
          </div>

          {selectedFolderId && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">📁 Selected Folder</h3>
              <div className="folder-info">
                <div className="file-info-item">
                  <span className="file-info-label">Name: </span>
                  <span className="file-info-value"><strong>{selectedFolderName}</strong></span>
                </div>
                <div className="file-info-item">
                  <span className="file-info-label">ID: </span>
                  <span className="file-info-value">{selectedFolderId}</span>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  ✅ Ready to upload files to this folder
                </div>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">📄 Selected File</h3>
              <div className="file-info">
                <div className="file-info-item">
                  <span className="file-info-label">Name: </span>
                  <span className="file-info-value">{selectedFile.name}</span>
                </div>
                <div className="file-info-item">
                  <span className="file-info-label">Type: </span>
                  <span className="file-info-value">
                    {selectedFile.mimeType === 'application/vnd.google-apps.folder' ? 'Folder' : 'File'}
                  </span>
                </div>
                <div className="file-info-item">
                  <span className="file-info-label">ID: </span>
                  <span className="file-info-value">{selectedFile.id}</span>
                </div>
                {selectedFile.size && (
                  <div className="file-info-item">
                    <span className="file-info-label">Size: </span>
                    <span className="file-info-value">
                      {Math.round(parseInt(selectedFile.size) / 1024)} KB
                    </span>
                  </div>
                )}
                <div className="file-info-item">
                  <span className="file-info-label">Modified: </span>
                  <span className="file-info-value">
                    {new Date(selectedFile.modifiedTime).toLocaleDateString()}
                  </span>
                </div>
                {selectedFile.webViewLink && (
                  <div className="file-info-item">
                    <a 
                      href={selectedFile.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: '#3b82f6', 
                        textDecoration: 'underline',
                        wordBreak: 'break-all'
                      }}
                    >
                      View in Google Drive →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3 className="sidebar-title">🎯 How to Use</h3>
            <div className="sidebar-content">
              <p><strong>1. Navigate folders:</strong> Click the ▶ arrows to expand/collapse folders and see their children</p>
              <p><strong>2. Select a folder:</strong> Click on any folder name to select it (highlighted in black)</p>
              <p><strong>3. Upload files:</strong> Once a folder is selected, click "Upload to [folder name]" button</p>
              <p><strong>4. View files:</strong> Selected folder's files appear in the right panel</p>
              <p><strong>5. Search:</strong> Use search bar to find files across all folders</p>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">💡 Key Improvements</h3>
            <div className="sidebar-content">
              <p>• <strong>No more white space</strong> in task edit mode - form now fills the full height</p>
              <p>• <strong>Hierarchical structure</strong> makes it easy to understand folder relationships</p>
              <p>• <strong>Targeted uploads</strong> - select exactly where you want to upload</p>
              <p>• <strong>Visual feedback</strong> shows which folder is currently selected</p>
              <p>• <strong>Two-panel layout</strong> for better organization and workflow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 