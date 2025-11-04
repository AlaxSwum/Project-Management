'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface FolderAccess {
  id: string;
  folder_id: string;
  user_id: string;
  access_level: 'VIEWER' | 'EDITOR' | 'ADMIN';
}

export default function EmailTrackingPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // State for folders
  const [yearFolders, setYearFolders] = useState<Folder[]>([]);
  const [selectedYear, setSelectedYear] = useState<Folder | null>(null);
  const [monthFolders, setMonthFolders] = useState<Folder[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Folder | null>(null);
  const [weekFolders, setWeekFolders] = useState<Folder[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Folder | null>(null);
  
  // State for entries
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EmailEntry[]>([]);
  
  // State for email accounts
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  
  // State for filters
  const [dateFilter, setDateFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [emailAccountFilter, setEmailAccountFilter] = useState('');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for UI
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EmailEntry | null>(null);
  
  // Form state for new entry
  const [newEntry, setNewEntry] = useState({
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
  
  // Form state for new email account
  const [newAccount, setNewAccount] = useState({
    account_name: '',
    full_email: '',
    description: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch year folders
  const fetchYearFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('email_tracking_folders')
        .select('*')
        .eq('folder_type', 'YEAR')
        .order('year', { ascending: false });
      
      if (error) throw error;
      setYearFolders(data || []);
    } catch (error) {
      console.error('Error fetching year folders:', error);
    }
  };

  // Fetch email accounts
  const fetchEmailAccounts = async () => {
    try {
      const { data, error } = await supabase
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

  // Fetch entries for selected folder
  const fetchEntries = async (folderId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_tracking_entries')
        .select('*')
        .eq('folder_id', folderId)
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchYearFolders();
      await fetchEmailAccounts();
      setLoading(false);
    };
    initData();
  }, []);

  // Filter entries based on filters
  useEffect(() => {
    let filtered = [...entries];
    
    if (dateFilter) {
      filtered = filtered.filter(entry => entry.entry_date === dateFilter);
    }
    
    if (startDate && endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      });
    }
    
    if (fromFilter) {
      filtered = filtered.filter(entry => 
        entry.from_sender.toLowerCase().includes(fromFilter.toLowerCase())
      );
    }
    
    if (subjectFilter) {
      filtered = filtered.filter(entry => 
        entry.subject.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }
    
    if (emailAccountFilter && emailAccountFilter !== 'all') {
      filtered = filtered.filter(entry => entry.email_account_id === emailAccountFilter);
    }
    
    if (confirmedFilter !== 'all') {
      const isConfirmed = confirmedFilter === 'true';
      filtered = filtered.filter(entry => entry.confirmed === isConfirmed);
    }
    
    setFilteredEntries(filtered);
  }, [entries, dateFilter, fromFilter, subjectFilter, emailAccountFilter, confirmedFilter, startDate, endDate]);

  // Get active folder ID
  const getActiveFolderId = (): string | null => {
    if (selectedWeek) return selectedWeek.id;
    if (selectedMonth) return selectedMonth.id;
    if (selectedYear) return selectedYear.id;
    return null;
  };

  // Create new year folder
  const createYearFolder = async (year: number) => {
    if (!user) return;
    
    try {
      setSaving(true);
      const { data, error } = await supabase.rpc('create_year_folder', {
        year_val: year,
        creator_id: user.id
      });
      
      if (error) throw error;
      await fetchYearFolders();
      alert(`Year ${year} folder created successfully`);
    } catch (error: any) {
      console.error('Error creating year folder:', error);
      alert('Error creating year folder: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add new entry
  const addEntry = async () => {
    if (!user || !getActiveFolderId()) return;
    
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('email_tracking_entries')
        .insert([{
          ...newEntry,
          folder_id: getActiveFolderId(),
          created_by: user.id
        }]);
      
      if (error) throw error;
      
      setNewEntry({
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
      setShowNewEntryForm(false);
      await fetchEntries(getActiveFolderId()!);
      alert('Entry added successfully');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      alert('Error adding entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update entry
  const updateEntry = async (entry: EmailEntry) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('email_tracking_entries')
        .update({
          entry_date: entry.entry_date,
          from_sender: entry.from_sender,
          subject: entry.subject,
          remark: entry.remark,
          to_do: entry.to_do,
          final_remark: entry.final_remark,
          folder_placed: entry.folder_placed,
          response: entry.response,
          email_account_id: entry.email_account_id,
          confirmed: entry.confirmed,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id);
      
      if (error) throw error;
      
      setEditingEntry(null);
      await fetchEntries(getActiveFolderId()!);
    } catch (error: any) {
      console.error('Error updating entry:', error);
      alert('Error updating entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('email_tracking_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      await fetchEntries(getActiveFolderId()!);
      alert('Entry deleted successfully');
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '280px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Email Tracking System...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      <MobileHeader title="Email Tracking" isMobile={isMobile} />
      <div style={{ marginLeft: isMobile ? '0' : '280px', padding: '2rem', background: '#F5F5ED', flex: 1, overflow: 'auto' }}>
        
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Tracking System</h1>
              <p className="mt-1 text-sm text-gray-600">Rother Care Pharmacy - Communication Management</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const year = prompt('Enter year (e.g., 2025):');
                  if (year && !isNaN(parseInt(year))) {
                    createYearFolder(parseInt(year));
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Year Folder
              </button>
            </div>
          </div>
        </div>

        {/* Folder Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Folder Navigation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Year
              </label>
              <select
                value={selectedYear?.id || ''}
                onChange={async (e) => {
                  const year = yearFolders.find(f => f.id === e.target.value);
                  setSelectedYear(year || null);
                  setEntries([]);
                  if (year) {
                    await fetchEntries(year.id);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Year --</option>
                {yearFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.folder_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        {getActiveFolderId() && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Email Entries</h2>
              <button
                onClick={() => setShowNewEntryForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add New Entry
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No entries found. Add your first entry to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.from_sender}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {emailAccounts.find(a => a.id === entry.email_account_id)?.account_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="checkbox"
                            checked={entry.confirmed}
                            onChange={async (e) => {
                              const updated = {...entry, confirmed: e.target.checked};
                              await updateEntry(updated);
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Folder Selected */}
        {!getActiveFolderId() && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No Folder Selected</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please select a year folder from the navigation above to view and manage email tracking entries.
            </p>
          </div>
        )}

        {/* New Entry Modal */}
        {showNewEntryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Entry</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From (Sender)</label>
                    <input
                      type="text"
                      value={newEntry.from_sender}
                      onChange={(e) => setNewEntry({...newEntry, from_sender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newEntry.subject}
                      onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Account</label>
                    <select
                      value={newEntry.email_account_id}
                      onChange={(e) => setNewEntry({...newEntry, email_account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Email Account --</option>
                      {emailAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowNewEntryForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addEntry}
                    disabled={saving || !newEntry.from_sender || !newEntry.subject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Adding...' : 'Add Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

