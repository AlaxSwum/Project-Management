'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CurrencyDollarIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon as ChevronRightIconSolid,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface ExpenseFolder {
  id: number;
  name: string;
  description: string;
  color: string;
  created_by: number;
  folder_type: 'expense' | 'budget' | 'reimbursement';
  budget_limit: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  member_count?: number;
  total_expenses?: number;
}

interface ExpenseFolderMember {
  id: number;
  folder_id: number;
  user_id: number;
  role: 'owner' | 'editor' | 'viewer';
  added_by: number;
  added_at: string;
  user_name?: string;
  user_email?: string;
}

interface ExpenseItem {
  id: number;
  folder_id: number;
  created_by: number;
  created_by_name: string;
  created_by_email: string;
  item_name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  total_amount: number;
  currency: string;
  expense_date: string;
  month_year: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  receipt_url: string | null;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  default_currency: string;
  is_active: boolean;
}

export default function ExpensesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [folders, setFolders] = useState<ExpenseFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ExpenseFolder | null>(null);
  const [folderMembers, setFolderMembers] = useState<ExpenseFolderMember[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFolderSettings, setShowFolderSettings] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyExpenses, setMonthlyExpenses] = useState<{[key: string]: ExpenseItem[]}>({});
  
  // Form state
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    folder_type: 'expense' as 'expense' | 'budget' | 'reimbursement',
    budget_limit: '',
    currency: 'USD'
  });
  
  const [expenseForm, setExpenseForm] = useState({
    item_name: '',
    description: '',
    category: '',
    price: '',
    quantity: '1',
    currency: 'USD',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_url: '',
    notes: ''
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, authLoading, router, user]);

  // Organize expenses by month when data changes
  useEffect(() => {
    organizeExpensesByMonth();
  }, [expenses]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Fetch folders where user is a member
      const { data: folderMembersData, error: membersError } = await supabase
        .from('expense_folder_members')
        .select(`
          *,
          expense_folders!inner(*)
        `)
        .eq('user_id', user?.id);
      
      if (membersError) throw membersError;
      
      const accessibleFolders = folderMembersData?.map(member => ({
        ...member.expense_folders,
        user_role: member.role
      })) || [];
      
      setFolders(accessibleFolders);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
      
      // If there's a selected folder, fetch its expenses
      if (selectedFolder) {
        await fetchFolderExpenses(selectedFolder.id);
      }
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolderExpenses = async (folderId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data: expensesData, error: expensesError } = await supabase
        .from('expense_items')
        .select('*')
        .eq('folder_id', folderId)
        .order('expense_date', { ascending: false });
      
      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);
      
      // Fetch folder members
      const { data: membersData, error: membersError } = await supabase
        .from('expense_folder_members')
        .select(`
          *,
          auth_user!inner(id, name, email)
        `)
        .eq('folder_id', folderId);
      
      if (membersError) throw membersError;
      
      const members = membersData?.map(member => ({
        ...member,
        user_name: member.auth_user.name,
        user_email: member.auth_user.email
      })) || [];
      
      setFolderMembers(members);
      
    } catch (err: any) {
      console.error('Error fetching folder expenses:', err);
      setError('Failed to load folder expenses');
    }
  };

  const organizeExpensesByMonth = () => {
    const organized: {[key: string]: ExpenseItem[]} = {};
    
    expenses.forEach(expense => {
      const monthKey = expense.month_year;
      if (!organized[monthKey]) {
        organized[monthKey] = [];
      }
      organized[monthKey].push(expense);
    });
    
    // Sort expenses within each month by date
    Object.keys(organized).forEach(monthKey => {
      organized[monthKey].sort((a, b) => 
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );
    });
    
    setMonthlyExpenses(organized);
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFolder = async (folder: ExpenseFolder) => {
    setSelectedFolder(folder);
    await fetchFolderExpenses(folder.id);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderForm.name.trim()) {
      alert('Please enter a folder name');
      return;
    }
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Create folder
      const { data: folderData, error: folderError } = await supabase
        .from('expense_folders')
        .insert([{
          name: folderForm.name,
          description: folderForm.description,
          color: folderForm.color,
          folder_type: folderForm.folder_type,
          budget_limit: folderForm.budget_limit ? parseFloat(folderForm.budget_limit) : null,
          currency: folderForm.currency,
          created_by: user?.id
        }])
        .select()
        .single();
      
      if (folderError) throw folderError;
      
      // Add creator as owner
      const { error: memberError } = await supabase
        .from('expense_folder_members')
        .insert([{
          folder_id: folderData.id,
          user_id: user?.id,
          role: 'owner',
          added_by: user?.id
        }]);
      
      if (memberError) throw memberError;
      
      // Reset form and close modal
      setFolderForm({
        name: '',
        description: '',
        color: '#3B82F6',
        folder_type: 'expense',
        budget_limit: '',
        currency: 'USD'
      });
      setShowCreateFolder(false);
      
      // Refresh data
      fetchData();
      
    } catch (err: any) {
      console.error('Error creating folder:', err);
      alert('Failed to create folder. Please try again.');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFolder || !expenseForm.item_name.trim() || !expenseForm.price) {
      alert('Please fill in the required fields');
      return;
    }
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('expense_items')
        .insert([{
          folder_id: selectedFolder.id,
          created_by: user?.id,
          created_by_name: user?.name || user?.email?.split('@')[0] || 'Unknown',
          created_by_email: user?.email,
          item_name: expenseForm.item_name,
          description: expenseForm.description,
          category: expenseForm.category,
          price: parseFloat(expenseForm.price),
          quantity: parseInt(expenseForm.quantity) || 1,
          currency: expenseForm.currency,
          expense_date: expenseForm.expense_date,
          receipt_url: expenseForm.receipt_url || null,
          notes: expenseForm.notes || null
        }])
        .select();
      
      if (error) throw error;
      
      // Reset form and close modal
      setExpenseForm({
        item_name: '',
        description: '',
        category: '',
        price: '',
        quantity: '1',
        currency: 'USD',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: '',
        notes: ''
      });
      setShowAddExpense(false);
      
      // Refresh folder expenses
      await fetchFolderExpenses(selectedFolder.id);
      
    } catch (err: any) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Please try again.');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getCurrentMonthKey = () => {
    return currentMonth.toISOString().slice(0, 7); // Format: '2025-09'
  };

  const getTotalForMonth = (monthKey: string) => {
    const monthExpenses = monthlyExpenses[monthKey] || [];
    return monthExpenses.reduce((sum, expense) => sum + expense.total_amount, 0);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#fafafa', 
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
                color: '#111827',
                letterSpacing: '-0.02em'
              }}>
                Expense Management
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Track and manage expenses with folder-based organization and team sharing
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateFolder(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Create Folder
            </button>
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#dc2626',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading expense data...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Folders Sidebar */}
              <div style={{ width: '320px' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      margin: '0',
                      color: '#111827'
                    }}>
                      Expense Folders
                    </h3>
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    {folders.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6b7280'
                      }}>
                        <FolderIcon style={{
                          width: '32px',
                          height: '32px',
                          margin: '0 auto 0.5rem',
                          color: '#d1d5db'
                        }} />
                        <p style={{ fontSize: '0.875rem', margin: '0' }}>
                          No expense folders yet. Create one to get started.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {folders.map(folder => (
                          <div key={folder.id}>
                            <div
                              onClick={() => selectFolder(folder)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: selectedFolder?.id === folder.id ? '#eff6ff' : 'transparent',
                                border: selectedFolder?.id === folder.id ? '1px solid #3b82f6' : '1px solid transparent',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedFolder?.id !== folder.id) {
                                  e.currentTarget.style.background = '#f9fafb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedFolder?.id !== folder.id) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: folder.color,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FolderIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  margin: '0',
                                  color: '#111827'
                                }}>
                                  {folder.name}
                                </h4>
                                <p style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  margin: '0'
                                }}>
                                  {folder.folder_type} • {folder.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div style={{ flex: 1 }}>
                {!selectedFolder ? (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <CurrencyDollarIcon style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 1rem',
                      color: '#d1d5db'
                    }} />
                    <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                      Select an expense folder
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: '0' }}>
                      Choose a folder from the sidebar to view and manage expenses.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Folder Header */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: selectedFolder.color,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FolderOpenIcon style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                        </div>
                        <div>
                          <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            margin: '0',
                            color: '#111827'
                          }}>
                            {selectedFolder.name}
                          </h2>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {selectedFolder.description} • {folderMembers.length} member{folderMembers.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setShowAddExpense(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          <PlusIcon style={{ width: '16px', height: '16px' }} />
                          Add Expense
                        </button>
                        <button
                          onClick={() => setShowFolderSettings(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f9fafb',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          <CogIcon style={{ width: '16px', height: '16px' }} />
                          Settings
                        </button>
                      </div>
                    </div>

                    {/* Monthly Navigation */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      padding: '1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => navigateMonth('prev')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}
                      >
                        <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                        Previous
                      </button>
                      
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          margin: '0',
                          color: '#111827'
                        }}>
                          {formatMonthYear(currentMonth)}
                        </h3>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0.25rem 0 0 0'
                        }}>
                          Total: {selectedFolder.currency} {getTotalForMonth(getCurrentMonthKey()).toFixed(2)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => navigateMonth('next')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}
                      >
                        Next
                        <ChevronRightIconSolid style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>

                    {/* Monthly Expense Sheet */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden'
                    }}>
                      {(() => {
                        const currentMonthKey = getCurrentMonthKey();
                        const monthExpenses = monthlyExpenses[currentMonthKey] || [];
                        
                        return (
                          <>
                            {/* Sheet Header */}
                            <div style={{
                              background: '#f9fafb',
                              padding: '1rem',
                              borderBottom: '1px solid #e5e7eb',
                              display: 'grid',
                              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px',
                              gap: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              <div>Item & Description</div>
                              <div>Category</div>
                              <div>Price</div>
                              <div>Quantity</div>
                              <div>Total</div>
                              <div>Date</div>
                              <div>Actions</div>
                            </div>

                            {/* Expense Rows */}
                            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                              {monthExpenses.length === 0 ? (
                                <div style={{
                                  padding: '3rem',
                                  textAlign: 'center',
                                  color: '#6b7280'
                                }}>
                                  <DocumentTextIcon style={{
                                    width: '32px',
                                    height: '32px',
                                    margin: '0 auto 0.5rem',
                                    color: '#d1d5db'
                                  }} />
                                  <p style={{ fontSize: '0.875rem', margin: '0' }}>
                                    No expenses for {formatMonthYear(currentMonth)}
                                  </p>
                                </div>
                              ) : (
                                monthExpenses.map((expense, index) => (
                                  <div
                                    key={expense.id}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px',
                                      gap: '1rem',
                                      padding: '1rem',
                                      borderBottom: index < monthExpenses.length - 1 ? '1px solid #f3f4f6' : 'none',
                                      alignItems: 'center',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    <div>
                                      <div style={{
                                        fontWeight: '600',
                                        color: '#111827',
                                        marginBottom: '0.25rem'
                                      }}>
                                        {expense.item_name}
                                      </div>
                                      {expense.description && (
                                        <div style={{
                                          fontSize: '0.75rem',
                                          color: '#6b7280'
                                        }}>
                                          {expense.description}
                                        </div>
                                      )}
                                      <div style={{
                                        fontSize: '0.75rem',
                                        color: '#9ca3af',
                                        marginTop: '0.25rem'
                                      }}>
                                        by {expense.created_by_name}
                                      </div>
                                    </div>
                                    <div style={{
                                      background: '#f3f4f6',
                                      color: '#374151',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      textAlign: 'center'
                                    }}>
                                      {expense.category}
                                    </div>
                                    <div style={{ color: '#111827', fontWeight: '500' }}>
                                      {expense.currency} {expense.price.toFixed(2)}
                                    </div>
                                    <div style={{ color: '#6b7280', textAlign: 'center' }}>
                                      {expense.quantity}
                                    </div>
                                    <div style={{ 
                                      color: '#111827', 
                                      fontWeight: '600',
                                      fontSize: '0.875rem'
                                    }}>
                                      {expense.currency} {expense.total_amount.toFixed(2)}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                      {new Date(expense.expense_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                      <button
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '0.25rem',
                                          borderRadius: '4px',
                                          color: '#6b7280'
                                        }}
                                        title="View Details"
                                      >
                                        <EyeIcon style={{ width: '14px', height: '14px' }} />
                                      </button>
                                      {(expense.created_by === user?.id || folderMembers.find(m => m.user_id === user?.id)?.role === 'owner') && (
                                        <button
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0.25rem',
                                            borderRadius: '4px',
                                            color: '#6b7280'
                                          }}
                                          title="Edit"
                                        >
                                          <PencilIcon style={{ width: '14px', height: '14px' }} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Monthly Summary */}
                            {monthExpenses.length > 0 && (
                              <div style={{
                                background: '#f9fafb',
                                padding: '1rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                <div style={{ color: '#111827' }}>
                                  Total ({monthExpenses.length} items)
                                </div>
                                <div></div>
                                <div></div>
                                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                                  {monthExpenses.reduce((sum, exp) => sum + exp.quantity, 0)}
                                </div>
                                <div style={{ color: '#111827' }}>
                                  {selectedFolder.currency} {getTotalForMonth(currentMonthKey).toFixed(2)}
                                </div>
                                <div></div>
                                <div></div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div 
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 1000
          }}
          onClick={() => setShowCreateFolder(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0',
                color: '#111827'
              }}>
                Create Expense Folder
              </h2>
              <button
                onClick={() => setShowCreateFolder(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="e.g., Q4 Marketing Expenses"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description
                </label>
                <textarea
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  placeholder="Brief description of this expense folder"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Folder Type
                  </label>
                  <select
                    value={folderForm.folder_type}
                    onChange={(e) => setFolderForm({ ...folderForm, folder_type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="expense">Expense</option>
                    <option value="budget">Budget</option>
                    <option value="reimbursement">Reimbursement</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Currency
                  </label>
                  <select
                    value={folderForm.currency}
                    onChange={(e) => setFolderForm({ ...folderForm, currency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="MMK">MMK</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Budget Limit (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={folderForm.budget_limit}
                    onChange={(e) => setFolderForm({ ...folderForm, budget_limit: e.target.value })}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Folder Color
                  </label>
                  <input
                    type="color"
                    value={folderForm.color}
                    onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                    style={{
                      width: '100%',
                      height: '42px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && selectedFolder && (
        <div 
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 1000
          }}
          onClick={() => setShowAddExpense(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0',
                color: '#111827'
              }}>
                Add Expense to {selectedFolder.name}
              </h2>
              <button
                onClick={() => setShowAddExpense(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.item_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                  placeholder="e.g., Office Printer"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description
                </label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Additional details about this expense"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Category *
                  </label>
                  <select
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.price}
                    onChange={(e) => setExpenseForm({ ...expenseForm, price: e.target.value })}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.quantity}
                    onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Total
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {selectedFolder.currency} {(parseFloat(expenseForm.price || '0') * parseInt(expenseForm.quantity || '1')).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Receipt URL (Optional)
                </label>
                <input
                  type="url"
                  value={expenseForm.receipt_url}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })}
                  placeholder="https://example.com/receipt.pdf"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Notes
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional notes or comments"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#10b981',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Add Expense
                </button>
              </div>
            </form>
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
