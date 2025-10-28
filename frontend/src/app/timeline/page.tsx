'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { createClient } from '@supabase/supabase-js';
import {
  PlusIcon,
  ChartBarIcon,
  FolderIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =============================================
// INTERFACES
// =============================================

interface TimelineFolder {
  id: number;
  name: string;
  description?: string;
  created_by_id: number;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
}

interface FolderMember {
  id: number;
  folder_id: number;
  user_id: number;
  role: 'owner' | 'manager' | 'editor' | 'viewer';
  can_edit: boolean;
  can_delete: boolean;
  can_manage_members: boolean;
  can_manage_budget: boolean;
  user_name?: string;
  user_email?: string;
}

interface Category {
  id: number;
  folder_id: number;
  name: string;
  description?: string;
  color: string;
  responsible_person_id?: number;
  parent_category_id?: number;
  display_order: number;
  is_active: boolean;
  subcategories?: Category[];
}

interface TimelineItem {
  id: number;
  folder_id: number;
  category_id?: number;
  title: string;
  description?: string;
  color: string;
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  phase?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'delayed';
  completion_percentage: number;
  planned_budget: number;
  actual_spending: number;
  budget_variance_percentage?: number;
  team_leader_id?: number;
  team_member_ids?: number[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  depends_on_item_ids?: number[];
  notes?: string;
  category_name?: string;
  checklist_count?: number;
  checklist_completed?: number;
}

interface ChecklistItem {
  id?: number;
  timeline_item_id: number;
  item_text: string;
  is_completed: boolean;
  item_order: number;
  completed_at?: string;
}

interface KPI {
  id?: number;
  timeline_item_id?: number;
  folder_id?: number;
  category_id?: number;
  kpi_name: string;
  kpi_type: 'percentage' | 'number' | 'currency' | 'duration' | 'rating';
  target_value: number;
  actual_value: number;
  unit: string;
  measurement_date: string;
  notes?: string;
}

type ViewMode = 'month' | 'week' | 'quarter';

// =============================================
// MAIN COMPONENT
// =============================================

export default function TimelineRoadmapPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [folders, setFolders] = useState<TimelineFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<TimelineFolder | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [folderMembers, setFolderMembers] = useState<FolderMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showGanttChart, setShowGanttChart] = useState(true);

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Form states
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: 0,
    currency: 'USD'
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    responsible_person_id: 0,
    parent_category_id: null as number | null
  });

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category_id: 0,
    start_date: '',
    end_date: '',
    phase: 'Planning',
    status: 'not_started' as TimelineItem['status'],
    planned_budget: 0,
    actual_spending: 0,
    completion_percentage: 0,
    priority: 'medium' as TimelineItem['priority'],
    team_leader_id: 0,
    team_member_ids: [] as number[],
    color: '#FFB333'
  });

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);

  // Phases (user can customize these per project)
  const defaultPhases = ['Planning', 'Design', 'Development', 'Testing', 'Launch', 'Maintenance'];
  const [phases, setPhases] = useState<string[]>(defaultPhases);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchFolders();
  }, [isAuthenticated, authLoading, router]);

  // Load data when folder selected
  useEffect(() => {
    if (selectedFolder) {
      fetchCategories();
      fetchTimelineItems();
      fetchFolderMembers();
    }
  }, [selectedFolder]);

  // =============================================
  // FETCH FUNCTIONS
  // =============================================

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const userId = parseInt(user?.id?.toString() || '0');

      // Get folders where user is owner or member
      const { data: memberData, error: memberError } = await supabase
        .from('timeline_folder_members')
        .select('folder_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const folderIds = memberData?.map(m => m.folder_id) || [];

      // Get folders created by user OR where user is a member
      const { data, error } = await supabase
        .from('timeline_folders')
        .select('*')
        .or(`created_by_id.eq.${userId},id.in.(${folderIds.join(',') || '0'})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
      
      // Auto-select first folder
      if (data && data.length > 0 && !selectedFolder) {
        setSelectedFolder(data[0]);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Failed to load timeline folders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!selectedFolder) return;

    try {
      const { data, error } = await supabase
        .from('timeline_categories')
        .select('*')
        .eq('folder_id', selectedFolder.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Organize into hierarchy
      const categoriesMap = new Map<number, Category>();
      const rootCategories: Category[] = [];

      (data || []).forEach(cat => {
        categoriesMap.set(cat.id, { ...cat, subcategories: [] });
      });

      (data || []).forEach(cat => {
        const category = categoriesMap.get(cat.id)!;
        if (cat.parent_category_id) {
          const parent = categoriesMap.get(cat.parent_category_id);
          if (parent) {
            parent.subcategories!.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      setCategories(rootCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTimelineItems = async () => {
    if (!selectedFolder) return;

    try {
      const { data, error } = await supabase
        .from('timeline_items')
        .select(`
          *,
          timeline_categories (name, color)
        `)
        .eq('folder_id', selectedFolder.id)
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const items = (data || []).map(item => ({
        ...item,
        category_name: item.timeline_categories?.name
      }));

      setTimelineItems(items);
    } catch (error) {
      console.error('Error fetching timeline items:', error);
    }
  };

  const fetchFolderMembers = async () => {
    if (!selectedFolder) return;

    try {
      const { data, error } = await supabase
        .from('timeline_folder_members')
        .select(`
          *,
          auth_user (id, name, email)
        `)
        .eq('folder_id', selectedFolder.id);

      if (error) throw error;

      const members = (data || []).map(m => ({
        ...m,
        user_name: m.auth_user?.name || 'Unknown',
        user_email: m.auth_user?.email || ''
      }));

      setFolderMembers(members);
    } catch (error) {
      console.error('Error fetching folder members:', error);
    }
  };

  // =============================================
  // CREATE FUNCTIONS
  // =============================================

  const handleCreateFolder = async () => {
    try {
      if (!newFolder.name.trim()) {
        setError('Folder name is required');
        return;
      }

      const folderData = {
        ...newFolder,
        created_by_id: parseInt(user?.id?.toString() || '0'),
        is_active: true
      };

      const { data, error } = await supabase
        .from('timeline_folders')
        .insert([folderData])
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('timeline_folder_members')
        .insert([{
          folder_id: data.id,
          user_id: parseInt(user?.id?.toString() || '0'),
          role: 'owner',
          can_edit: true,
          can_delete: true,
          can_manage_members: true,
          can_manage_budget: true
        }]);

      setFolders([data, ...folders]);
      setSelectedFolder(data);
      setShowFolderModal(false);
      setNewFolder({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        total_budget: 0,
        currency: 'USD'
      });
      setSuccessMessage('Timeline folder created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder');
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (!selectedFolder || !newCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);

      const categoryData = {
        folder_id: selectedFolder.id,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        responsible_person_id: newCategory.responsible_person_id || null,
        parent_category_id: newCategory.parent_category_id,
        display_order: maxOrder + 1,
        is_active: true
      };

      const { data, error } = await supabase
        .from('timeline_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      fetchCategories();
      setShowCategoryModal(false);
      setNewCategory({
        name: '',
        description: '',
        color: '#3B82F6',
        responsible_person_id: 0,
        parent_category_id: null
      });
      setSuccessMessage('Category created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    }
  };

  const handleCreateTimelineItem = async () => {
    try {
      if (!selectedFolder || !newItem.title.trim()) {
        setError('Title is required');
        return;
      }

      // Build description with checklist
      let fullDescription = newItem.description || '';
      if (checklistItems.length > 0) {
        const checklistText = '\n\n📋 Checklist:\n' + 
          checklistItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
        fullDescription += checklistText;
      }

      const itemData = {
        folder_id: selectedFolder.id,
        category_id: newItem.category_id || null,
        title: newItem.title,
        description: fullDescription,
        color: newItem.color,
        start_date: newItem.start_date,
        end_date: newItem.end_date,
        phase: newItem.phase,
        status: newItem.status,
        planned_budget: newItem.planned_budget,
        actual_spending: newItem.actual_spending,
        completion_percentage: newItem.completion_percentage,
        team_leader_id: newItem.team_leader_id || null,
        team_member_ids: newItem.team_member_ids.length > 0 ? newItem.team_member_ids : null,
        priority: newItem.priority,
        created_by_id: parseInt(user?.id?.toString() || '0')
      };

      const { data, error } = await supabase
        .from('timeline_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      // Save checklist items
      if (checklistItems.length > 0) {
        const checklistData = checklistItems.map((item, index) => ({
          timeline_item_id: data.id,
          item_text: item,
          is_completed: false,
          item_order: index
        }));

        await supabase
          .from('timeline_item_checklist')
          .insert(checklistData);
      }

      fetchTimelineItems();
      setShowItemModal(false);
      resetItemForm();
      setSuccessMessage('Timeline item created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating timeline item:', error);
      setError('Failed to create timeline item');
    }
  };

  const resetItemForm = () => {
    setNewItem({
      title: '',
      description: '',
      category_id: 0,
      start_date: '',
      end_date: '',
      phase: 'Planning',
      status: 'not_started',
      planned_budget: 0,
      actual_spending: 0,
      completion_percentage: 0,
      priority: 'medium',
      team_leader_id: 0,
      team_member_ids: [],
      color: '#FFB333'
    });
    setChecklistItems([]);
    setNewChecklistItem('');
    setSelectedItem(null);
    setIsEditingItem(false);
  };

  // =============================================
  // GANTT CHART LOGIC
  // =============================================

  const generateTimeColumns = (): { label: string; date: Date }[] => {
    const columns: { label: string; date: Date }[] = [];
    const start = new Date(currentDate);

    if (viewMode === 'month') {
      start.setDate(1); // First day of current month
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(start);
        monthDate.setMonth(start.getMonth() + i);
        columns.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: monthDate
        });
      }
    } else if (viewMode === 'week') {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - start.getDay()); // Start of week
      for (let i = 0; i < 12; i++) {
        const weekDate = new Date(weekStart);
        weekDate.setDate(weekStart.getDate() + (i * 7));
        columns.push({
          label: `Week ${i + 1}`,
          date: weekDate
        });
      }
    } else if (viewMode === 'quarter') {
      const quarterStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
      for (let i = 0; i < 8; i++) {
        const quarterDate = new Date(quarterStart);
        quarterDate.setMonth(quarterStart.getMonth() + (i * 3));
        const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
        columns.push({
          label: `Q${quarter} ${quarterDate.getFullYear()}`,
          date: quarterDate
        });
      }
    }

    return columns;
  };

  const calculateItemPosition = (item: TimelineItem, columns: { date: Date }[]) => {
    const itemStart = new Date(item.start_date);
    const itemEnd = new Date(item.end_date);
    
    let startCol = 0;
    let spanCols = 1;

    if (viewMode === 'month') {
      startCol = columns.findIndex(col => 
        col.date.getMonth() === itemStart.getMonth() && 
        col.date.getFullYear() === itemStart.getFullYear()
      );
      
      const endCol = columns.findIndex(col => 
        col.date.getMonth() === itemEnd.getMonth() && 
        col.date.getFullYear() === itemEnd.getFullYear()
      );
      
      if (startCol !== -1 && endCol !== -1) {
        spanCols = endCol - startCol + 1;
      }
    }
    // Similar logic for week and quarter...

    return { startCol: Math.max(0, startCol), spanCols: Math.max(1, spanCols) };
  };

  const getStatusColor = (status: TimelineItem['status']) => {
    const colors = {
      not_started: '#9CA3AF',
      in_progress: '#3B82F6',
      completed: '#10B981',
      on_hold: '#F59E0B',
      cancelled: '#EF4444',
      delayed: '#DC2626'
    };
    return colors[status] || '#9CA3AF';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#10B981',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444'
    };
    return colors[priority as keyof typeof colors] || '#3B82F6';
  };

  // =============================================
  // RENDER
  // =============================================

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B' }}>Loading Timeline & Roadmap...</p>
        </div>
      </div>
    );
  }

  const timeColumns = generateTimeColumns();

  return (
    <>
      <MobileHeader title="Timeline & Roadmap" isMobile={isMobile} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        
        <div style={{
          marginLeft: isMobile ? '0' : '280px',
          flex: 1,
          padding: isMobile ? '90px 16px 20px' : '32px',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#1F2937', margin: '0 0 8px 0' }}>
                  Timeline & Roadmap
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '16px' }}>
                  Project timeline, Gantt charts, KPI tracking & team performance
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowFolderModal(true)}
                  style={{
                    padding: '12px 20px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FolderIcon style={{ width: '18px', height: '18px' }} />
                  New Folder
                </button>
                
                {selectedFolder && (
                  <>
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      style={{
                        padding: '12px 20px',
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <PlusIcon style={{ width: '18px', height: '18px' }} />
                      New Category
                    </button>
                    
                    <button
                      onClick={() => setShowItemModal(true)}
                      style={{
                        padding: '12px 20px',
                        background: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <PlusIcon style={{ width: '18px', height: '18px' }} />
                      New Timeline Item
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Folder Selector & View Controls */}
            {folders.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                <select
                  value={selectedFolder?.id || ''}
                  onChange={(e) => {
                    const folder = folders.find(f => f.id === parseInt(e.target.value));
                    setSelectedFolder(folder || null);
                  }}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'white',
                    minWidth: '250px'
                  }}
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </option>
                  ))}
                </select>

                {/* View Mode Selector */}
                <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '8px', border: '2px solid #E5E7EB' }}>
                  <button
                    onClick={() => setViewMode('month')}
                    style={{
                      padding: '8px 16px',
                      background: viewMode === 'month' ? '#3B82F6' : 'transparent',
                      color: viewMode === 'month' ? 'white' : '#64748B',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    style={{
                      padding: '8px 16px',
                      background: viewMode === 'week' ? '#3B82F6' : 'transparent',
                      color: viewMode === 'week' ? 'white' : '#64748B',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('quarter')}
                    style={{
                      padding: '8px 16px',
                      background: viewMode === 'quarter' ? '#3B82F6' : 'transparent',
                      color: viewMode === 'quarter' ? 'white' : '#64748B',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Quarter
                  </button>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
                      else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
                      else newDate.setMonth(newDate.getMonth() - 3);
                      setCurrentDate(newDate);
                    }}
                    style={{
                      padding: '8px',
                      background: 'white',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeftIcon style={{ width: '20px', height: '20px', color: '#64748B' }} />
                  </button>
                  
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    Today
                  </button>
                  
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
                      else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
                      else newDate.setMonth(newDate.getMonth() + 3);
                      setCurrentDate(newDate);
                    }}
                    style={{
                      padding: '8px',
                      background: 'white',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748B' }} />
                  </button>
                </div>

                <button
                  onClick={() => setShowReportsModal(true)}
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    color: '#374151',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ChartBarIcon style={{ width: '18px', height: '18px' }} />
                  Reports
                </button>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{ padding: '16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '20px' }}>
              {error}
              <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          )}
          
          {successMessage && (
            <div style={{ padding: '16px', background: '#D1FAE5', color: '#059669', borderRadius: '8px', marginBottom: '20px' }}>
              {successMessage}
            </div>
          )}

          {/* Main Content */}
          {!selectedFolder ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '16px' }}>
              <FolderIcon style={{ width: '64px', height: '64px', color: '#D1D5DB', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1F2937', marginBottom: '12px' }}>
                No Timeline Folders Yet
              </h2>
              <p style={{ color: '#64748B', marginBottom: '24px' }}>
                Create your first timeline folder to start planning and tracking your projects
              </p>
              <button
                onClick={() => setShowFolderModal(true)}
                style={{
                  padding: '16px 32px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon style={{ width: '20px', height: '20px', display: 'inline-block', marginRight: '8px' }} />
                Create Timeline Folder
              </button>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Project Completion</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#3B82F6' }}>
                    {Math.round(timelineItems.reduce((sum, item) => sum + item.completion_percentage, 0) / (timelineItems.length || 1))}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
                    {timelineItems.filter(i => i.status === 'completed').length} of {timelineItems.length} completed
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Budget Status</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#10B981' }}>
                    ${timelineItems.reduce((sum, item) => sum + item.actual_spending, 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    of ${timelineItems.reduce((sum, item) => sum + item.planned_budget, 0).toLocaleString()} planned
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Active Items</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#F59E0B' }}>
                    {timelineItems.filter(i => i.status === 'in_progress').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    in progress
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Timeline Health</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: timelineItems.filter(i => new Date(i.end_date) < new Date() && i.status !== 'completed').length > 0 ? '#DC2626' : '#10B981' }}>
                    {timelineItems.filter(i => new Date(i.end_date) >= new Date() || i.status === 'completed').length > timelineItems.length / 2 ? 'On Track' : 'At Risk'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {timelineItems.filter(i => new Date(i.end_date) < new Date() && i.status !== 'completed').length} overdue
                  </div>
                </div>
              </div>

              {/* GANTT CHART */}
              {categories.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1F2937' }}>
                    Gantt Chart
                  </h2>

                  <div style={{ minWidth: '800px' }}>
                    {/* Timeline Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: `250px repeat(${timeColumns.length}, 1fr)`, gap: '1px', marginBottom: '1px' }}>
                      <div style={{ background: '#F8FAFC', padding: '12px', fontWeight: '700', color: '#374151', borderRadius: '8px 0 0 0' }}>
                        Category / Item
                      </div>
                      {timeColumns.map((col, idx) => (
                        <div key={idx} style={{ background: '#F8FAFC', padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>
                          {col.label}
                        </div>
                      ))}
                    </div>

                    {/* Categories & Timeline Items */}
                    {categories.map(category => {
                      const categoryItems = timelineItems.filter(item => item.category_id === category.id);
                      
                      return (
                        <div key={category.id} style={{ marginBottom: '2px' }}>
                          {/* Category Row */}
                          <div style={{ display: 'grid', gridTemplateColumns: `250px repeat(${timeColumns.length}, 1fr)`, gap: '1px', background: '#F1F5F9' }}>
                            <div style={{ 
                              background: category.color + '20', 
                              padding: '16px', 
                              fontWeight: '700', 
                              color: category.color,
                              borderLeft: `4px solid ${category.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span>{category.name}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', background: category.color, color: 'white', padding: '4px 8px', borderRadius: '12px' }}>
                                {categoryItems.length}
                              </span>
                            </div>
                            {timeColumns.map((_, idx) => (
                              <div key={idx} style={{ background: 'white', minHeight: '20px' }} />
                            ))}
                          </div>

                          {/* Timeline Items for this Category */}
                          {categoryItems.map(item => {
                            const { startCol, spanCols } = calculateItemPosition(item, timeColumns);
                            
                            return (
                              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: `250px repeat(${timeColumns.length}, 1fr)`, gap: '1px', marginBottom: '1px' }}>
                                <div style={{ 
                                  background: 'white', 
                                  padding: '12px 16px', 
                                  fontSize: '14px',
                                  color: '#374151',
                                  borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsEditingItem(true);
                                  // Load item details for editing
                                }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                                      {item.completion_percentage}% • ${item.actual_spending.toLocaleString()}/${item.planned_budget.toLocaleString()}
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '4px 8px',
                                    background: getStatusColor(item.status) + '20',
                                    color: getStatusColor(item.status),
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}>
                                    {item.status.replace('_', ' ')}
                                  </div>
                                </div>

                                {/* Gantt Bar */}
                                {timeColumns.map((_, idx) => (
                                  <div key={idx} style={{ background: '#F8FAFC', position: 'relative', minHeight: '60px', border: '1px solid #E5E7EB' }}>
                                    {idx === startCol && (
                                      <div style={{
                                        position: 'absolute',
                                        left: '4px',
                                        right: spanCols > 1 ? 'auto' : '4px',
                                        width: spanCols > 1 ? `calc(${spanCols * 100}% + ${(spanCols - 1) * 100}% - 8px)` : 'calc(100% - 8px)',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        cursor: 'pointer',
                                        zIndex: 10
                                      }}
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setShowItemModal(true);
                                      }}
                                      >
                                        <div>{item.title}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
                                          {item.completion_percentage}% complete
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {categories.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                        <p>No categories yet. Create your first category to organize timeline items.</p>
                        <button
                          onClick={() => setShowCategoryModal(true)}
                          style={{
                            marginTop: '16px',
                            padding: '12px 24px',
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Create First Category
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NOTE: This is Part 1 - I will continue building modals, forms, and reports in the next section */}
            </>
          )}
        </div>
      </div>

      {/* CREATE FOLDER MODAL */}
      {showFolderModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowFolderModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px'}}>Create Timeline Folder</h3>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Folder Name *</label>
              <input type="text" value={newFolder.name} onChange={(e) => setNewFolder({...newFolder, name: e.target.value})} placeholder="e.g., 2025 Company Roadmap" style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Description</label>
              <textarea value={newFolder.description} onChange={(e) => setNewFolder({...newFolder, description: e.target.value})} rows={3} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Start Date</label>
                <input type="date" value={newFolder.start_date} onChange={(e) => setNewFolder({...newFolder, start_date: e.target.value})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>End Date</label>
                <input type="date" value={newFolder.end_date} onChange={(e) => setNewFolder({...newFolder, end_date: e.target.value})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowFolderModal(false)} style={{padding: '12px 24px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Cancel</button>
              <button onClick={handleCreateFolder} style={{padding: '12px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowCategoryModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px'}}>Create Category</h3>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Category Name *</label>
              <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} placeholder="e.g., Social Media, IT, Marketing" style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Color</label>
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                {['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#EC4899'].map(color => (
                  <button key={color} onClick={() => setNewCategory({...newCategory, color})} style={{width: '40px', height: '40px', borderRadius: '8px', background: color, border: newCategory.color === color ? '3px solid #1F2937' : 'none', cursor: 'pointer'}} />
                ))}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowCategoryModal(false)} style={{padding: '12px 24px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Cancel</button>
              <button onClick={handleCreateCategory} style={{padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Create Category</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TIMELINE ITEM MODAL */}
      {showItemModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto'}} onClick={() => setShowItemModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px'}}>Create Timeline Item</h3>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Title *</label>
              <input type="text" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} placeholder="e.g., Website Redesign Project" style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Category</label>
              <select value={newItem.category_id} onChange={(e) => setNewItem({...newItem, category_id: parseInt(e.target.value)})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                <option value={0}>Select category...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Start Date *</label>
                <input type="date" value={newItem.start_date} onChange={(e) => setNewItem({...newItem, start_date: e.target.value})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>End Date *</label>
                <input type="date" value={newItem.end_date} onChange={(e) => setNewItem({...newItem, end_date: e.target.value})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Phase</label>
                <select value={newItem.phase} onChange={(e) => setNewItem({...newItem, phase: e.target.value})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                  {phases.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Status</label>
                <select value={newItem.status} onChange={(e) => setNewItem({...newItem, status: e.target.value as TimelineItem['status']})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Planned Budget ($)</label>
                <input type="number" value={newItem.planned_budget} onChange={(e) => setNewItem({...newItem, planned_budget: parseFloat(e.target.value) || 0})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Actual Spending ($)</label>
                <input type="number" value={newItem.actual_spending} onChange={(e) => setNewItem({...newItem, actual_spending: parseFloat(e.target.value) || 0})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
              </div>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Completion % (0-100)</label>
              <input type="number" min="0" max="100" value={newItem.completion_percentage} onChange={(e) => setNewItem({...newItem, completion_percentage: parseInt(e.target.value) || 0})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Checklist Items</label>
              <div style={{border: '2px solid #E5E7EB', borderRadius: '8px', padding: '16px', background: '#F9FAFB'}}>
                <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
                  <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} onKeyPress={(e) => {if (e.key === 'Enter') {e.preventDefault(); if (newChecklistItem.trim()) {setChecklistItems([...checklistItems, newChecklistItem]); setNewChecklistItem('');}}}} placeholder="Add checklist item..." style={{flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px'}} />
                  <button type="button" onClick={() => {if (newChecklistItem.trim()) {setChecklistItems([...checklistItems, newChecklistItem]); setNewChecklistItem('');}}} style={{padding: '10px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'}}>Add</button>
                </div>
                {checklistItems.map((item, idx) => (
                  <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '8px'}}>
                    <span style={{flex: 1, fontSize: '14px'}}>{idx + 1}. {item}</span>
                    <button onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))} style={{padding: '4px 8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'}}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => {setShowItemModal(false); resetItemForm();}} style={{padding: '12px 24px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Cancel</button>
              <button onClick={handleCreateTimelineItem} style={{padding: '12px 24px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Create Item</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

