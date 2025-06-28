'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ContentCalendarItem {
  id: number;
  date: string;
  content_type: string;
  category: string;
  social_media: string;
  content_title: string;
  assigned_to: number[];
  content_deadline: string | null;
  graphic_deadline: string | null;
  status: string;
  description?: string;
  assignees?: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ContentCalendarMember {
  id: number;
  user_id: number;
  role: string;
  user: User;
}

const CONTENT_TYPES = [
  'Video Content',
  'Content',
  'Graphic',
  'Post',
  'Story',
  'Reel',
  'Live Stream',
  'Blog Post',
  'Infographic'
];

const CATEGORIES = [
  'Case Study',
  'Class Announcement',
  'Knowledge Sharing',
  'Event Announcement',
  'Engagement',
  'Demo Video',
  'My Day',
  'Posting Part of Lessons',
  'Scholarship',
  'Student Success',
  'Success Story',
  'Day Announcement',
  'Comic'
];

const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'YouTube',
  'Twitter'
];

const STATUS_OPTIONS = [
  'planning',
  'in_progress',
  'review',
  'completed'
];

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [contentItems, setContentItems] = useState<ContentCalendarItem[]>([]);
  const [calendarMembers, setCalendarMembers] = useState<ContentCalendarMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState('member');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentCalendarItem | null>(null);
  const [newItem, setNewItem] = useState({
    date: '',
    content_type: 'Content',
    category: 'Class Announcement',
    social_media: 'Facebook',
    content_title: '',
    assigned_to: [] as number[],
    content_deadline: '',
    graphic_deadline: '',
    description: '',
    status: 'planning'
  });

  // Access control check
  const checkAccess = async () => {
    if (!user?.id) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Check if user is a member of content calendar
      const { data: memberData, error: memberError } = await supabase
        .from('content_calendar_members')
        .select(`
          *,
          auth_user(id, name, email, role)
        `)
        .eq('user_id', user.id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (memberData) {
        setHasAccess(true);
        setUserRole(memberData.role);
      } else {
        // Check if user is admin/HR role
        if (user.role === 'admin' || user.role === 'hr') {
          setHasAccess(true);
          setUserRole('admin');
        } else {
          setHasAccess(false);
        }
      }
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Failed to check access permissions');
    }
  };

  // Fetch data
  const fetchData = async () => {
    if (!hasAccess || !user?.id) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Fetch content calendar items
      const { data: itemsData, error: itemsError } = await supabase
        .from('content_calendar')
        .select('*')
        .order('date', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch all users for assignee details
      const { data: usersData, error: usersError } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Fetch calendar members
      const { data: membersData, error: membersError } = await supabase
        .from('content_calendar_members')
        .select(`
          *,
          auth_user(id, name, email, role)
        `);

      if (membersError) throw membersError;

      // Enrich items with assignee details
      const enrichedItems = (itemsData || []).map(item => {
        const assignees = (item.assigned_to || [])
          .map((userId: number) => usersData?.find(user => user.id === userId))
          .filter(Boolean);
        
        const createdBy = usersData?.find(user => user.id === item.created_by_id) || {
          id: 0,
          name: 'Unknown User',
          email: '',
          role: 'member'
        };

        return {
          ...item,
          assignees,
          created_by: createdBy
        };
      });

      const transformedMembers = (membersData || []).map(member => ({
        ...member,
        user: member.auth_user
      }));

      setContentItems(enrichedItems);
      setCalendarMembers(transformedMembers);
      setAllUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load content calendar data');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    checkAccess();
  }, [isAuthenticated, authLoading, user?.id, router]);

  useEffect(() => {
    if (hasAccess) {
      fetchData().finally(() => setIsLoading(false));
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [hasAccess, user?.id]);

  // Create content item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('content_calendar')
        .insert([{
          ...newItem,
          assigned_to: newItem.assigned_to.length > 0 ? newItem.assigned_to : null,
          content_deadline: newItem.content_deadline || null,
          graphic_deadline: newItem.graphic_deadline || null,
          description: newItem.description || null,
          created_by_id: user.id
        }])
        .select();

      if (error) throw error;

      await fetchData();
      
      setNewItem({
        date: '',
        content_type: 'Content',
        category: 'Class Announcement',
        social_media: 'Facebook',
        content_title: '',
        assigned_to: [],
        content_deadline: '',
        graphic_deadline: '',
        description: '',
        status: 'planning'
      });
      setShowCreateForm(false);
      setError('');
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create content item');
    }
  };

  // Update content item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('content_calendar')
        .update({
          date: newItem.date,
          content_type: newItem.content_type,
          category: newItem.category,
          social_media: newItem.social_media,
          content_title: newItem.content_title,
          assigned_to: newItem.assigned_to.length > 0 ? newItem.assigned_to : null,
          content_deadline: newItem.content_deadline || null,
          graphic_deadline: newItem.graphic_deadline || null,
          description: newItem.description || null,
          status: newItem.status
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      await fetchData();
      setEditingItem(null);
      setShowCreateForm(false);
      setError('');
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update content item');
    }
  };

  // Delete content item
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchData();
      setError('');
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete content item');
    }
  };

  // Add member to content calendar
  const handleAddMember = async (userId: number, role: string) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('content_calendar_members')
        .insert([{
          user_id: userId,
          role: role
        }]);

      if (error) throw error;

      await fetchData();
      setShowMemberForm(false);
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member');
    }
  };

  // Remove member from content calendar
  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('content_calendar_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchData();
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
    }
  };

  const handleEditItem = (item: ContentCalendarItem) => {
    setEditingItem(item);
    setNewItem({
      date: item.date,
      content_type: item.content_type,
      category: item.category,
      social_media: item.social_media,
      content_title: item.content_title,
      assigned_to: item.assigned_to || [],
      content_deadline: item.content_deadline || '',
      graphic_deadline: item.graphic_deadline || '',
      description: item.description || '',
      status: item.status
    });
    setShowCreateForm(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#000000';
      case 'review': return '#666666';
      case 'in_progress': return '#999999';
      default: return '#cccccc';
    }
  };

  const isAdmin = userRole === 'admin';

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#ffffff'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #cccccc', 
          borderTop: '3px solid #000000', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div style={{ 
        padding: '2rem', 
        maxWidth: '600px', 
        margin: '0 auto',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#ffffff'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#000000'
        }}>
          Access Denied
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666666', 
          marginBottom: '2rem'
        }}>
          You don't have permission to access the Content Calendar.
          Please contact an administrator to request access.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '1rem 2rem',
            background: '#000000',
            color: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#000000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#000000';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      background: '#ffffff', 
      minHeight: '100vh'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .content-calendar-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 2px solid #000000;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .content-calendar-table th,
          .content-calendar-table td {
            padding: 0.75rem;
            text-align: left;
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.85rem;
            vertical-align: top;
          }
          
          .content-calendar-table th {
            background: #000000;
            color: #ffffff;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.75rem;
          }
          
          .content-calendar-table th:last-child,
          .content-calendar-table td:last-child {
            border-right: none;
          }
          
          .content-calendar-table tr:last-child td {
            border-bottom: none;
          }
          
          .content-calendar-table tbody tr:hover {
            background: #f9fafb;
          }
          
          .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border: 1px solid;
            display: inline-block;
          }
          
          .assignee-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          
          .assignee-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #000000;
            color: #ffffff;
            border: 1px solid #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: 600;
          }
          
          .action-btn {
            padding: 0.5rem;
            border: 1px solid #000000;
            border-radius: 4px;
            background: #ffffff;
            color: #000000;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-right: 0.5rem;
          }
          
          .action-btn:hover {
            background: #000000;
            color: #ffffff;
          }
          
          .action-btn.delete:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
          
          .btn {
            padding: 0.75rem 1.5rem;
            border: 2px solid #000000;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .btn-primary {
            background: #000000;
            color: #ffffff;
          }
          
          .btn-primary:hover {
            background: #ffffff;
            color: #000000;
          }
          
          .btn-secondary {
            background: #ffffff;
            color: #000000;
          }
          
          .btn-secondary:hover {
            background: #000000;
            color: #ffffff;
          }
          
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .modal-content {
            background: #ffffff;
            border: 3px solid #000000;
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .form-group {
            margin-bottom: 1rem;
          }
          
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .form-input,
          .form-select,
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 6px;
            font-size: 0.9rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          
          .form-input:focus,
          .form-select:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          
          .checkbox-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            max-height: 200px;
            overflow-y: auto;
            border: 2px solid #000000;
            border-radius: 6px;
            padding: 1rem;
          }
          
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .checkbox-item input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #000000;
          }
        `
      }} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        borderBottom: '2px solid #000000',
        paddingBottom: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            margin: '0',
            color: '#000000'
          }}>
            Content Calendar
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#666666', 
            margin: '0.5rem 0 0 0'
          }}>
            Manage your social media content planning and scheduling
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAdmin && (
            <button
              onClick={() => setShowMemberForm(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlusIcon style={{ width: '16px', height: '16px' }} />
              Manage Members
            </button>
          )}
          
          <button
            onClick={() => {
              setEditingItem(null);
              setNewItem({
                date: '',
                content_type: 'Content',
                category: 'Class Announcement',
                social_media: 'Facebook',
                content_title: '',
                assigned_to: [],
                content_deadline: '',
                graphic_deadline: '',
                description: '',
                status: 'planning'
              });
              setShowCreateForm(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            Add Content
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '2px solid #dc2626', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1rem',
          color: '#dc2626',
          fontWeight: '600'
        }}>
          {error}
        </div>
      )}

      {/* Members Info */}
      <div style={{ 
        background: '#f9fafb', 
        border: '2px solid #000000', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          margin: '0 0 0.5rem 0',
          color: '#000000'
        }}>
          Team Members ({calendarMembers.length})
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {calendarMembers.map(member => (
            <span
              key={member.id}
              style={{
                padding: '0.25rem 0.5rem',
                background: member.role === 'admin' ? '#000000' : '#ffffff',
                color: member.role === 'admin' ? '#ffffff' : '#000000',
                border: '1px solid #000000',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              {member.user.name} ({member.role})
            </span>
          ))}
        </div>
      </div>

      {/* Content Calendar Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="content-calendar-table">
          <thead>
            <tr>
              <th style={{ minWidth: '100px' }}>Date</th>
              <th style={{ minWidth: '120px' }}>Content Type</th>
              <th style={{ minWidth: '120px' }}>Category</th>
              <th style={{ minWidth: '100px' }}>Social Media</th>
              <th style={{ minWidth: '200px' }}>Content Title</th>
              <th style={{ minWidth: '120px' }}>Assigned To</th>
              <th style={{ minWidth: '120px' }}>Content Deadline</th>
              <th style={{ minWidth: '120px' }}>Graphic Deadline</th>
              <th style={{ minWidth: '100px' }}>Status</th>
              <th style={{ minWidth: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contentItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: '#666666',
                  fontStyle: 'italic'
                }}>
                  No content items found. Create your first content item to get started.
                </td>
              </tr>
            ) : (
              contentItems.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#f3f4f6',
                      border: '1px solid #000000',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {item.content_type}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#ffffff',
                      border: '1px solid #666666',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#f9fafb',
                      border: '1px solid #000000',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {item.social_media}
                    </span>
                  </td>
                  <td style={{ 
                    fontWeight: '600',
                    color: '#000000',
                    maxWidth: '200px',
                    wordWrap: 'break-word'
                  }}>
                    {item.content_title}
                  </td>
                  <td>
                    <div className="assignee-list">
                      {item.assignees && item.assignees.length > 0 ? (
                        item.assignees.map(assignee => (
                          <div
                            key={assignee.id}
                            className="assignee-avatar"
                            title={assignee.name}
                          >
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                        ))
                      ) : (
                        <span style={{ 
                          color: '#666666', 
                          fontStyle: 'italic',
                          fontSize: '0.75rem'
                        }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CalendarIcon style={{ width: '14px', height: '14px', color: '#666666' }} />
                      <span style={{ fontSize: '0.75rem' }}>
                        {formatDate(item.content_deadline)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ClockIcon style={{ width: '14px', height: '14px', color: '#666666' }} />
                      <span style={{ fontSize: '0.75rem' }}>
                        {formatDate(item.graphic_deadline)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{
                        backgroundColor: '#ffffff',
                        color: getStatusColor(item.status),
                        borderColor: getStatusColor(item.status)
                      }}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="action-btn"
                        title="Edit"
                      >
                        <PencilIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                      
                      {(isAdmin || item.created_by.id === user?.id) && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="action-btn delete"
                          title="Delete"
                        >
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: '#000000'
            }}>
              {editingItem ? 'Edit Content Item' : 'Create New Content Item'}
            </h2>

            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Content Type *</label>
                  <select
                    className="form-select"
                    value={newItem.content_type}
                    onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value })}
                    required
                  >
                    {CONTENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    required
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Social Media *</label>
                  <select
                    className="form-select"
                    value={newItem.social_media}
                    onChange={(e) => setNewItem({ ...newItem, social_media: e.target.value })}
                    required
                  >
                    {SOCIAL_MEDIA_PLATFORMS.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Content Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newItem.content_deadline}
                    onChange={(e) => setNewItem({ ...newItem, content_deadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Graphic Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newItem.graphic_deadline}
                    onChange={(e) => setNewItem({ ...newItem, graphic_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Content Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.content_title}
                  onChange={(e) => setNewItem({ ...newItem, content_title: e.target.value })}
                  placeholder="Enter content title..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <div className="checkbox-group">
                  {calendarMembers.map(member => (
                    <div key={member.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newItem.assigned_to.includes(member.user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewItem({
                              ...newItem,
                              assigned_to: [...newItem.assigned_to, member.user.id]
                            });
                          } else {
                            setNewItem({
                              ...newItem,
                              assigned_to: newItem.assigned_to.filter(id => id !== member.user.id)
                            });
                          }
                        }}
                      />
                      <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                        {member.user.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Additional details about the content..."
                  rows={3}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '2px solid #000000'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingItem ? 'Update Content' : 'Create Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberForm && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowMemberForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: '#000000'
            }}>
              Manage Content Calendar Members
            </h2>

            {/* Current Members */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#000000'
              }}>
                Current Members
              </h3>
              
              {calendarMembers.length === 0 ? (
                <p style={{ color: '#666666', fontStyle: 'italic' }}>
                  No members found.
                </p>
              ) : (
                <div style={{ 
                  border: '2px solid #000000', 
                  borderRadius: '8px', 
                  overflow: 'hidden'
                }}>
                  {calendarMembers.map(member => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#ffffff'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#000000' }}>
                          {member.user.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                          {member.user.email} • {member.role}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="action-btn delete"
                        title="Remove member"
                      >
                        <XMarkIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Members */}
            <div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#000000'
              }}>
                Add New Members
              </h3>
              
              <div style={{ 
                border: '2px solid #000000', 
                borderRadius: '8px', 
                overflow: 'hidden',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {allUsers
                  .filter(user => !calendarMembers.some(member => member.user.id === user.id))
                  .map(user => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#ffffff'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#000000' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                          {user.email} • {user.role}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleAddMember(user.id, 'member')}
                          className="action-btn"
                          title="Add as member"
                        >
                          Member
                        </button>
                        <button
                          onClick={() => handleAddMember(user.id, 'admin')}
                          className="action-btn"
                          title="Add as admin"
                        >
                          Admin
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '2px solid #000000'
            }}>
              <button
                onClick={() => setShowMemberForm(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 