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
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loadedChecklistItems, setLoadedChecklistItems] = useState<ChecklistItem[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<{id: number; name: string; email: string}[]>([]);
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set()); // Track which categories are expanded

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
      fetchAvailableTeamMembers();
    }
  }, [selectedFolder]);

  const fetchAvailableTeamMembers = async () => {
    if (!selectedFolder) return;
    
    try {
      // Get only folder members (team members assigned to this project)
      const { data: memberData, error: memberError } = await supabase
        .from('timeline_folder_members')
        .select('user_id')
        .eq('folder_id', selectedFolder.id);
      
      if (memberError) throw memberError;
      
      const memberIds = memberData?.map(m => m.user_id) || [];
      
      if (memberIds.length === 0) {
        setAvailableTeamMembers([]);
        return;
      }
      
      // Get user details for folder members only
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email')
        .in('id', memberIds)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (!error && data) {
        setAvailableTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const loadTimelineItemDetails = async (item: TimelineItem) => {
    setSelectedItem(item);
    
    // Load checklist items for this timeline item
    try {
      const { data, error } = await supabase
        .from('timeline_item_checklist')
        .select('*')
        .eq('timeline_item_id', item.id)
        .order('item_order', { ascending: true });
      
      if (!error && data) {
        setLoadedChecklistItems(data);
      } else {
        setLoadedChecklistItems([]);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      setLoadedChecklistItems([]);
    }
    
    setShowItemDetailsModal(true);
  };

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
      
      // Auto-expand all categories on first load
      if (data && data.length > 0 && expandedCategories.size === 0) {
        const allCategoryIds = new Set(data.map(cat => cat.id));
        setExpandedCategories(allCategoryIds);
      }
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
        .select('*')
        .eq('folder_id', selectedFolder.id);

      if (error) throw error;

      // Get user details separately for each member
      const membersWithUsers = await Promise.all((data || []).map(async (m) => {
        const { data: userData } = await supabase
          .from('auth_user')
          .select('id, name, email')
          .eq('id', m.user_id)
          .single();
        
        return {
          ...m,
          user_name: userData?.name || 'Unknown',
          user_email: userData?.email || ''
        };
      }));

      setFolderMembers(membersWithUsers);
    } catch (error) {
      console.error('Error fetching folder members:', error);
      setFolderMembers([]); // Set empty array on error
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
        const checklistText = '\n\nChecklist:\n' + 
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
                      {folder.name}
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

                {selectedFolder && (
                  <button
                    onClick={() => setShowMembersModal(true)}
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
                    <UserGroupIcon style={{ width: '18px', height: '18px' }} />
                    Team ({folderMembers.length})
                  </button>
                )}
                
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

                    {/* Categories & Timeline Items - Recursive Rendering */}
                    {(() => {
                      const renderCategory = (category: Category, level: number = 0) => {
                        const categoryItems = timelineItems.filter(item => item.category_id === category.id);
                        const indentPadding = level * 20;
                        
                        return (
                          <div key={category.id} style={{ marginBottom: '2px' }}>
                            {/* Category Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: `250px repeat(${timeColumns.length}, 1fr)`, gap: '1px', background: '#F1F5F9' }}>
                              <div style={{ 
                                background: selectedCategoryId === category.id ? category.color + '30' : category.color + '20', 
                                padding: '16px', 
                                paddingLeft: `${16 + indentPadding}px`,
                                fontWeight: '700', 
                                color: category.color,
                                borderLeft: `4px solid ${category.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newExpanded = new Set(expandedCategories);
                                      if (newExpanded.has(category.id)) {
                                        newExpanded.delete(category.id);
                                      } else {
                                        newExpanded.add(category.id);
                                      }
                                      setExpandedCategories(newExpanded);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                  >
                                    {expandedCategories.has(category.id) ? (
                                      <ChevronDownIcon style={{ width: '20px', height: '20px', color: category.color }} />
                                    ) : (
                                      <ChevronRightIcon style={{ width: '20px', height: '20px', color: category.color }} />
                                    )}
                                  </button>
                                  <span>{level > 0 ? '└ ' : ''}{category.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '600', background: category.color, color: 'white', padding: '4px 8px', borderRadius: '12px' }}>
                                    {categoryItems.length}
                                  </span>
                                  {selectedCategoryId === category.id && (
                                    <button onClick={async (e) => {e.stopPropagation(); if (confirm(`Delete category "${category.name}"?`)) {await supabase.from('timeline_categories').update({ is_active: false }).eq('id', category.id); fetchCategories(); setSelectedCategoryId(null); setSuccessMessage(`"${category.name}" deleted`);}}} style={{ padding: '6px 12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      Delete "{category.name}"
                                    </button>
                                  )}
                                </div>
                              </div>
                              {timeColumns.map((_, idx) => (
                                <div key={idx} style={{ background: 'white', minHeight: '20px' }} />
                              ))}
                            </div>

                            {/* Timeline Items for this Category - Show only if expanded */}
                            {expandedCategories.has(category.id) && categoryItems.map(item => {
                            const { startCol, spanCols } = calculateItemPosition(item, timeColumns);
                            const isCompleted = item.status === 'completed';
                            
                            return (
                              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: `250px repeat(${timeColumns.length}, 1fr)`, gap: '1px', marginBottom: '1px' }}>
                                <div style={{ 
                                  background: isCompleted ? '#F3F4F6' : 'white', 
                                  padding: '12px 16px', 
                                  fontSize: '14px',
                                  color: isCompleted ? '#9CA3AF' : '#374151',
                                  borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  opacity: isCompleted ? 0.7 : 1
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadTimelineItemDetails(item);
                                }}
                                >
                                  <input type="checkbox" checked={isCompleted} onChange={async (e) => {e.stopPropagation(); await supabase.from('timeline_items').update({status: isCompleted ? 'in_progress' : 'completed', completion_percentage: isCompleted ? item.completion_percentage : 100}).eq('id', item.id); fetchTimelineItems();}} style={{width: '18px', height: '18px', cursor: 'pointer', marginRight: '8px', flexShrink: 0, accentColor: '#10B981'}} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px', textDecoration: isCompleted ? 'line-through' : 'none' }}>{item.title}</div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                                      {item.completion_percentage}% • ${item.actual_spending.toLocaleString()}/${item.planned_budget.toLocaleString()}
                                    </div>
                                  </div>
                                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
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
                                    <button onClick={async (e) => {e.stopPropagation(); if (confirm(`Delete timeline item "${item.title}"?`)) {await supabase.from('timeline_items').delete().eq('id', item.id); fetchTimelineItems(); setSuccessMessage('Item deleted');}}} style={{padding: '4px 8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600'}}>Delete</button>
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
                          
                          {/* Render Subcategories Recursively */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <>
                              {category.subcategories.map(subcat => renderCategory(subcat, level + 1))}
                            </>
                          )}
                        </div>
                      );
                    };
                    
                    // Render all root categories
                    return categories.map(cat => renderCategory(cat, 0));
                  })()}

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
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Parent Category (Optional)</label>
              <select value={newCategory.parent_category_id || ''} onChange={(e) => setNewCategory({...newCategory, parent_category_id: e.target.value ? parseInt(e.target.value) : null})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                <option value="">None (Main Category)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>↳ {cat.name}</option>
                ))}
              </select>
              <div style={{fontSize: '12px', color: '#64748B', marginTop: '4px'}}>
                Select a parent to create a subcategory
              </div>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Description</label>
              <textarea value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} rows={2} placeholder="Optional description..." style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}} />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Color</label>
              <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                {['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#F97316', '#14B8A6'].map(color => (
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
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Category & Subcategories</label>
              <select value={newItem.category_id} onChange={(e) => setNewItem({...newItem, category_id: parseInt(e.target.value)})} style={{width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                <option value={0}>Select category...</option>
                {(() => {
                  const flattenCats = (cats: Category[], level: number = 0): JSX.Element[] => {
                    let items: JSX.Element[] = [];
                    cats.forEach(cat => {
                      const indent = '  '.repeat(level);
                      const prefix = level > 0 ? indent + '└ ' : '';
                      items.push(<option key={cat.id} value={cat.id}>{prefix}{cat.name}</option>);
                      if (cat.subcategories && cat.subcategories.length > 0) {
                        items = items.concat(flattenCats(cat.subcategories, level + 1));
                      }
                    });
                    return items;
                  };
                  return flattenCats(categories);
                })()}
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
              <label style={{display: 'block', marginBottom: '12px', fontWeight: '600'}}>Assign Team Members</label>
              <div style={{border: '2px solid #E5E7EB', borderRadius: '8px', padding: '16px', background: '#F9FAFB', maxHeight: '200px', overflowY: 'auto'}}>
                {availableTeamMembers.length > 0 ? availableTeamMembers.map(member => (
                  <label key={member.id} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'white', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer', border: newItem.team_member_ids.includes(member.id) ? '2px solid #3B82F6' : '2px solid transparent'}}>
                    <input
                      type="checkbox"
                      checked={newItem.team_member_ids.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewItem({...newItem, team_member_ids: [...newItem.team_member_ids, member.id]});
                        } else {
                          setNewItem({...newItem, team_member_ids: newItem.team_member_ids.filter(id => id !== member.id)});
                        }
                      }}
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6'}}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '600', fontSize: '14px', color: '#374151'}}>{member.name}</div>
                      <div style={{fontSize: '12px', color: '#64748B'}}>{member.email}</div>
                    </div>
                  </label>
                )) : (
                  <p style={{textAlign: 'center', color: '#9CA3AF', fontSize: '14px', padding: '20px'}}>
                    No team members. Add members in Team settings.
                  </p>
                )}
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

      {/* MANAGE FOLDER MEMBERS MODAL */}
      {showMembersModal && selectedFolder && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => setShowMembersModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px'}}>Manage Team Members</h3>
            
            <div style={{marginBottom: '24px'}}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row'}}>
                <input 
                  type="email" 
                  placeholder="Enter team member email..."
                  id="memberEmail"
                  style={{flex: 1, padding: '14px 16px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '15px', minWidth: isMobile ? '100%' : '300px'}}
                />
                <select id="memberRole" style={{padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="manager">Manager</option>
                </select>
                <button 
                  onClick={async () => {
                    const email = (document.getElementById('memberEmail') as HTMLInputElement).value;
                    const role = (document.getElementById('memberRole') as HTMLSelectElement).value;
                    if (email.trim()) {
                      try {
                        const { data: userData } = await supabase.from('auth_user').select('id').eq('email', email).single();
                        if (userData) {
                          await supabase.from('timeline_folder_members').insert([{
                            folder_id: selectedFolder.id,
                            user_id: userData.id,
                            role,
                            can_edit: role !== 'viewer',
                            can_delete: role === 'manager',
                            can_manage_members: role === 'manager',
                            can_manage_budget: role === 'manager'
                          }]);
                          fetchFolderMembers();
                          setSuccessMessage('Member added successfully!');
                          (document.getElementById('memberEmail') as HTMLInputElement).value = '';
                        }
                      } catch (err) {
                        setError('Failed to add member');
                      }
                    }
                  }}
                  style={{padding: '12px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}
                >
                  Add
                </button>
              </div>
            </div>
            
            <div>
              <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>Current Members</h4>
              {folderMembers.map(member => (
                <div key={member.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '8px'}}>
                  <div>
                    <div style={{fontWeight: '600', fontSize: '14px'}}>{member.user_name}</div>
                    <div style={{fontSize: '12px', color: '#64748B'}}>{member.user_email}</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span style={{padding: '4px 12px', background: member.role === 'owner' ? '#3B82F6' : member.role === 'manager' ? '#10B981' : '#6B7280', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: '600'}}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button onClick={async () => {
                        if (confirm('Remove this member?')) {
                          await supabase.from('timeline_folder_members').delete().eq('id', member.id);
                          fetchFolderMembers();
                        }
                      }} style={{padding: '4px 8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'}}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{marginTop: '24px', display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowMembersModal(false)} style={{padding: '12px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* VISUAL REPORTS MODAL */}
      {showReportsModal && selectedFolder && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => setShowReportsModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px'}}>Visual Reports & Analytics</h3>
            
            {/* Overall Progress */}
            <div style={{marginBottom: '32px'}}>
              <h4 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Overall Project Completion</h4>
              <div style={{background: '#F1F5F9', borderRadius: '12px', padding: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontWeight: '600'}}>Total Progress</span>
                  <span style={{fontWeight: '700', color: '#3B82F6'}}>{Math.round(timelineItems.reduce((sum, item) => sum + item.completion_percentage, 0) / (timelineItems.length || 1))}%</span>
                </div>
                <div style={{width: '100%', height: '24px', background: '#E5E7EB', borderRadius: '12px', overflow: 'hidden'}}>
                  <div style={{width: `${Math.round(timelineItems.reduce((sum, item) => sum + item.completion_percentage, 0) / (timelineItems.length || 1))}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', transition: 'width 0.3s ease'}} />
                </div>
              </div>
            </div>

            {/* Budget Overview */}
            <div style={{marginBottom: '32px'}}>
              <h4 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Budget Analysis</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
                <div style={{background: '#EFF6FF', padding: '16px', borderRadius: '8px'}}>
                  <div style={{fontSize: '12px', color: '#64748B', marginBottom: '4px'}}>Planned Budget</div>
                  <div style={{fontSize: '24px', fontWeight: '700', color: '#3B82F6'}}>
                    ${timelineItems.reduce((sum, item) => sum + item.planned_budget, 0).toLocaleString()}
                  </div>
                </div>
                <div style={{background: '#ECFDF5', padding: '16px', borderRadius: '8px'}}>
                  <div style={{fontSize: '12px', color: '#64748B', marginBottom: '4px'}}>Actual Spending</div>
                  <div style={{fontSize: '24px', fontWeight: '700', color: '#10B981'}}>
                    ${timelineItems.reduce((sum, item) => sum + item.actual_spending, 0).toLocaleString()}
                  </div>
                </div>
                <div style={{background: '#FEF3C7', padding: '16px', borderRadius: '8px'}}>
                  <div style={{fontSize: '12px', color: '#64748B', marginBottom: '4px'}}>Variance</div>
                  <div style={{fontSize: '24px', fontWeight: '700', color: '#F59E0B'}}>
                    ${Math.abs(timelineItems.reduce((sum, item) => sum + item.actual_spending, 0) - timelineItems.reduce((sum, item) => sum + item.planned_budget, 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{marginBottom: '32px'}}>
              <h4 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Progress by Category</h4>
              {categories.map(category => {
                const categoryItems = timelineItems.filter(item => item.category_id === category.id);
                const avgCompletion = categoryItems.length > 0 ? Math.round(categoryItems.reduce((sum, item) => sum + item.completion_percentage, 0) / categoryItems.length) : 0;
                
                return (
                  <div key={category.id} style={{marginBottom: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <span style={{fontWeight: '600', color: category.color}}>{category.name}</span>
                      <span style={{fontWeight: '600'}}>{avgCompletion}%</span>
                    </div>
                    <div style={{width: '100%', height: '16px', background: '#E5E7EB', borderRadius: '8px', overflow: 'hidden'}}>
                      <div style={{width: `${avgCompletion}%`, height: '100%', background: category.color, transition: 'width 0.3s ease'}} />
                    </div>
                    <div style={{fontSize: '12px', color: '#64748B', marginTop: '4px'}}>
                      {categoryItems.filter(i => i.status === 'completed').length} of {categoryItems.length} items completed
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Distribution */}
            <div style={{marginBottom: '32px'}}>
              <h4 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Status Distribution</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px'}}>
                {['not_started', 'in_progress', 'completed', 'on_hold', 'delayed'].map(status => {
                  const count = timelineItems.filter(i => i.status === status).length;
                  return (
                    <div key={status} style={{padding: '12px', background: getStatusColor(status as TimelineItem['status']) + '20', borderRadius: '8px', textAlign: 'center'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: getStatusColor(status as TimelineItem['status'])}}>{count}</div>
                      <div style={{fontSize: '11px', color: '#64748B', marginTop: '4px', textTransform: 'capitalize'}}>{status.replace('_', ' ')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowReportsModal(false)} style={{padding: '12px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE ITEM DETAILS MODAL (View & Check Checklist) */}
      {showItemDetailsModal && selectedItem && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => setShowItemDetailsModal(false)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1F2937'}}>{selectedItem.title}</h3>
            
            {/* Item Details */}
            <div style={{marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px'}}>
              <div style={{marginBottom: '12px'}}>
                <span style={{fontWeight: '600', color: '#64748B', fontSize: '14px'}}>Status: </span>
                <span style={{padding: '4px 12px', background: getStatusColor(selectedItem.status) + '20', color: getStatusColor(selectedItem.status), borderRadius: '12px', fontSize: '13px', fontWeight: '600'}}>
                  {selectedItem.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{marginBottom: '12px'}}>
                <span style={{fontWeight: '600', color: '#64748B', fontSize: '14px'}}>Timeline: </span>
                <span style={{fontSize: '14px'}}>{new Date(selectedItem.start_date).toLocaleDateString()} - {new Date(selectedItem.end_date).toLocaleDateString()}</span>
              </div>
              <div style={{marginBottom: '12px'}}>
                <span style={{fontWeight: '600', color: '#64748B', fontSize: '14px'}}>Budget: </span>
                <span style={{fontSize: '14px'}}>${selectedItem.actual_spending.toLocaleString()} / ${selectedItem.planned_budget.toLocaleString()}</span>
              </div>
              <div>
                <span style={{fontWeight: '600', color: '#64748B', fontSize: '14px'}}>Completion: </span>
                <span style={{fontSize: '14px', fontWeight: '700', color: '#3B82F6'}}>{selectedItem.completion_percentage}%</span>
              </div>
            </div>

            {/* Team Members */}
            {selectedItem.team_member_ids && selectedItem.team_member_ids.length > 0 && (
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>Assigned Team Members</h4>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  {selectedItem.team_member_ids.map(memberId => {
                    const member = availableTeamMembers.find(m => m.id === memberId);
                    return member ? (
                      <div key={memberId} style={{padding: '6px 12px', background: '#EFF6FF', color: '#3B82F6', borderRadius: '16px', fontSize: '13px', fontWeight: '500'}}>
                        {member.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Checklist with Checkboxes */}
            <div style={{marginBottom: '24px'}}>
              <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>Checklist ({loadedChecklistItems.filter(i => i.is_completed).length}/{loadedChecklistItems.length} completed)</h4>
              {loadedChecklistItems.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {loadedChecklistItems.map((item, idx) => (
                    <div key={item.id || idx} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: item.is_completed ? '#F3F4F6' : 'white', border: '2px solid #E5E7EB', borderRadius: '8px'}}>
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          try {
                            await supabase
                              .from('timeline_item_checklist')
                              .update({ 
                                is_completed: checked,
                                completed_at: checked ? new Date().toISOString() : null,
                                completed_by_id: checked ? parseInt(user?.id?.toString() || '0') : null
                              })
                              .eq('id', item.id);
                            
                            // Update local state
                            setLoadedChecklistItems(prev => 
                              prev.map(i => i.id === item.id ? {...i, is_completed: checked} : i)
                            );
                            
                            // Refresh timeline items to update completion percentage
                            fetchTimelineItems();
                          } catch (error) {
                            console.error('Error updating checklist item:', error);
                          }
                        }}
                        style={{width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0, accentColor: '#10B981'}}
                      />
                      <span style={{flex: 1, fontSize: '14px', color: item.is_completed ? '#9CA3AF' : '#374151', textDecoration: item.is_completed ? 'line-through' : 'none', fontWeight: item.is_completed ? '400' : '500'}}>
                        {idx + 1}. {item.item_text}
                      </span>
                      {item.is_completed && item.completed_at && (
                        <span style={{fontSize: '11px', color: '#10B981', fontWeight: '600'}}>
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{textAlign: 'center', color: '#9CA3AF', fontSize: '14px', padding: '20px', fontStyle: 'italic'}}>
                  No checklist items for this timeline item
                </p>
              )}
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowItemDetailsModal(false)} style={{padding: '12px 24px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Close</button>
              <button onClick={() => {setShowItemDetailsModal(false); setShowItemModal(true); setIsEditingItem(true);}} style={{padding: '12px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>Edit Item</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


