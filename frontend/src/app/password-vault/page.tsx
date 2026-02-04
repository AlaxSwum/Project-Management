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
  is_owner?: boolean;
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
    
    if (!user?.id || !user?.email) return;
    
    try {
      // Use the updated service method that filters by user
      const { data, error } = await supabaseDb.getPasswordEntries(user.id, user.email);
      
      if (error) throw error;
      
      // Enhance each password with shared member information
      const passwordsWithSharing = await Promise.all(
        (data || []).map(async (item: any) => {
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
            is_shared: sharedWith.length > 0,
            is_owner: item.created_by_id === user.id
          };
        })
      );
      
      console.log(`Loaded ${passwordsWithSharing.length} passwords for user ${user.email}`);
      setPasswords(passwordsWithSharing);
    } catch (error) {
      console.error('Error fetching passwords:', error);
      setError('Failed to load passwords');
    }
  };

  const fetchFolders = async () => {
    const { supabaseDb, supabase } = await import('@/lib/supabase');
    
    if (!user?.id) return;
    
    // Use the new service function
    const { data, error } = await supabaseDb.getPasswordFolders();
    
    if (error) throw error;
    
    // Count passwords per folder and try to get access data separately
    const foldersWithCounts = await Promise.all(
      (data || []).map(async (folder: any) => {
        // Count passwords user has access to in this folder
        const { data: folderPasswords } = await supabase
          .from('password_vault')
          .select('id')
          .eq('folder_id', folder.id)
          .eq('is_active', true)
          .or(`created_by_id.eq.${user.id}`);
        
        const accessiblePasswordCount = folderPasswords?.length || 0;
        
        // Try to get access data, but don't fail if table doesn't exist
        let members: FolderMember[] = [];
        let hasAccess = false;
        
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
          
          // Check if current user has access to this folder
          hasAccess = members.some(m => Number(m.user_id) === Number(user.id) && m.can_view);
        } catch (accessError) {
          console.warn('password_vault_folder_access table not found, using empty members array');
          members = [];
        }
        
        // User has access if:
        // 1. They created the folder, OR
        // 2. They have folder-level access, OR
        // 3. They have at least one accessible password in the folder
        const userHasAccess = 
          folder.created_by_id === user.id || 
          hasAccess || 
          accessiblePasswordCount > 0;
        
        return {
          ...folder,
          password_count: accessiblePasswordCount,
          members: members,
          userHasAccess: userHasAccess
        };
      })
    );
    
    // Filter to only show folders user has access to
    const accessibleFolders = foldersWithCounts.filter(folder => folder.userHasAccess);
    
    console.log(`Password Vault: Showing ${accessibleFolders.length} of ${foldersWithCounts.length} folders`);
    setFolders(accessibleFolders);
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
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#0D0D0D', 
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
          
          input::placeholder,
          textarea::placeholder {
            color: #71717A;
            opacity: 1;
          }
          
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #141414 inset !important;
            -webkit-text-fill-color: #FFFFFF !important;
          }
          
          select option {
            background: #141414;
            color: #FFFFFF;
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
            background: #1A1A1A;
            border-radius: 16px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          
          .password-item {
            transition: all 0.2s ease;
          }
          
          .password-item:hover {
            background: #2D2D2D !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .folder-item {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          
          .folder-item:hover {
            background: #2D2D2D !important;
            transform: translateY(-1px);
          }
          
          .folder-item.active {
            background: linear-gradient(135deg, #5884FD, #6c91ff) !important;
            color: #ffffff !important;
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#0D0D0D', 
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
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <KeyIcon style={{ width: '36px', height: '36px', color: '#5884FD' }} />
                Password Vault
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#A1A1AA', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
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
              background: '#1A1A1A', 
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
              background: '#1A1A1A',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)',
              height: 'fit-content',
              border: '1px solid #2D2D2D'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                margin: '0 0 1rem 0',
                color: '#FFFFFF'
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
                  background: selectedFolder === null ? 'linear-gradient(135deg, #5884FD, #6c91ff)' : '#141414',
                  color: selectedFolder === null ? '#ffffff' : '#E4E4E7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  border: selectedFolder === null ? 'none' : '1px solid #2D2D2D'
                }}
              >
                <KeyIcon style={{ width: '16px', height: '16px' }} />
                <span style={{ flex: 1, fontWeight: '500' }}>All Passwords</span>
                <span style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.8,
                  background: selectedFolder === null ? 'rgba(255,255,255,0.2)' : '#2D2D2D',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: selectedFolder === null ? '#ffffff' : '#A1A1AA'
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
                    background: selectedFolder === folder.id ? 'linear-gradient(135deg, #5884FD, #6c91ff)' : '#141414',
                    color: selectedFolder === folder.id ? '#ffffff' : '#E4E4E7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    border: selectedFolder === folder.id ? 'none' : '1px solid #2D2D2D'
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
                      color: selectedFolder === folder.id ? 'rgba(255,255,255,0.7)' : '#71717A',
                      transition: 'color 0.2s ease'
                    }}
                    title="Manage members"
                  >
                    <UserPlusIcon style={{ width: '12px', height: '12px' }} />
                  </button>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.8,
                    background: selectedFolder === folder.id ? 'rgba(255,255,255,0.2)' : '#2D2D2D',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: selectedFolder === folder.id ? '#ffffff' : '#A1A1AA'
                  }}>
                    {folder.password_count}
                  </span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{
              background: '#1A1A1A',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)',
              border: '1px solid #2D2D2D'
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
                  color: '#71717A' 
                }} />
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    border: '2px solid #3D3D3D',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#141414',
                    color: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                />
              </div>

              {/* Password list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
                {filteredPasswords.map(password => (
                  <div
                    key={password.id}
                    className="password-item"
                    style={{
                      background: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      margin: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '600', 
                          margin: '0',
                          color: '#FFFFFF'
                        }}>
                          {password.account_name}
                        </h4>
                        {password.is_shared && (
                          <span style={{
                            fontSize: '0.75rem',
                            background: '#2D2D2D',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#A1A1AA'
                          }}>
                            Shared
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#A1A1AA', marginBottom: '0.25rem' }}>
                        {password.email || password.username}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#71717A', marginBottom: '0.5rem' }}>
                        {password.folder_name}
                      </div>
                      
                      {/* Simple shared indicator */}
                      {password.is_shared && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: '#71717A',
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
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2D2D2D';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#141414';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        title="View password details"
                      >
                        View
                      </button>
                      
                      <button
                        onClick={() => openEditModal(password)}
                        style={{
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2D2D2D';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#141414';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        title="Edit password"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => openShareModal(password)}
                        style={{
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2D2D2D';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#141414';
                          e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        title="Share with team"
                      >
                        Share
                      </button>
                      
                      <button
                        onClick={() => deletePassword(password.id)}
                        style={{
                          background: '#141414',
                          border: '1px solid #dc2626',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#dc2626',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2D2D2D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#141414';
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
                    color: '#71717A'
                  }}>
                    <KeyIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5, color: '#71717A' }} />
                    <p style={{ fontSize: '1.1rem', margin: '0', color: '#A1A1AA' }}>
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
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
                {isEditing ? 'Edit Password' : 'New Password'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#E4E4E7' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={newPassword.account_name}
                    onChange={(e) => setNewPassword({...newPassword, account_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#141414',
                      color: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    placeholder="e.g., Gmail, GitHub, Bank Account"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPassword.email}
                      onChange={(e) => setNewPassword({...newPassword, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: '#141414',
                        color: '#FFFFFF'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={newPassword.username}
                      onChange={(e) => setNewPassword({...newPassword, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: '#141414',
                        color: '#FFFFFF'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                      placeholder="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Password {!isEditing && '*'}
                  </label>
                  <input
                    type="password"
                    value={newPassword.password_encrypted}
                    onChange={(e) => setNewPassword({...newPassword, password_encrypted: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#141414',
                      color: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={newPassword.website_url}
                      onChange={(e) => setNewPassword({...newPassword, website_url: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: '#141414',
                        color: '#FFFFFF'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Folder
                    </label>
                    <select
                      value={newPassword.folder_id || ''}
                      onChange={(e) => setNewPassword({...newPassword, folder_id: e.target.value ? parseInt(e.target.value) : null})}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: '#141414',
                        color: '#FFFFFF'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    >
                      <option value="" style={{ background: '#141414', color: '#FFFFFF' }}>Select folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id} style={{ background: '#141414', color: '#FFFFFF' }}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Notes
                  </label>
                  <textarea
                    value={newPassword.notes}
                    onChange={(e) => setNewPassword({...newPassword, notes: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '100px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      background: '#141414',
                      color: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
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
                    color: '#A1A1AA',
                    border: '1px solid #3D3D3D',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2D2D2D';
                    e.currentTarget.style.borderColor = '#3D3D3D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#3D3D3D';
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
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6c91ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#5884FD'}
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
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
                New Folder
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#E4E4E7' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#141414',
                      color: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    placeholder="e.g., Work, Personal, Banking"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Description
                  </label>
                  <textarea
                    value={newFolder.description}
                    onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      background: '#141414',
                      color: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    placeholder="Optional description..."
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
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
                          border: newFolder.color === color ? '3px solid #FFFFFF' : '1px solid #3D3D3D',
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
                    color: '#A1A1AA',
                    border: '1px solid #3D3D3D',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2D2D2D';
                    e.currentTarget.style.borderColor = '#3D3D3D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#3D3D3D';
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
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6c91ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#5884FD'}
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
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
                Manage Folder Members
              </h3>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#E4E4E7' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#FFFFFF' }}>
                  {selectedFolderForMembers.name}
                </h4>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#A1A1AA' }}>
                  Manage who can access this folder and their permissions
                </p>
              </div>

              {/* Current Members */}
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#E4E4E7' }}>
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
                        background: '#141414',
                        borderRadius: '8px',
                        border: '1px solid #2D2D2D'
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
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#FFFFFF' }}>
                              {member.user_name || member.user_email?.split('@')[0] || 'Unknown User'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>
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
                              border: '1px solid #3D3D3D',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              background: '#141414',
                              color: '#FFFFFF'
                            }}
                            disabled={member.permission_level === 'owner'}
                          >
                            <option value="viewer" style={{ background: '#141414', color: '#FFFFFF' }}>Viewer</option>
                            <option value="editor" style={{ background: '#141414', color: '#FFFFFF' }}>Editor</option>
                            <option value="owner" style={{ background: '#141414', color: '#FFFFFF' }}>Owner</option>
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
                    color: '#A1A1AA',
                    background: '#141414',
                    borderRadius: '8px',
                    border: '1px solid #2D2D2D'
                  }}>
                    <UserIcon style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5, color: '#71717A' }} />
                    <p style={{ fontSize: '0.9rem', margin: '0', color: '#A1A1AA' }}>
                      No members added yet
                    </p>
                  </div>
                )}
              </div>

              {/* Add New Member */}
              <div>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#E4E4E7' }}>
                  Add New Member
                </h5>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                        background: '#141414',
                        color: '#FFFFFF'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    />
                  </div>
                  
                  <div style={{ minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                      Permission
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        background: '#141414',
                        color: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
                    >
                      <option value="viewer" style={{ background: '#141414', color: '#FFFFFF' }}>Viewer</option>
                      <option value="editor" style={{ background: '#141414', color: '#FFFFFF' }}>Editor</option>
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
                      minWidth: '80px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#6c91ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#5884FD'}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#1A1A1A', borderRadius: '8px', border: '1px solid #2D2D2D' }}>
                <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#3B82F6' }}>
                  Permission Levels:
                </h6>
                <ul style={{ margin: '0', paddingLeft: '1rem', fontSize: '0.8rem', color: '#A1A1AA' }}>
                  <li><strong style={{ color: '#E4E4E7' }}>Viewer:</strong> Can view passwords in this folder</li>
                  <li><strong style={{ color: '#E4E4E7' }}>Editor:</strong> Can view, create, and edit passwords</li>
                  <li><strong style={{ color: '#E4E4E7' }}>Owner:</strong> Full access including member management</li>
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
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
              {passwordToView.account_name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                  Username/Email
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#FFFFFF'
                }}>
                  {passwordToView.email || passwordToView.username || 'Not provided'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                  Password
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  color: '#FFFFFF'
                }}>
                  {decryptPassword(passwordToView.password_encrypted)}
                </div>
              </div>

              {passwordToView.website_url && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Website
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#FFFFFF'
                  }}>
                    <a href={passwordToView.website_url.startsWith('http') ? passwordToView.website_url : `https://${passwordToView.website_url}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ color: '#3B82F6', textDecoration: 'underline' }}>
                      {passwordToView.website_url}
                    </a>
                  </div>
                </div>
              )}

              {passwordToView.notes && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Notes
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#FFFFFF'
                  }}>
                    {passwordToView.notes}
                  </div>
                </div>
              )}

              {/* Shared with information */}
              {passwordToView.is_shared && passwordToView.shared_with && passwordToView.shared_with.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#E4E4E7' }}>
                    Shared with Team Members
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '4px'
                  }}>
                    {passwordToView.shared_with.map((share: any, index: number) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: index < passwordToView.shared_with!.length - 1 ? '1px solid #2D2D2D' : 'none'
                      }}>
                        <span style={{ fontWeight: '500', color: '#FFFFFF' }}>{share.user_email}</span>
                        <div style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>
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
                  border: '1px solid #3D3D3D',
                  borderRadius: '4px',
                  background: '#141414',
                  color: '#E4E4E7',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2D2D2D';
                  e.currentTarget.style.borderColor = '#3D3D3D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#141414';
                  e.currentTarget.style.borderColor = '#3D3D3D';
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
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
              Share Password: {passwordToShare.account_name}
            </h3>

            {/* Show current shared members */}
            {passwordToShare.is_shared && passwordToShare.shared_with && passwordToShare.shared_with.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem', color: '#E4E4E7' }}>
                  Currently Shared With:
                </label>
                <div style={{
                  padding: '1rem',
                  background: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '4px'
                }}>
                  {passwordToShare.shared_with.map((share: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < passwordToShare.shared_with!.length - 1 ? '1px solid #2D2D2D' : 'none'
                    }}>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#FFFFFF' }}>{share.user_email}</span>
                      <span style={{ 
                        fontSize: '0.8rem',
                        color: '#A1A1AA',
                        background: '#1A1A1A',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        border: '1px solid #2D2D2D'
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
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem', color: '#E4E4E7' }}>
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
                  border: '1px solid #3D3D3D',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  background: '#141414',
                  color: '#FFFFFF'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#3D3D3D'}
              />
              
              {/* Email suggestions dropdown */}
              {showEmailSuggestions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  background: '#1A1A1A',
                  border: '1px solid #3D3D3D',
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
                          borderBottom: '1px solid #2D2D2D',
                          fontSize: '0.9rem',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}
                      >
                        {email}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem', color: '#E4E4E7' }}>
                Set Permissions:
              </label>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                padding: '1rem',
                background: '#141414',
                border: '1px solid #2D2D2D',
                borderRadius: '4px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_view}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_view: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#E4E4E7' }}>Can View - User can see this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_edit}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_edit: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#E4E4E7' }}>Can Edit - User can modify this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_delete}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_delete: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#E4E4E7' }}>Can Delete - User can delete this password</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sharePermissions.can_share}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, can_share: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#E4E4E7' }}>Can Share - User can share this password with others</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #3D3D3D',
                  borderRadius: '4px',
                  background: '#141414',
                  color: '#E4E4E7',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2D2D2D';
                  e.currentTarget.style.borderColor = '#3D3D3D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#141414';
                  e.currentTarget.style.borderColor = '#3D3D3D';
                }}
              >
                Cancel
              </button>
              <button
                onClick={sharePassword}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #3D3D3D',
                  borderRadius: '4px',
                  background: '#1A1A1A',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2D2D2D';
                  e.currentTarget.style.borderColor = '#3D3D3D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1A1A1A';
                  e.currentTarget.style.borderColor = '#3D3D3D';
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