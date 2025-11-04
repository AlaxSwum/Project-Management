'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailEntry {
  id: string;
  folder_id: string;
  entry_date: string;
  from_sender: string;
  subject: string;
  remark: string;
  to_do: string;
  final_remark: string;
  folder_placed: string;
  response: string;
  email_account_id: string;
  confirmed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface EmailAccount {
  id: string;
  account_name: string;
  full_email: string;
  description: string;
  is_active: boolean;
}

interface Folder {
  id: string;
  folder_name: string;
  folder_type: 'YEAR' | 'MONTH' | 'WEEK';
  parent_folder_id: string | null;
  year: number;
  month: number | null;
  week_number: number | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  is_archived: boolean;
}

interface FolderMember {
  id: string;
  folder_id: string;
  user_id: string;
  access_level: 'VIEWER' | 'EDITOR' | 'ADMIN';
  user_email?: string;
}

export default function EmailTrackingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [folderMembers, setFolderMembers] = useState<FolderMember[]>([]);
  
  // UI States
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EmailEntry | null>(null);
  
  // Form Data
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    folder_type: 'YEAR' as 'YEAR' | 'MONTH' | 'WEEK'
  });
  
  const [entryFormData, setEntryFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    from_sender: '',
    subject: '',
    remark: '',
    to_do: '',
    final_remark: '',
    folder_placed: '',
    response: '',
    email_account_id: '',
    confirmed: false
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { data, error } = await supabaseDb
        .from('email_tracking_folders')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: true })
        .order('week_number', { ascending: true });
      
      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Fetch entries for folder
  const fetchEntries = async (folderId: string) => {
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { data, error } = await supabaseDb
        .from('email_tracking_entries')
        .select('*')
        .eq('folder_id', folderId)
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  // Fetch email accounts
  const fetchEmailAccounts = async () => {
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { data, error } = await supabaseDb
        .from('email_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name', { ascending: true });
      
      if (error) throw error;
      setEmailAccounts(data || []);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
    }
  };

  // Fetch folder members
  const fetchFolderMembers = async (folderId: string) => {
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { data, error } = await supabaseDb
        .from('email_tracking_folder_access')
        .select('*')
        .eq('folder_id', folderId);
      
      if (error) throw error;
      setFolderMembers(data || []);
    } catch (error) {
      console.error('Error fetching folder members:', error);
    }
  };

  // Initialize
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchFolders();
      fetchEmailAccounts();
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  // Get current folder contents (subfolders)
  const getCurrentFolderContents = () => {
    if (!currentFolder) {
      // Root level - show year folders
      return folders.filter(f => f.folder_type === 'YEAR');
    } else if (currentFolder.folder_type === 'YEAR') {
      // Show month folders
      return folders.filter(f => 
        f.folder_type === 'MONTH' && 
        f.parent_folder_id === currentFolder.id
      );
    } else if (currentFolder.folder_type === 'MONTH') {
      // Show week folders
      return folders.filter(f => 
        f.folder_type === 'WEEK' && 
        f.parent_folder_id === currentFolder.id
      );
    }
    return [];
  };

  // Enter folder
  const enterFolder = (folder: Folder) => {
    setCurrentFolder(folder);
    const newPath = [...folderPath, folder];
    setFolderPath(newPath);
    fetchEntries(folder.id);
    fetchFolderMembers(folder.id);
  };

  // Go back
  const goBack = () => {
    if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      const newCurrent = newPath[newPath.length - 1] || null;
      setCurrentFolder(newCurrent);
      if (newCurrent) {
        fetchEntries(newCurrent.id);
      } else {
        setEntries([]);
      }
    }
  };

  // Create folder
  const createFolder = async () => {
    if (!user || !folderFormData.name) return;
    
    try {
      // Use the supabase instance from lib to get proper session
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      
      const folderData: any = {
        folder_name: folderFormData.name,
        folder_type: folderFormData.folder_type,
        parent_folder_id: currentFolder?.id || null,
        created_by: user.id, // Use user.id from auth context (this is the UUID)
        year: new Date().getFullYear(),
        is_archived: false
      };
      
      // Set month if parent is a year folder
      if (currentFolder?.folder_type === 'YEAR') {
        folderData.month = new Date().getMonth() + 1;
      }
      
      // Set week if parent is a month folder
      if (currentFolder?.folder_type === 'MONTH') {
        folderData.week_number = Math.ceil(new Date().getDate() / 7);
      }
      
      const { error } = await supabaseDb
        .from('email_tracking_folders')
        .insert([folderData]);
      
      if (error) throw error;
      
      setShowFolderForm(false);
      setFolderFormData({ name: '', description: '', folder_type: 'YEAR' });
      await fetchFolders();
      alert('Folder created successfully!');
    } catch (error: any) {
      console.error('Error creating folder:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add entry
  const addEntry = async () => {
    if (!user || !currentFolder) return;
    
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      
      const { error } = await supabaseDb
        .from('email_tracking_entries')
        .insert([{
          ...entryFormData,
          folder_id: currentFolder.id,
          created_by: user.id // Use user.id from auth context
        }]);
      
      if (error) throw error;
      
      setEntryFormData({
        entry_date: new Date().toISOString().split('T')[0],
        from_sender: '',
        subject: '',
        remark: '',
        to_do: '',
        final_remark: '',
        folder_placed: '',
        response: '',
        email_account_id: '',
        confirmed: false
      });
      setShowEntryForm(false);
      await fetchEntries(currentFolder.id);
      alert('Entry added successfully!');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      alert('Error: ' + error.message);
    }
  };

  // Update entry
  const updateEntry = async (entry: EmailEntry, field: string, value: any) => {
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { error } = await supabaseDb
        .from('email_tracking_entries')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', entry.id);
      
      if (error) throw error;
      await fetchEntries(currentFolder!.id);
    } catch (error: any) {
      console.error('Error updating entry:', error);
      alert('Error: ' + error.message);
    }
  };

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      const { error } = await supabaseDb
        .from('email_tracking_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      await fetchEntries(currentFolder!.id);
      alert('Entry deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add folder member
  const addFolderMember = async (userId: string, accessLevel: string) => {
    if (!currentFolder || !user) return;
    
    try {
      const { supabase: supabaseDb } = await import('@/lib/supabase');
      
      const { error } = await supabaseDb
        .from('email_tracking_folder_access')
        .insert([{
          folder_id: currentFolder.id,
          user_id: userId,
          access_level: accessLevel,
          granted_by: user.id // Use user.id from auth context
        }]);
      
      if (error) throw error;
      await fetchFolderMembers(currentFolder.id);
      alert('Access granted successfully!');
    } catch (error: any) {
      console.error('Error granting access:', error);
      alert('Error: ' + error.message);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#f8fafc', 
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

  return (
    <>
      {isMobile && <MobileHeader title="Email Tracking" isMobile={isMobile} />}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div className="email-tracking-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        
        <div className="email-tracking-main" style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '80px' : '2rem',
          background: 'transparent', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div className="email-tracking-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '0',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '1.75rem' : '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Email Tracking System
              </h1>
              <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Rother Care Pharmacy - Communication Management
              </p>
            </div>
            
            <div className="email-tracking-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setFolderFormData({
                    name: '',
                    description: '',
                    folder_type: currentFolder?.folder_type === 'YEAR' ? 'MONTH' : currentFolder?.folder_type === 'MONTH' ? 'WEEK' : 'YEAR'
                  });
                  setShowFolderForm(true);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                Create Folder
              </button>
              
              {currentFolder && (
                <>
                  <button
                    onClick={() => setShowEntryForm(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#5884FD',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add New Entry
                  </button>
                  
                  <button
                    onClick={() => {
                      fetchFolderMembers(currentFolder.id);
                      setShowMembersModal(true);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#ffffff',
                      color: '#666666',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                    Members
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {folderPath.length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: '#666666'
            }}>
              <button
                onClick={() => {
                  setCurrentFolder(null);
                  setFolderPath([]);
                  setEntries([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5884FD',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Home
              </button>
              {folderPath.map((folder, index) => (
                <div key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChevronRightIcon style={{ width: '12px', height: '12px', color: '#999999' }} />
                  <button
                    onClick={() => {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setCurrentFolder(folder);
                      fetchEntries(folder.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: index === folderPath.length - 1 ? '#1a1a1a' : '#5884FD',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: index === folderPath.length - 1 ? '500' : '400'
                    }}
                  >
                    {folder.folder_name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Folders View */}
          {!currentFolder || (currentFolder && getCurrentFolderContents().length > 0) ? (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '500', 
                color: '#1a1a1a', 
                marginBottom: '1rem' 
              }}>
                {currentFolder ? 'Subfolders' : 'Year Folders'}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {getCurrentFolderContents().map(folder => (
                  <div
                    key={folder.id}
                    style={{
                      padding: '1.5rem',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div 
                      onClick={() => enterFolder(folder)}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flex: 1
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FolderIcon style={{ width: '20px', height: '20px', color: '#999999' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a1a1a', fontSize: '1rem' }}>
                          {folder.folder_name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.25rem' }}>
                          {folder.folder_type}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentFolder(folder);
                          fetchFolderMembers(folder.id);
                          setShowMembersModal(true);
                        }}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666666'
                        }}
                        title="Manage Members"
                      >
                        <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Entries Table - Excel-like Sheet */}
          {currentFolder && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '500', 
                color: '#1a1a1a', 
                marginBottom: '1rem' 
              }}>
                Email Tracking Entries
              </h2>
              
              <div style={{ 
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remark</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Do</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Remark</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Folder Placed</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Account</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmed</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: '#999999' }}>
                            No entries yet. Click "Add New Entry" to get started.
                          </td>
                        </tr>
                      ) : (
                        entries.map(entry => (
                          <tr 
                            key={entry.id} 
                            style={{ 
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.15s ease',
                              background: '#ffffff'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', fontWeight: '500', whiteSpace: 'nowrap' }}>
                              {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>{entry.from_sender}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{entry.subject}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{entry.remark || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{entry.to_do || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{entry.final_remark || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{entry.folder_placed || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{entry.response || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: '#eff6ff',
                                color: '#1e40af',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {emailAccounts.find(a => a.id === entry.email_account_id)?.account_name || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={entry.confirmed}
                                onChange={(e) => updateEntry(entry, 'confirmed', e.target.checked)}
                                style={{ 
                                  width: '18px', 
                                  height: '18px', 
                                  cursor: 'pointer',
                                  accentColor: '#10b981'
                                }}
                              />
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                style={{
                                  padding: '0.5rem',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  borderRadius: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fef2f2';
                                  e.currentTarget.style.color = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                title="Delete entry"
                              >
                                <TrashIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showFolderForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', marginBottom: '1.5rem', color: '#1a1a1a' }}>
              Create New Folder
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                Folder Name *
              </label>
              <input
                type="text"
                value={folderFormData.name}
                onChange={(e) => setFolderFormData({...folderFormData, name: e.target.value})}
                placeholder="e.g., 2025, January 2025, Finance Emails"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                Description (Optional)
              </label>
              <textarea
                value={folderFormData.description}
                onChange={(e) => setFolderFormData({...folderFormData, description: e.target.value})}
                placeholder="Brief description of this folder"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                Folder Type
              </label>
              <select
                value={folderFormData.folder_type}
                onChange={(e) => setFolderFormData({...folderFormData, folder_type: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="YEAR">Year Folder</option>
                <option value="MONTH">Month Folder</option>
                <option value="WEEK">Week Folder</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowFolderForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!folderFormData.name}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: !folderFormData.name ? 0.5 : 1
                }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showEntryForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', marginBottom: '1.5rem', color: '#1a1a1a' }}>
              Add New Entry
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={entryFormData.entry_date}
                  onChange={(e) => setEntryFormData({...entryFormData, entry_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  From (Sender) *
                </label>
                <input
                  type="text"
                  value={entryFormData.from_sender}
                  onChange={(e) => setEntryFormData({...entryFormData, from_sender: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={entryFormData.subject}
                  onChange={(e) => setEntryFormData({...entryFormData, subject: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Remark
                </label>
                <textarea
                  value={entryFormData.remark}
                  onChange={(e) => setEntryFormData({...entryFormData, remark: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  To Do
                </label>
                <textarea
                  value={entryFormData.to_do}
                  onChange={(e) => setEntryFormData({...entryFormData, to_do: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Final Remark
                </label>
                <textarea
                  value={entryFormData.final_remark}
                  onChange={(e) => setEntryFormData({...entryFormData, final_remark: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Folder Placed
                </label>
                <input
                  type="text"
                  value={entryFormData.folder_placed}
                  onChange={(e) => setEntryFormData({...entryFormData, folder_placed: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Response
                </label>
                <textarea
                  value={entryFormData.response}
                  onChange={(e) => setEntryFormData({...entryFormData, response: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666666' }}>
                  Email Account
                </label>
                <select
                  value={entryFormData.email_account_id}
                  onChange={(e) => setEntryFormData({...entryFormData, email_account_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">-- Select Email Account --</option>
                  {emailAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} ({account.full_email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={entryFormData.confirmed}
                  onChange={(e) => setEntryFormData({...entryFormData, confirmed: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{ fontSize: '0.9rem', color: '#666666' }}>
                  Mark as Confirmed
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowEntryForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                disabled={!entryFormData.from_sender || !entryFormData.subject}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (!entryFormData.from_sender || !entryFormData.subject) ? 0.5 : 1
                }}
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && currentFolder && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1a1a1a' }}>
              Folder Members
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '1.5rem' }}>
              {currentFolder.folder_name}
            </p>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#1a1a1a' }}>
                Current Members
              </h3>
              {folderMembers.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#999999' }}>No members yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {folderMembers.map(member => (
                    <div key={member.id} style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>
                          User ID: {member.user_id.substring(0, 8)}...
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                          {member.access_level}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Remove this member?')) {
                            await supabase
                              .from('email_tracking_folder_access')
                              .delete()
                              .eq('id', member.id);
                            fetchFolderMembers(currentFolder.id);
                          }
                        }}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#1a1a1a' }}>
                Add Member
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  id="memberUserId"
                  type="text"
                  placeholder="User ID (UUID)"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
                <select
                  id="memberAccessLevel"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={() => {
                    const userId = (document.getElementById('memberUserId') as HTMLInputElement).value;
                    const accessLevel = (document.getElementById('memberAccessLevel') as HTMLSelectElement).value;
                    if (userId) {
                      addFolderMember(userId, accessLevel);
                      (document.getElementById('memberUserId') as HTMLInputElement).value = '';
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

