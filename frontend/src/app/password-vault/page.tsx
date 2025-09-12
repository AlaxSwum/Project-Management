'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  KeyIcon, 
  FolderIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  UserPlusIcon,
  LockClosedIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface PasswordEntry {
  id: number;
  account_name: string;
  email: string;
  username: string;
  password_encrypted: string;
  website_url: string;
  notes: string;
  folder_id: number;
  folder_name: string;
  created_at: string;
  is_favorite: boolean;
  password_strength: string;
  shared_with?: any[];
  is_shared?: boolean;
}

interface PasswordFolder {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_by_id: number;
  is_shared: boolean;
  members?: FolderMember[];
  password_count?: number;
}

interface FolderMember {
  id: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  permission_level: 'owner' | 'editor' | 'viewer';
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage_access: boolean;
  can_create_passwords: boolean;
}

export default function PasswordVaultPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [folders, setFolders] = useState<PasswordFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [selectedFolderForMembers, setSelectedFolderForMembers] = useState<PasswordFolder | null>(null);
  const [passwordToShare, setPasswordToShare] = useState<PasswordEntry | null>(null);
  const [passwordToView, setPasswordToView] = useState<PasswordEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({});
  
  // Share states
  const [shareEmail, setShareEmail] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [sharePermissions, setSharePermissions] = useState({
    can_view: true,
    can_edit: false,
    can_delete: false,
    can_share: false
  });
  
  const [newPassword, setNewPassword] = useState({
    account_name: '',
    email: '',
    username: '',
    password_encrypted: '',
    website_url: '',
    notes: '',
    folder_id: null as number | null
  });
  
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: '#5884FD',
    icon: 'folder'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchPasswords(), fetchFolders()]);
    } catch (err: any) {
      setError('Failed to load password vault: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPasswords = async () => {
    const { supabaseDb, supabase } = await import('@/lib/supabase');
    
    // Use the new service function
    const { data, error } = await supabaseDb.getPasswordEntries();
    
    if (error) throw error;
    
    // Enhance each password with shared member information
    const passwordsWithSharing = await Promise.all(
      data.map(async (item: any) => {
        // Get shared members for this password
        let sharedWith: any[] = [];
        try {
          const { data: shareData } = await supabase
            .from('password_vault_access')
            .select('*')
            .eq('vault_id', item.id);
          
          sharedWith = shareData || [];
        } catch (shareError) {
          console.warn('Could not fetch sharing data for password:', item.id);
          sharedWith = [];
        }
        
        return {
          ...item,
          folder_name: item.folder_name || 'Personal',
          shared_with: sharedWith,
          is_shared: sharedWith.length > 0
        };
      })
    );
    
    setPasswords(passwordsWithSharing);
  };

  const fetchFolders = async () => {
    const { supabaseDb, supabase } = await import('@/lib/supabase');
    
    // Use the new service function
    const { data, error } = await supabaseDb.getPasswordFolders();
    
    if (error) throw error;
    
    // Count passwords per folder and try to get access data separately
    const foldersWithCounts = await Promise.all(
      (data || []).map(async (folder: any) => {
        const { count } = await supabase
          .from('password_vault')
          .select('*', { count: 'exact' })
          .eq('folder_id', folder.id)
          .eq('is_active', true);
        
        // Try to get access data, but don't fail if table doesn't exist
        let members: FolderMember[] = [];
        try {
          const { data: accessData } = await supabase
            .from('password_vault_folder_access')
            .select(`
              id,
              user_id,
              permission_level,
              can_view,
              can_edit,
              can_delete,
              can_manage_access,
              can_create_passwords
            `)
            .eq('folder_id', folder.id);
          
          members = accessData || [];
        } catch (accessError) {
          console.warn('password_vault_folder_access table not found, using empty members array');
          members = [];
        }
        
        return {
          ...folder,
          password_count: count || 0,
          members: members
        };
      })
    );
    
    setFolders(foldersWithCounts);
  };

  const createFolder = async () => {
    try {
      if (!newFolder.name.trim()) {
        setError('Folder name is required');
        return;
      }

      const { supabaseDb } = await import('@/lib/supabase');
      
      const folderData = {
        ...newFolder,
        created_by_id: user?.id
      };
      
      console.log('Creating folder with data:', folderData);
      const { data, error } = await supabaseDb.createPasswordFolder(folderData);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Folder created successfully:', data);
      await fetchFolders();
      setShowFolderModal(false);
      setNewFolder({
        name: '',
        description: '',
        color: '#5884FD',
        icon: 'folder'
      });
      setError('');
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder: ' + err.message);
    }
  };

  const createPassword = async () => {
    try {
      if (!newPassword.account_name.trim() || !newPassword.password_encrypted.trim()) {
        setError('Account name and password are required');
        return;
      }

      const { supabaseDb } = await import('@/lib/supabase');
      
      // Simple "encryption" - in production, use proper encryption
      const encryptedPassword = btoa(newPassword.password_encrypted);
      
      const entryData = {
        ...newPassword,
        password_encrypted: encryptedPassword,
        created_by_id: user?.id,
        folder_id: newPassword.folder_id || folders[0]?.id || null
      };
      
      console.log('Creating password with data:', entryData);
      const { data, error } = await supabaseDb.createPasswordEntry(entryData);
      
      if (error) {
        console.error('Password creation error:', error);
        throw error;
      }
      
      console.log('Password created successfully:', data);
      await fetchPasswords();
      setShowPasswordModal(false);
      setNewPassword({
        account_name: '',
        email: '',
        username: '',
        password_encrypted: '',
        website_url: '',
        notes: '',
        folder_id: null
      });
      setError('');
    } catch (err: any) {
      console.error('Error creating password:', err);
      setError('Failed to create password entry: ' + err.message);
    }
  };

  const updatePassword = async () => {
    try {
      if (!selectedPassword || !newPassword.account_name.trim()) {
        setError('Account name is required');
        return;
      }

      const supabase = (await import('@/lib/supabase')).supabase;
      
      const updateData: any = { ...newPassword };
      if (newPassword.password_encrypted) {
        updateData.password_encrypted = btoa(newPassword.password_encrypted);
      } else {
        delete updateData.password_encrypted;
      }
      
      const { error } = await supabase
        .from('password_vault')
        .update(updateData)
        .eq('id', selectedPassword.id);
      
      if (error) throw error;
      
      await fetchPasswords();
      setShowPasswordModal(false);
      setSelectedPassword(null);
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError('Failed to update password entry: ' + err.message);
    }
  };

  const deletePassword = async (id: number) => {
    if (!confirm('Are you sure you want to delete this password entry?')) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('password_vault')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchPasswords();
    } catch (err: any) {
      setError('Failed to delete password entry: ' + err.message);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openViewModal = (password: PasswordEntry) => {
    setPasswordToView(password);
    setShowViewModal(true);
  };

  const openShareModal = (password: PasswordEntry) => {
    setPasswordToShare(password);
    setShowShareModal(true);
    setShareEmail('');
    setEmailSuggestions([]);
    setShowEmailSuggestions(false);
    setSharePermissions({
      can_view: true,
      can_edit: false,
      can_delete: false,
      can_share: false
    });
    // Load available team member emails
    loadTeamMemberEmails();
  };

  const loadTeamMemberEmails = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('auth_user')
        .select('email')
        .eq('is_active', true);
      
      const emails = (data || []).map((user: any) => user.email).filter(Boolean);
      setEmailSuggestions(emails);
    } catch (error) {
      console.error('Error loading team member emails:', error);
    }
  };

  const handleEmailChange = (value: string) => {
    setShareEmail(value);
    if (value.length > 0) {
      const filtered = emailSuggestions.filter(email => 
        email.toLowerCase().includes(value.toLowerCase())
      );
      setShowEmailSuggestions(filtered.length > 0);
    } else {
      setShowEmailSuggestions(false);
    }
  };

  const sharePassword = async () => {
    try {
      if (!passwordToShare || !shareEmail.trim()) {
        setError('Email is required');
        return;
      }

      const { supabase } = await import('@/lib/supabase');
      
      const shareData = {
        vault_id: passwordToShare.id,
        user_email: shareEmail.trim(),
        ...sharePermissions,
        granted_by_id: user?.id
      };
      
      console.log('Sharing password with data:', shareData);
      const { data, error } = await supabase
        .from('password_vault_access')
        .insert([shareData])
        .select()
        .single();
      
      if (error) {
        console.error('Share error:', error);
        throw error;
      }
      
      console.log('Password shared successfully:', data);
      setShowShareModal(false);
      setPasswordToShare(null);
      setShareEmail('');
      setError('');
      
      // Show success message
      alert(`Password shared with ${shareEmail} successfully!`);
      
    } catch (err: any) {
      console.error('Error sharing password:', err);
      setError('Failed to share password: ' + err.message);
    }
  };

  const decryptPassword = (encryptedPassword: string) => {
    try {
      return atob(encryptedPassword);
    } catch (err) {
      return 'Error decrypting password';
    }
  };

  const togglePasswordVisibility = (passwordId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [passwordId]: !prev[passwordId]
    }));
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFolder = selectedFolder === null || password.folder_id === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  const openEditModal = (password: PasswordEntry) => {
    setSelectedPassword(password);
    setNewPassword({
      account_name: password.account_name,
      email: password.email,
      username: password.username,
      password_encrypted: '', // Don't populate password for security
      website_url: password.website_url,
      notes: password.notes,
      folder_id: password.folder_id
    });
    setIsEditing(true);
    setShowPasswordModal(true);
  };

  const openCreateModal = () => {
    setSelectedPassword(null);
    setNewPassword({
      account_name: '',
      email: '',
      username: '',
      password_encrypted: '',
      website_url: '',
      notes: '',
              folder_id: selectedFolder || folders[0]?.id || null
    });
    setIsEditing(false);
    setShowPasswordModal(true);
  };

  const updateMemberPermission = async (memberId: number, newPermission: 'owner' | 'editor' | 'viewer') => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const permissionMap = {
        owner: { can_view: true, can_edit: true, can_delete: true, can_manage_access: true, can_create_passwords: true },
        editor: { can_view: true, can_edit: true, can_delete: false, can_manage_access: false, can_create_passwords: true },
        viewer: { can_view: true, can_edit: false, can_delete: false, can_manage_access: false, can_create_passwords: false }
      };
      
      const { error } = await supabase
        .from('password_vault_folder_access')
        .update({
          permission_level: newPermission,
          ...permissionMap[newPermission]
        })
        .eq('id', memberId);
      
      if (error) throw error;
      
      // Refresh data
      await fetchFolders();
      setError('');
    } catch (err: any) {
      setError('Failed to update member permission: ' + err.message);
    }
  };

  const removeMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('password_vault_folder_access')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      // Refresh data
      await fetchFolders();
      setError('');
    } catch (err: any) {
      setError('Failed to remove member: ' + err.message);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #C483D9', 
            borderTop: '3px solid #5884FD', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .modal-content {
            background: #ffffff;
            border-radius: 16px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
          
          .password-item {
            transition: all 0.2s ease;
          }
          
          .password-item:hover {
            background: #f8fafc !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .folder-item {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          
          .folder-item:hover {
            background: #f8fafc !important;
            transform: translateY(-1px);
          }
          
          .folder-item.active {
            background: linear-gradient(135deg, #5884FD, #6c91ff) !important;
            color: #ffffff !important;
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <KeyIcon style={{ width: '36px', height: '36px', color: '#5884FD' }} />
                Password Vault
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Secure password management with folder organization
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowFolderModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#C483D9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(196, 131, 217, 0.3)'
                }}
              >
                <FolderIcon style={{ width: '16px', height: '16px' }} />
                New Folder
              </button>
              
              <button
                onClick={openCreateModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                New Password
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #F87239', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#F87239',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
            {/* Sidebar with folders */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
              height: 'fit-content'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                margin: '0 0 1rem 0',
                color: '#1a1a1a'
              }}>
                Folders
              </h3>
              
              {/* All Passwords option */}
              <div
                className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
                onClick={() => setSelectedFolder(null)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  background: selectedFolder === null ? 'linear-gradient(135deg, #5884FD, #6c91ff)' : '#f8fafc',
                  color: selectedFolder === null ? '#ffffff' : '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <KeyIcon style={{ width: '16px', height: '16px' }} />
                <span style={{ flex: 1, fontWeight: '500' }}>All Passwords</span>
                <span style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.8,
                  background: selectedFolder === null ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {passwords.length}
                </span>
              </div>
              
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    background: selectedFolder === folder.id ? 'linear-gradient(135deg, #5884FD, #6c91ff)' : '#f8fafc',
                    color: selectedFolder === folder.id ? '#ffffff' : '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <FolderIcon style={{ width: '16px', height: '16px', color: folder.color }} />
                  <span style={{ flex: 1, fontWeight: '500' }}>{folder.name}</span>
                  {folder.is_shared && (
                    <ShareIcon style={{ width: '12px', height: '12px', opacity: 0.7 }} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolderForMembers(folder);
                      setShowMembersModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      color: selectedFolder === folder.id ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      transition: 'color 0.2s ease'
                    }}
                    title="Manage members"
                  >
                    <UserPlusIcon style={{ width: '12px', height: '12px' }} />
                  </button>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.8,
                    background: selectedFolder === folder.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {folder.password_count}
                  </span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Search bar */}
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <MagnifyingGlassIcon style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '20px', 
                  height: '20px', 
                  color: '#9ca3af' 
                }} />
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    border: '2px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
                {filteredPasswords.map(password => (
                  <div
                    key={password.id}
                    className="password-item"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      margin: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '600', 
                          margin: '0',
                          color: '#1a1a1a'
                        }}>
                          {password.account_name}
                        </h4>
                        {password.is_shared && (
                          <span style={{
                            fontSize: '0.75rem',
                            background: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#666'
                          }}>
                            Shared
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '0.25rem' }}>
                        {password.email || password.username}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#999999', marginBottom: '0.5rem' }}>
                        {password.folder_name}
                      </div>
                      
                      {/* Simple shared indicator */}
                      {password.is_shared && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: '#666',
                          marginTop: '0.25rem'
                        }}>
                          Shared with {password.shared_with?.length || 0} team member{(password.shared_with?.length || 0) > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => openViewModal(password)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}
                        title="View password details"
                      >
                        View
                      </button>
                      
                      <button
                        onClick={() => openEditModal(password)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}
                        title="Edit password"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => openShareModal(password)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}
                        title="Share with team"
                      >
                        Share
                      </button>
                      
                      <button
                        onClick={() => deletePassword(password.id)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #dc2626',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#dc2626',
                          fontSize: '0.875rem'
                        }}
                        title="Delete password"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredPasswords.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#666666'
                  }}>
                    <KeyIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '1.1rem', margin: '0' }}>
                      {searchTerm ? 'No passwords found matching your search' : 'No passwords in this folder'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600' }}>
                {isEditing ? 'Edit Password' : 'New Password'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={newPassword.account_name}
                    onChange={(e) => setNewPassword({...newPassword, account_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Gmail, GitHub, Bank Account"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPassword.email}
                      onChange={(e) => setNewPassword({...newPassword, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={newPassword.username}
                      onChange={(e) => setNewPassword({...newPassword, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Password {!isEditing && '*'}
                  </label>
                  <input
                    type="password"
                    value={newPassword.password_encrypted}
                    onChange={(e) => setNewPassword({...newPassword, password_encrypted: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={newPassword.website_url}
                      onChange={(e) => setNewPassword({...newPassword, website_url: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Folder
                    </label>
                    <select
                      value={newPassword.folder_id || ''}
                      onChange={(e) => setNewPassword({...newPassword, folder_id: e.target.value ? parseInt(e.target.value) : null})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Select folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Notes
                  </label>
                  <textarea
                    value={newPassword.notes}
                    onChange={(e) => setNewPassword({...newPassword, notes: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '100px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'transparent',
                    color: '#666666',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={isEditing ? updatePassword : createPassword}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600' }}>
                New Folder
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Work, Personal, Banking"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <textarea
                    value={newFolder.description}
                    onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Optional description..."
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['#5884FD', '#C483D9', '#F87239', '#FFB333', '#10b981', '#ef4444', '#8b5cf6'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewFolder({...newFolder, color})}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: color,
                          border: newFolder.color === color ? '3px solid #1a1a1a' : '1px solid #e2e8f0',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowFolderModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'transparent',
                    color: '#666666',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembersModal && selectedFolderForMembers && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600' }}>
                Manage Folder Members
              </h3>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  {selectedFolderForMembers.name}
                </h4>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#666666' }}>
                  Manage who can access this folder and their permissions
                </p>
              </div>

              {/* Current Members */}
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                  Current Members ({selectedFolderForMembers.members?.length || 0})
                </h5>
                
                {selectedFolderForMembers.members && selectedFolderForMembers.members.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedFolderForMembers.members.map((member, index) => (
                      <div key={member.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #5884FD, #6c91ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {(member.user_name || member.user_email)?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1a1a1a' }}>
                              {member.user_name || member.user_email?.split('@')[0] || 'Unknown User'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                              {member.user_email}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <select
                            value={member.permission_level}
                            onChange={(e) => updateMemberPermission(member.id, e.target.value as 'owner' | 'editor' | 'viewer')}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              background: '#ffffff'
                            }}
                            disabled={member.permission_level === 'owner'}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                          
                          {member.permission_level !== 'owner' && (
                            <button
                              onClick={() => removeMember(member.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                color: '#F87239',
                                borderRadius: '4px'
                              }}
                              title="Remove member"
                            >
                              <TrashIcon style={{ width: '14px', height: '14px' }} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666666',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <UserIcon style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem', margin: '0' }}>
                      No members added yet
                    </p>
                  </div>
                )}
              </div>

              {/* Add New Member */}
              <div>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                  Add New Member
                </h5>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div style={{ minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Permission
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                  
                  <button
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#5884FD',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      minWidth: '80px'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#1e40af' }}>
                  Permission Levels:
                </h6>
                <ul style={{ margin: '0', paddingLeft: '1rem', fontSize: '0.8rem', color: '#374151' }}>
                  <li><strong>Viewer:</strong> Can view passwords in this folder</li>
                  <li><strong>Editor:</strong> Can view, create, and edit passwords</li>
                  <li><strong>Owner:</strong> Full access including member management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Password Modal */}
      {showViewModal && passwordToView && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            margin: '2rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              {passwordToView.account_name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Username/Email
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9f9f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  {passwordToView.email || passwordToView.username || 'Not provided'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9f9f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}>
                  {decryptPassword(passwordToView.password_encrypted)}
                </div>
              </div>

              {passwordToView.website_url && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Website
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9f9f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    <a href={passwordToView.website_url.startsWith('http') ? passwordToView.website_url : `https://${passwordToView.website_url}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ color: '#0066cc', textDecoration: 'underline' }}>
                      {passwordToView.website_url}
                    </a>
                  </div>
                </div>
              )}

              {passwordToView.notes && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Notes
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9f9f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {passwordToView.notes}
                  </div>
                </div>
              )}

              {/* Shared with information */}
              {passwordToView.is_shared && passwordToView.shared_with && passwordToView.shared_with.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Shared with Team Members
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px'
                  }}>
                    {passwordToView.shared_with.map((share: any, index: number) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: index < passwordToView.shared_with!.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}>
                        <span style={{ fontWeight: '500' }}>{share.user_email}</span>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {share.can_edit && 'Edit '}
                          {share.can_delete && 'Delete '}
                          {share.can_share && 'Share'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Password Modal */}
      {showShareModal && passwordToShare && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            margin: '2rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              Share Password: {passwordToShare.account_name}
            </h3>

            {/* Show current shared members */}
            {passwordToShare.is_shared && passwordToShare.shared_with && passwordToShare.shared_with.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem' }}>
                  Currently Shared With:
                </label>
                <div style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px'
                }}>
                  {passwordToShare.shared_with.map((share: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < passwordToShare.shared_with!.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{share.user_email}</span>
                      <span style={{ 
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        border: '1px solid #dee2e6'
                      }}>
                        {share.can_edit ? 'Can Edit' : 
                         share.can_delete ? 'Can Delete' : 
                         share.can_share ? 'Can Share' : 'View Only'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem' }}>
                Add New Team Member:
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Start typing email address..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
              
              {/* Email suggestions dropdown */}
              {showEmailSuggestions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {emailSuggestions
                    .filter(email => email.toLowerCase().includes(shareEmail.toLowerCase()))
                    .map((email, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setShareEmail(email);
                          setShowEmailSuggestions(false);
                        }}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                      >
                        {email}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem' }}>
                Set Permissions:
              </label>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_view}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_view: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Can View - User can see this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_edit}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_edit: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Can Edit - User can modify this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_delete}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_delete: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Can Delete - User can delete this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_share}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_share: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Can Share - User can share this password with others</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={sharePassword}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  background: '#374151',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Share Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 