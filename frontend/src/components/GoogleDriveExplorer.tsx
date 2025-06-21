'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  DocumentIcon, 
  ArrowLeftIcon,
  HomeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CloudArrowUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { listDriveFiles, searchDriveFiles, uploadToDrive, createDriveFolder } from '@/lib/api-compatibility';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

interface GoogleDriveExplorerProps {
  onFileSelect?: (file: DriveFile) => void;
  onFolderSelect?: (folderId: string, folderName: string) => void;
  allowFileSelection?: boolean;
  allowFolderSelection?: boolean;
  showCreateFolder?: boolean;
  mode?: 'browse' | 'select'; // New prop for different modes
}

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  isExpanded: boolean;
  isLoaded: boolean;
  parentId?: string;
}

export default function GoogleDriveExplorer({
  onFileSelect,
  onFolderSelect,
  allowFileSelection = true,
  allowFolderSelection = true,
  showCreateFolder = false,
  mode = 'browse'
}: GoogleDriveExplorerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Debug: Check authentication status
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  const hasValidToken = token && token.length > 0;

  // Show authentication debug info if no token
  if (!hasValidToken) {
    return (
      <div className="google-drive-explorer">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Authentication Required</h3>
          <p style={{ marginBottom: '1rem' }}>Please log in to access Google Drive files.</p>
          <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
            <strong>Debug Info:</strong><br/>
            Token: {token ? 'Present' : 'Missing'}<br/>
            User: {user ? 'Present' : 'Missing'}<br/>
            Please refresh the page after logging in.
          </div>
        </div>
      </div>
    );
  }

  // Fetch files from the API
  const fetchFiles = async (folderId: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDriveFiles(folderId);
      setFiles(data);
      return data;
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch files');
      setFiles([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Build folder tree recursively
  const buildFolderTree = async (parentId: string | null = null): Promise<FolderNode[]> => {
    const files = await fetchFiles(parentId);
    const folders = files.filter((file: DriveFile) => file.mimeType === 'application/vnd.google-apps.folder');
    
    return folders.map((folder: DriveFile) => ({
      id: folder.id,
      name: folder.name,
      children: [],
      isExpanded: false,
      isLoaded: false,
      parentId: parentId || undefined
    }));
  };

  // Load children for a specific folder node
  const loadFolderChildren = async (nodeId: string) => {
    const files = await fetchFiles(nodeId);
    const folders = files.filter((file: DriveFile) => file.mimeType === 'application/vnd.google-apps.folder');
    
    return folders.map((folder: DriveFile) => ({
      id: folder.id,
      name: folder.name,
      children: [],
      isExpanded: false,
      isLoaded: false,
      parentId: nodeId
    }));
  };

  // Toggle folder expansion
  const toggleFolderExpansion = async (nodeId: string) => {
    const updateTree = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            isExpanded: !node.isExpanded,
            children: node.isExpanded ? node.children : [],
            isLoaded: node.isExpanded ? node.isLoaded : false
          };
        }
        return {
          ...node,
          children: updateTree(node.children)
        };
      });
    };

    setFolderTree(prev => updateTree(prev));

    // Load children if expanding and not loaded
    const findNode = (nodes: FolderNode[], id: string): FolderNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const child = findNode(node.children, id);
        if (child) return child;
      }
      return null;
    };

    const node = findNode(folderTree, nodeId);
    if (node && !node.isExpanded && !node.isLoaded) {
      const children = await loadFolderChildren(nodeId);
      
      const updateTreeWithChildren = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              children,
              isLoaded: true,
              isExpanded: true
            };
          }
          return {
            ...n,
            children: updateTreeWithChildren(n.children)
          };
        });
      };

      setFolderTree(prev => updateTreeWithChildren(prev));
    }
  };

  // Select a folder
  const selectFolder = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    
    if (onFolderSelect) {
      onFolderSelect(folderId, folderName);
    }
  };

  // Search files
  const searchFiles = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setError(null);
    try {
      const data = await searchDriveFiles(query);
      setFiles(data);
    } catch (error) {
      console.error('Error searching files:', error);
      setError(error instanceof Error ? error.message : 'Failed to search files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new folder
  const createFolder = async (name: string, parentId: string | null = null) => {
    setLoading(true);
    try {
      const newFolder = await createDriveFolder(name, parentId || selectedFolderId);
      // Refresh the folder tree
      const rootFolders = await buildFolderTree();
      setFolderTree(rootFolders);
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error instanceof Error ? error.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFileToFolder = async (file: File, folderId: string) => {
    setUploading(true);
    try {
      const result = await uploadToDrive(file, folderId);
      setShowUploadDialog(false);
      setUploadFile(null);
      
      // Show success message
      alert(`File "${file.name}" uploaded successfully to "${selectedFolderName}"`);
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    if (query.trim()) {
      const timeoutId = setTimeout(() => searchFiles(query), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
      setFiles([]);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  // Handle upload
  const handleUpload = () => {
    if (uploadFile && selectedFolderId) {
      uploadFileToFolder(uploadFile, selectedFolderId);
    }
  };

  // Handle new folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder(newFolderName.trim());
    setShowNewFolderDialog(false);
    setNewFolderName('');
  };

  // Render folder tree node
  const renderFolderNode = (node: FolderNode, depth: number = 0) => (
    <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
      <div 
        className={`folder-tree-item ${selectedFolderId === node.id ? 'selected' : ''}`}
        onClick={() => selectFolder(node.id, node.name)}
      >
        <button
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFolderExpansion(node.id);
          }}
        >
          {node.isExpanded ? (
            <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
          ) : (
            <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
          )}
        </button>
        <FolderIcon className="folder-icon" />
        <span className="folder-name">{node.name}</span>
        {selectedFolderId === node.id && (
          <CheckIcon className="selected-icon" />
        )}
      </div>
      {node.isExpanded && node.children.map(child => renderFolderNode(child, depth + 1))}
    </div>
  );

  // Initial load
  useEffect(() => {
    const initializeFolderTree = async () => {
      const rootFolders = await buildFolderTree();
      setFolderTree(rootFolders);
    };
    initializeFolderTree();
  }, []);

  return (
    <div className="google-drive-explorer">
      <style dangerouslySetInnerHTML={{
        __html: `
          .google-drive-explorer {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            overflow: hidden;
            height: 600px;
            display: flex;
            flex-direction: column;
          }
          .drive-header {
            padding: 1rem 1.5rem;
            border-bottom: 2px solid #e5e7eb;
            background: #f9fafb;
          }
          .drive-search {
            position: relative;
            margin-bottom: 1rem;
          }
          .drive-search input {
            width: 100%;
            padding: 0.75rem 0.75rem 0.75rem 2.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          }
          .drive-search input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .drive-search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
            width: 20px;
            height: 20px;
          }
          .drive-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            justify-content: space-between;
          }
          .drive-action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .drive-action-btn:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .drive-action-btn.primary {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .drive-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .selected-folder-info {
            background: #eff6ff;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #1e40af;
          }
          .drive-content {
            flex: 1;
            overflow-y: auto;
            display: flex;
          }
          .folder-tree-panel {
            width: 50%;
            border-right: 2px solid #e5e7eb;
            padding: 1rem;
            overflow-y: auto;
          }
          .files-panel {
            width: 50%;
            padding: 1rem;
            overflow-y: auto;
          }
          .panel-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .folder-tree-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 0.25rem;
          }
          .folder-tree-item:hover {
            background: #f3f4f6;
          }
          .folder-tree-item.selected {
            background: #000000;
            color: #ffffff;
          }
          .expand-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            color: inherit;
          }
          .folder-icon {
            width: 18px;
            height: 18px;
            color: #3b82f6;
            flex-shrink: 0;
          }
          .folder-tree-item.selected .folder-icon {
            color: #ffffff;
          }
          .folder-name {
            flex: 1;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .selected-icon {
            width: 16px;
            height: 16px;
            color: #10b981;
          }
          .drive-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
            font-size: 0.9rem;
          }
          .drive-error {
            padding: 2rem;
            text-align: center;
            color: #dc2626;
            background: #fef2f2;
            border-bottom: 1px solid #fecaca;
          }
          .drive-file-list {
            padding: 0;
          }
          .drive-file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .drive-file-item:hover {
            background: #f9fafb;
          }
          .drive-file-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .drive-file-icon.folder {
            color: #3b82f6;
          }
          .drive-file-icon.file {
            color: #6b7280;
          }
          .drive-file-info {
            flex: 1;
            min-width: 0;
          }
          .drive-file-name {
            font-weight: 500;
            color: #000000;
            margin-bottom: 0.25rem;
            word-break: break-word;
            font-size: 0.875rem;
          }
          .drive-file-meta {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .drive-empty {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #6b7280;
          }
          .drive-empty-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 1rem;
            color: #d1d5db;
          }
          .search-results {
            width: 100%;
            padding: 1rem;
          }
          .search-info {
            padding: 0.75rem;
            background: #eff6ff;
            border-bottom: 1px solid #bfdbfe;
            color: #1e40af;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
          }
          .dialog-content {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
          }
          .dialog-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #000000;
          }
          .dialog-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 1rem;
          }
          .dialog-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .file-input {
            margin-bottom: 1rem;
          }
          .file-input input {
            width: 100%;
            padding: 0.75rem;
            border: 2px dashed #e5e7eb;
            border-radius: 6px;
            font-size: 0.9rem;
          }
          .upload-info {
            background: #f0f9f0;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: #166534;
          }
          .dialog-actions {
            display: flex;
            gap: 1rem;
          }
          .dialog-btn {
            flex: 1;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid;
          }
          .dialog-btn-primary {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .dialog-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .dialog-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .dialog-btn-secondary {
            background: #ffffff;
            color: #000000;
            border-color: #e5e7eb;
          }
          .dialog-btn-secondary:hover {
            border-color: #000000;
          }
        `
      }} />
      
      {/* Header */}
      <div className="drive-header">
        <div className="drive-search">
          <MagnifyingGlassIcon className="drive-search-icon" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {selectedFolderId && (
          <div className="selected-folder-info">
            <FolderIcon style={{ width: '16px', height: '16px' }} />
            <span>Selected: <strong>{selectedFolderName}</strong></span>
          </div>
        )}
        
        <div className="drive-actions">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {showCreateFolder && (
              <button
                onClick={() => setShowNewFolderDialog(true)}
                className="drive-action-btn"
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                New Folder
              </button>
            )}
          </div>
          
          {selectedFolderId && (
            <button
              onClick={() => setShowUploadDialog(true)}
              className="drive-action-btn primary"
            >
              <CloudArrowUpIcon style={{ width: '16px', height: '16px' }} />
              Upload to {selectedFolderName}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="drive-content">
        {error && (
          <div className="drive-error">
            <p>Error: {error}</p>
          </div>
        )}
        
        {isSearching ? (
          <div className="search-results">
            <div className="search-info">
              Showing search results for "{searchQuery}"
            </div>
            
            {loading ? (
              <div className="drive-loading">
                <div>Searching...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="drive-empty">
                <DocumentIcon className="drive-empty-icon" />
                <p>No files found</p>
              </div>
            ) : (
              <div className="drive-file-list">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="drive-file-item"
                    onClick={() => {
                      if (file.mimeType === 'application/vnd.google-apps.folder') {
                        selectFolder(file.id, file.name);
                      } else if (onFileSelect) {
                        onFileSelect(file);
                      }
                    }}
                  >
                    <div className={`drive-file-icon ${file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file'}`}>
                      {file.mimeType === 'application/vnd.google-apps.folder' ? (
                        <FolderIcon />
                      ) : (
                        <DocumentIcon />
                      )}
                    </div>
                    
                    <div className="drive-file-info">
                      <div className="drive-file-name">{file.name}</div>
                      <div className="drive-file-meta">
                        {file.mimeType === 'application/vnd.google-apps.folder' ? 'Folder' : 'File'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Folder Tree Panel */}
            <div className="folder-tree-panel">
              <h3 className="panel-title">📁 Folder Structure</h3>
              {loading ? (
                <div className="drive-loading">
                  <div>Loading folders...</div>
                </div>
              ) : folderTree.length === 0 ? (
                <div className="drive-empty">
                  <FolderIcon className="drive-empty-icon" />
                  <p>No folders found</p>
                </div>
              ) : (
                <div className="folder-tree">
                  {folderTree.map(node => renderFolderNode(node))}
                </div>
              )}
            </div>

            {/* Files Panel */}
            <div className="files-panel">
              <h3 className="panel-title">
                📄 Files {selectedFolderName && `in "${selectedFolderName}"`}
              </h3>
              {selectedFolderId ? (
                <div>
                  {/* Show files in selected folder */}
                  <div className="drive-file-list">
                    {files.filter(file => file.mimeType !== 'application/vnd.google-apps.folder').map((file) => (
                      <div
                        key={file.id}
                        className="drive-file-item"
                        onClick={() => onFileSelect && onFileSelect(file)}
                      >
                        <DocumentIcon className="drive-file-icon file" />
                        <div className="drive-file-info">
                          <div className="drive-file-name">{file.name}</div>
                          <div className="drive-file-meta">
                            {file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'File'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="drive-empty">
                  <DocumentIcon className="drive-empty-icon" />
                  <p>Select a folder to view its files</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="dialog-overlay" onClick={() => setShowNewFolderDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Create New Folder</h3>
            <input
              type="text"
              className="dialog-input"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button
                onClick={() => setShowNewFolderDialog(false)}
                className="dialog-btn dialog-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="dialog-btn dialog-btn-primary"
                disabled={!newFolderName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="dialog-overlay" onClick={() => setShowUploadDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Upload File</h3>
            
            <div className="upload-info">
              <strong>Upload to:</strong> {selectedFolderName}
            </div>
            
            <div className="file-input">
              <input
                type="file"
                onChange={handleFileSelect}
                accept="*/*"
              />
            </div>
            
            {uploadFile && (
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Selected: <strong>{uploadFile.name}</strong> ({Math.round(uploadFile.size / 1024)} KB)
              </div>
            )}
            
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadFile(null);
                }}
                className="dialog-btn dialog-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="dialog-btn dialog-btn-primary"
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 