'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { projectService } from '@/lib/api-compatibility';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ProjectMembersModalProps {
  projectId: number;
  currentMembers: User[];
  onClose: () => void;
  onMembersUpdate: () => void;
}

export default function ProjectMembersModal({ 
  projectId, 
  currentMembers, 
  onClose, 
  onMembersUpdate 
}: ProjectMembersModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const users = await projectService.getUsers();
      setAllUsers(users);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nonMembers = filteredUsers.filter(user => 
    !currentMembers.some(member => member.id === user.id)
  );

  const handleAddMember = async (userId: number) => {
    setIsLoading(true);
    setError('');
    
    try {
      await projectService.addProjectMember(projectId, userId);
      onMembersUpdate();
    } catch (err) {
      setError('Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setIsLoading(true);
    setError('');
    
    try {
      await projectService.removeProjectMember(projectId, userId);
      onMembersUpdate();
    } catch (err) {
      setError('Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .members-modal-overlay {
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
          }
          .members-modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideIn 0.3s ease-out;
            position: relative;
          }
          .members-modal-header {
            padding: 1.5rem 2rem;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .members-modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
          }
          .members-modal-body {
            padding: 2rem;
            max-height: 60vh;
            overflow-y: auto;
          }
          .search-section {
            margin-bottom: 2rem;
          }
          .search-box {
            position: relative;
          }
          .search-input {
            width: 100%;
            padding: 0.75rem 0.75rem 0.75rem 2.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
          }
          .search-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
          }
          .members-section {
            margin-bottom: 2rem;
          }
          .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .member-count {
            background: #f3f4f6;
            color: #374151;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .user-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .user-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          .user-item:hover {
            border-color: #d1d5db;
            background: #f9fafb;
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 600;
            color: #000000;
          }
          .user-details {
            flex: 1;
          }
          .user-name {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.25rem;
          }
          .user-email {
            font-size: 0.875rem;
            color: #6b7280;
          }
          .user-role {
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            font-weight: 500;
          }
          .action-btn {
            padding: 0.5rem;
            border: 2px solid;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .action-btn:hover {
            transform: translateY(-1px);
          }
          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .add-btn {
            border-color: #10b981;
            color: #10b981;
          }
          .add-btn:hover:not(:disabled) {
            background: #10b981;
            color: #ffffff;
          }
          .remove-btn {
            border-color: #ef4444;
            color: #ef4444;
          }
          .remove-btn:hover:not(:disabled) {
            background: #ef4444;
            color: #ffffff;
          }
          .close-btn {
            border: none;
            background: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            background: #f3f4f6;
          }
          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .empty-state {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `
      }} />
      
      <div className="members-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="members-modal-header">
          <h2 className="members-modal-title">Manage Team Members</h2>
          <button onClick={onClose} className="close-btn">
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div className="members-modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="search-section">
            <div className="search-box">
              <MagnifyingGlassIcon className="search-icon" style={{ width: '20px', height: '20px' }} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="members-section">
            <h3 className="section-title">
              Current Members
              <span className="member-count">{currentMembers.length}</span>
            </h3>
            <div className="user-list">
              {currentMembers.length === 0 ? (
                <div className="empty-state">
                  <p>No members yet</p>
                </div>
              ) : (
                currentMembers.map((member) => (
                  <div key={member.id} className="user-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{member.name}</div>
                        <div className="user-email">{member.email}</div>
                        {member.role && <div className="user-role">{member.role}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isLoading}
                      className="action-btn remove-btn"
                      title="Remove member"
                    >
                      <UserMinusIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="members-section">
            <h3 className="section-title">
              Add New Members
              <span className="member-count">{nonMembers.length} available</span>
            </h3>
            <div className="user-list">
              {nonMembers.length === 0 ? (
                <div className="empty-state">
                  <p>
                    {searchQuery 
                      ? 'No users found matching your search' 
                      : 'All users are already members'
                    }
                  </p>
                </div>
              ) : (
                nonMembers.map((user) => (
                  <div key={user.id} className="user-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        {user.role && <div className="user-role">{user.role}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      disabled={isLoading}
                      className="action-btn add-btn"
                      title="Add member"
                    >
                      <UserPlusIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 