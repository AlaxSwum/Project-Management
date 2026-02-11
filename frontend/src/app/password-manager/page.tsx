'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { 
  PlusIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  StarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface PasswordEntry {
  id: number;
  account_name: string;
  email: string;
  username: string;
  password_encrypted: string;
  phone_number?: string;
  website_url?: string;
  notes?: string;
  folder_name: string;
  category: string;
  tags: string[];
  two_factor_auth: boolean;
  security_questions?: any;
  password_strength: 'weak' | 'fair' | 'good' | 'strong' | 'unknown';
  password_created_date?: string;
  password_last_changed: string;
  is_compromised: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  last_accessed?: string;
  permission_level?: 'owner' | 'editor' | 'viewer';
  can_view?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_share?: boolean;
  password_needs_update?: boolean;
}

interface PasswordFolder {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_by_id: number;
  is_shared: boolean;
  created_at: string;
}

interface AccessControl {
  user_id: number;
  permission_level: 'owner' | 'editor' | 'viewer';
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  user_name?: string;
  user_email?: string;
}

export default function PasswordManagerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [folders, setFolders] = useState<PasswordFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [accessControls, setAccessControls] = useState<{ [key: number]: AccessControl[] }>({});
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermissions, setSharePermissions] = useState({
    can_edit: false,
    can_delete: false,
    can_share: false
  });

  const [newPassword, setNewPassword] = useState({
    account_name: '',
    email: '',
    username: '',
    password_encrypted: '',
    phone_number: '',
    website_url: '',
    notes: '',
    folder_name: 'Personal',
    category: 'login',
    tags: [] as string[],
    two_factor_auth: false,
    password_strength: 'unknown' as 'weak' | 'fair' | 'good' | 'strong' | 'unknown'
  });

  const categories = [
    { value: 'all', label: 'All Items', icon: '🔐' },
    { value: 'login', label: 'Logins', icon: '🔑' },
    { value: 'card', label: 'Cards', icon: '💳' },
    { value: 'identity', label: 'Identity', icon: '👤' },
    { value: 'note', label: 'Secure Notes', icon: '📝' }
  ];

  const strengthColors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    good: '#10b981',
    strong: '#059669',
    unknown: '#6b7280'
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPasswords();
      fetchFolders();
    }
  }, [isAuthenticated]);

  const fetchPasswords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { supabaseDb } = await import('@/lib/supabase');
      
      // Fetch passwords using the new service function
      const { data, error } = await supabaseDb.getPasswordEntries();

      if (error) throw error;
      
      setPasswords(data || []);
      
      // Log access for each password
      if (data && data.length > 0) {
        const { supabase } = await import('@/lib/supabase');
        for (const password of data) {
          await supabase
            .from('password_audit_log')
            .insert([{
              vault_id: password.id,
              user_id: user?.id,
              action: 'view',
              details: { account_name: password.account_name }
            }]);
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching passwords:', err);
      setError('Failed to load passwords: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const { supabaseDb } = await import('@/lib/supabase');
      
      // Fetch folders using the new service function
      const { data, error } = await supabaseDb.getPasswordFolders();

      if (error) throw error;
      setFolders(data || []);
      
    } catch (err: any) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchAccessControls = async (passwordId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('password_vault_access')
        .select(`
          *,
          user:auth_user(name, email)
        `)
        .eq('vault_id', passwordId);

      if (error) throw error;
      
      const controls = data?.map(item => ({
        user_id: item.user_id,
        permission_level: item.permission_level,
        can_view: item.can_view,
        can_edit: item.can_edit,
        can_delete: item.can_delete,
        can_share: item.can_share,
        user_name: item.user?.name,
        user_email: item.user?.email
      })) || [];
      
      setAccessControls(prev => ({ ...prev, [passwordId]: controls }));
      
    } catch (err: any) {
      console.error('Error fetching access controls:', err);
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setNewPassword({ ...newPassword, password_encrypted: password, password_strength: 'strong' });
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 3) return 'fair';
    if (score <= 4) return 'good';
    return 'strong';
  };

  const handleSharePassword = (password: PasswordEntry) => {
    setSelectedPassword(password);
    setShareEmail('');
    setSharePermissions({
      can_edit: false,
      can_delete: false,
      can_share: false
    });
    setShowShareModal(true);
    // Fetch current access controls for this password
    fetchAccessControls(password.id);
  };

  const sharePassword = async () => {
    if (!selectedPassword || !shareEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Call the share function
      const { data, error } = await supabase.rpc('share_password_with_user', {
        password_id: selectedPassword.id,
        target_user_email: shareEmail.trim(),
        permission_level: sharePermissions.can_edit ? 'editor' : 'viewer',
        can_edit: sharePermissions.can_edit,
        can_delete: sharePermissions.can_delete,
        can_share: sharePermissions.can_share
      });

      if (error) throw error;

      if (data && !data.success) {
        setError(data.message || 'Failed to share password');
        return;
      }

      // Refresh access controls
      await fetchAccessControls(selectedPassword.id);
      
      // Reset form and close modal
      setShareEmail('');
      setSharePermissions({
        can_edit: false,
        can_delete: false,
        can_share: false
      });
      setShowShareModal(false);
      setError('');
      
      // Show success message (you can replace with a toast notification)
      alert('Password shared successfully!');

    } catch (err: any) {
      console.error('Error sharing password:', err);
      setError('Failed to share password: ' + err.message);
    }
  };

  const revokeAccess = async (passwordId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${userEmail}?`)) {
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase.rpc('revoke_password_access', {
        password_id: passwordId,
        target_user_email: userEmail
      });

      if (error) throw error;

      if (data && !data.success) {
        setError(data.message || 'Failed to revoke access');
        return;
      }

      // Refresh access controls
      await fetchAccessControls(passwordId);
      
      setError('');
      alert('Access revoked successfully!');

    } catch (err: any) {
      console.error('Error revoking access:', err);
      setError('Failed to revoke access: ' + err.message);
    }
  };

  const createPassword = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('password_vault')
        .insert([{
          ...newPassword,
          created_by_id: user?.id,
          password_strength: calculatePasswordStrength(newPassword.password_encrypted),
          password_created_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchPasswords();
      setShowCreateModal(false);
      setNewPassword({
        account_name: '',
        email: '',
        username: '',
        password_encrypted: '',
        phone_number: '',
        website_url: '',
        notes: '',
        folder_name: 'Personal',
        category: 'login',
        tags: [],
        two_factor_auth: false,
        password_strength: 'unknown'
      });
      
    } catch (err: any) {
      console.error('Error creating password:', err);
      setError('Failed to create password: ' + err.message);
    }
  };

  const updatePassword = async () => {
    if (!selectedPassword) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('password_vault')
        .update({
          ...selectedPassword,
          password_strength: calculatePasswordStrength(selectedPassword.password_encrypted)
        })
        .eq('id', selectedPassword.id);

      if (error) throw error;
      
      await fetchPasswords();
      setShowEditModal(false);
      setSelectedPassword(null);
      
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError('Failed to update password: ' + err.message);
    }
  };

  const deletePassword = async (id: number) => {
    if (!confirm('Are you sure you want to delete this password? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('password_vault')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchPasswords();
      
    } catch (err: any) {
      console.error('Error deleting password:', err);
      setError('Failed to delete password: ' + err.message);
    }
  };

  const toggleFavorite = async (id: number, isFavorite: boolean) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('password_vault')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);

      if (error) throw error;
      
      await fetchPasswords();
      
    } catch (err: any) {
      console.error('Error updating favorite:', err);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.website_url?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFolder = selectedFolder === 'All' || password.folder_name === selectedFolder;
    const matchesCategory = selectedCategory === 'all' || password.category === selectedCategory;
    
    return matchesSearch && matchesFolder && matchesCategory;
  });

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div className="page-main" style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div className="page-main" style={{ 
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
                letterSpacing: '-0.02em'
              }}>
                Password Manager
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Securely store and manage your passwords with team collaboration
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
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
              Add Password
            </button>
          </div>

          {error && (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #F87239', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#F87239',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)'
            }}>
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
                <MagnifyingGlassIcon style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '20px', 
                  height: '20px', 
                  color: '#666666' 
                }} />
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Folder Filter */}
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  minWidth: '150px'
                }}
              >
                <option value="All">All Folders</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.name}>
                    {folder.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  minWidth: '150px'
                }}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            {filteredPasswords.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#666666' 
              }}>
                {passwords.length === 0 ? (
                  <>
                    <ShieldCheckIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#C483D9' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>No passwords yet</h3>
                    <p style={{ margin: 0 }}>Add your first password to get started with secure password management.</p>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#C483D9' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>No passwords found</h3>
                    <p style={{ margin: 0 }}>Try adjusting your search or filter criteria.</p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ padding: '0' }}>
                {filteredPasswords.map((password) => (
                  <div key={password.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    {/* Account Icon & Info */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${password.folder_name === 'Personal' ? '#5884FD' : '#C483D9'}, ${password.folder_name === 'Personal' ? '#4F7BF7' : '#B574D3'})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '1rem'
                      }}>
                        {password.account_name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1a1a1a' }}>
                            {password.account_name}
                          </h3>
                          {password.is_favorite && (
                            <StarIcon style={{ width: '16px', height: '16px', color: '#FFB333', fill: '#FFB333' }} />
                          )}
                          {password.two_factor_auth && (
                            <ShieldCheckIcon style={{ width: '16px', height: '16px', color: '#10b981' }} />
                          )}
                          {password.is_compromised && (
                            <ExclamationTriangleIcon style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#666666' }}>
                          <span>{password.username || password.email}</span>
                          {password.website_url && (
                            <span>• {new URL(password.website_url).hostname}</span>
                          )}
                          <span>• {password.folder_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: strengthColors[password.password_strength]
                      }}></div>
                      <span style={{ fontSize: '0.8rem', color: '#666666', textTransform: 'capitalize' }}>
                        {password.password_strength}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => copyToClipboard(password.username || password.email || '', 'username')}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#666666',
                          transition: 'all 0.2s ease'
                        }}
                        title="Copy username"
                      >
                        <DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />
                      </button>

                      <button
                        onClick={() => {
                          setShowPassword(prev => ({ ...prev, [password.id]: !prev[password.id] }));
                          if (!showPassword[password.id]) {
                            // Log password view
                            copyToClipboard(password.password_encrypted, 'password');
                          }
                        }}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#666666',
                          transition: 'all 0.2s ease'
                        }}
                        title="Copy password"
                      >
                        {showPassword[password.id] ? (
                          <EyeSlashIcon style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        )}
                      </button>

                      <button
                        onClick={() => toggleFavorite(password.id, password.is_favorite)}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: password.is_favorite ? '#FFB333' : '#666666',
                          transition: 'all 0.2s ease'
                        }}
                        title="Toggle favorite"
                      >
                        <StarIcon style={{ 
                          width: '16px', 
                          height: '16px',
                          fill: password.is_favorite ? '#FFB333' : 'none'
                        }} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPassword(password);
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#666666',
                          transition: 'all 0.2s ease'
                        }}
                        title="Edit"
                      >
                        <PencilIcon style={{ width: '16px', height: '16px' }} />
                      </button>

                      <button
                        onClick={() => handleSharePassword(password)}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#666666',
                          transition: 'all 0.2s ease'
                        }}
                        title="Share"
                      >
                        <ShareIcon style={{ width: '16px', height: '16px' }} />
                      </button>

                      <button
                        onClick={() => deletePassword(password.id)}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#ef4444',
                          transition: 'all 0.2s ease'
                        }}
                        title="Delete"
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Password Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '5vh',
          zIndex: 1000
        }}>
          <div style={{
            background: '#F5F5ED',
            borderRadius: '20px',
            padding: '2.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '300', margin: 0, color: '#1a1a1a' }}>
                Add New Password
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#666666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={newPassword.account_name}
                    onChange={(e) => setNewPassword({ ...newPassword, account_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                    placeholder="e.g., Gmail, Facebook"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Folder
                  </label>
                  <select
                    value={newPassword.folder_name}
                    onChange={(e) => setNewPassword({ ...newPassword, folder_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.name}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={newPassword.username}
                    onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                    placeholder="Username"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={newPassword.email}
                    onChange={(e) => setNewPassword({ ...newPassword, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Password *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    value={newPassword.password_encrypted}
                    onChange={(e) => setNewPassword({ 
                      ...newPassword, 
                      password_encrypted: e.target.value,
                      password_strength: calculatePasswordStrength(e.target.value)
                    })}
                    style={{
                      flex: 1,
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    style={{
                      padding: '0.875rem 1rem',
                      background: '#5884FD',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Generate
                  </button>
                </div>
                {newPassword.password_encrypted && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: strengthColors[newPassword.password_strength]
                    }}></div>
                    <span style={{ textTransform: 'capitalize' }}>
                      {newPassword.password_strength} password
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPassword.phone_number}
                    onChange={(e) => setNewPassword({ ...newPassword, phone_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Category
                  </label>
                  <select
                    value={newPassword.category}
                    onChange={(e) => setNewPassword({ ...newPassword, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {categories.slice(1).map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Website URL
                </label>
                <input
                  type="url"
                  value={newPassword.website_url}
                  onChange={(e) => setNewPassword({ ...newPassword, website_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Notes
                </label>
                <textarea
                  value={newPassword.notes}
                  onChange={(e) => setNewPassword({ ...newPassword, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                  placeholder="Additional notes or security questions"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={newPassword.two_factor_auth}
                  onChange={(e) => setNewPassword({ ...newPassword, two_factor_auth: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label style={{ fontWeight: '500', color: '#1a1a1a' }}>
                  Two-Factor Authentication Enabled
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createPassword}
                  disabled={!newPassword.account_name || !newPassword.password_encrypted}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: newPassword.account_name && newPassword.password_encrypted ? '#5884FD' : '#cccccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: newPassword.account_name && newPassword.password_encrypted ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Password Modal */}
      {showShareModal && selectedPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>
                  Share Password
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666666', fontSize: '0.9rem' }}>
                  {selectedPassword.account_name}
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666666',
                  padding: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              {/* Share New User Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
                  Share with Team Member
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                    Permissions
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={sharePermissions.can_edit}
                        onChange={(e) => setSharePermissions({ ...sharePermissions, can_edit: e.target.checked })}
                        style={{ margin: 0 }}
                      />
                      Can edit password details
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={sharePermissions.can_delete}
                        onChange={(e) => setSharePermissions({ ...sharePermissions, can_delete: e.target.checked })}
                        style={{ margin: 0 }}
                      />
                      Can delete this password
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={sharePermissions.can_share}
                        onChange={(e) => setSharePermissions({ ...sharePermissions, can_share: e.target.checked })}
                        style={{ margin: 0 }}
                      />
                      Can share with others
                    </label>
                  </div>
                </div>

                <button
                  onClick={sharePassword}
                  disabled={!shareEmail.trim()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: shareEmail.trim() ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: shareEmail.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Share Password
                </button>
              </div>

              {/* Current Access List */}
              {accessControls[selectedPassword.id] && accessControls[selectedPassword.id].length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
                    Current Access ({accessControls[selectedPassword.id].length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {accessControls[selectedPassword.id].map((access, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#1a1a1a', fontSize: '0.9rem' }}>
                            {access.user_name || access.user_email}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {access.user_email}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666666', marginTop: '0.25rem' }}>
                            Permissions: {access.permission_level}
                            {access.can_edit && ', Can Edit'}
                            {access.can_delete && ', Can Delete'}
                            {access.can_share && ', Can Share'}
                          </div>
                        </div>
                        <button
                          onClick={() => revokeAccess(selectedPassword.id, access.user_email || '')}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Revoke Access"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 