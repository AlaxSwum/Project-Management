'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  buildHierarchyTree,
  getSubordinateIds,
  isManagerOf,
  wouldCreateCycle,
  type HierarchyMember,
  type TreeNode,
} from '@/lib/hierarchy-utils';
import {
  XMarkIcon,
  TrashIcon,
  UserPlusIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  ChevronDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface DeptMember extends HierarchyMember {}

export default function DepartmentViewPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.id);
  const deptId = Number(params?.deptId);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [members, setMembers] = useState<DeptMember[]>([]);
  const [userCompanyRole, setUserCompanyRole] = useState<string | null>(null);
  const [deptCreatedBy, setDeptCreatedBy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberReportsTo, setMemberReportsTo] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline edit role
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleValue, setEditRoleValue] = useState('');

  // Assign manager modal
  const [showAssignManager, setShowAssignManager] = useState(false);
  const [selectedMemberForManager, setSelectedMemberForManager] = useState<DeptMember | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);

  // Collapsed nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());

  // Drag and drop
  const [draggedMemberId, setDraggedMemberId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin';
  const isDeptCreator = deptCreatedBy !== null && user?.id === deptCreatedBy;
  const canManage = isAdmin || userCompanyRole === 'admin' || userCompanyRole === 'manager' || isDeptCreator;

  // Find the current user's department member record
  const currentUserMember = members.find((m) => m.user_id === user?.id);

  // Access control: which members can this user see?
  const getVisibleMembers = useCallback((): DeptMember[] => {
    if (!user) return [];
    // Admins, company admin/manager, dept creator see all
    if (isAdmin || userCompanyRole === 'admin' || userCompanyRole === 'manager' || isDeptCreator) {
      return members;
    }
    // Department managers see self + subordinates
    if (currentUserMember) {
      const subordinateUserIds = getSubordinateIds(members, currentUserMember.id);
      if (subordinateUserIds.length > 0) {
        return members.filter(
          (m) => m.user_id === user.id || subordinateUserIds.includes(m.user_id)
        );
      }
      // Regular member: only self
      return members.filter((m) => m.user_id === user.id);
    }
    return [];
  }, [user, isAdmin, userCompanyRole, isDeptCreator, members, currentUserMember]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch company name, department info, and user's company role in parallel
      const [companyRes, deptRes, membershipRes] = await Promise.all([
        supabase.from('org_companies').select('name').eq('id', companyId).single(),
        supabase.from('org_departments').select('name, created_by').eq('id', deptId).single(),
        supabase.from('org_company_members').select('role').eq('company_id', companyId).eq('user_id', user.id).single(),
      ]);

      setCompanyName(companyRes.data?.name || '');
      setDeptName(deptRes.data?.name || '');
      setDeptCreatedBy(deptRes.data?.created_by || null);
      setUserCompanyRole(membershipRes.data?.role || null);

      // Fetch department members (including manager_id)
      const { data: memberData } = await supabase
        .from('org_department_members')
        .select('*')
        .eq('department_id', deptId);
      const memberList = memberData || [];

      // Get user details
      const userIds = memberList.map((m: any) => m.user_id);
      let usersMap: Record<number, any> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('auth_user')
          .select('id, name, email')
          .in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = u;
        });
      }

      setMembers(
        memberList.map((m: any) => ({
          ...m,
          manager_id: m.manager_id || null,
          user_name: usersMap[m.user_id]?.name || 'Unknown',
          user_email: usersMap[m.user_id]?.email || '',
        }))
      );
    } catch (err) {
      console.error('Error fetching department data:', err);
    }
    setLoading(false);
  }, [user, companyId, deptId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const searchUserByEmail = async (email: string) => {
    setMemberEmail(email);
    if (email.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('auth_user')
        .select('id, name, email')
        .ilike('email', `%${email.trim()}%`)
        .eq('is_active', true)
        .limit(5);
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const handleAddMember = async (userId: number) => {
    setSaving(true);
    try {
      // Auto-add to company members if not already there
      const { data: existing } = await supabase
        .from('org_company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .single();
      if (!existing) {
        await supabase.from('org_company_members').insert({
          company_id: companyId,
          user_id: userId,
          role: 'member',
        });
      }

      const { error } = await supabase.from('org_department_members').insert({
        department_id: deptId,
        user_id: userId,
        role: memberRole,
        manager_id: memberReportsTo || null,
      });
      if (error) {
        if (error.code === '23505') alert('User is already in this department');
        else throw error;
      } else {
        setMemberEmail('');
        setSearchResults([]);
        setMemberRole('member');
        setMemberReportsTo(null);
        setShowAddMember(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add member');
    }
    setSaving(false);
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Remove this member from the department?')) return;
    try {
      await supabase.from('org_department_members').delete().eq('id', memberId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to remove member');
    }
  };

  const handleSaveRole = async (memberId: number) => {
    if (!editRoleValue.trim()) return;
    try {
      await supabase
        .from('org_department_members')
        .update({ role: editRoleValue.trim() })
        .eq('id', memberId);
      setEditingRoleId(null);
      setEditRoleValue('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedMemberForManager) return;
    try {
      await supabase
        .from('org_department_members')
        .update({ manager_id: selectedManagerId || null })
        .eq('id', selectedMemberForManager.id);
      setShowAssignManager(false);
      setSelectedMemberForManager(null);
      setSelectedManagerId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign manager');
    }
  };

  const openAssignManager = (member: DeptMember) => {
    setSelectedMemberForManager(member);
    setSelectedManagerId(member.manager_id);
    setShowAssignManager(true);
  };

  const toggleCollapse = (nodeId: number) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // Drag and drop: assign manager on drop
  const handleDrop = async (targetMemberId: number) => {
    if (!draggedMemberId || draggedMemberId === targetMemberId) {
      setDraggedMemberId(null);
      setDropTargetId(null);
      return;
    }
    // Check for cycle
    if (wouldCreateCycle(members, draggedMemberId, targetMemberId)) {
      alert('Cannot assign: this would create a circular hierarchy.');
      setDraggedMemberId(null);
      setDropTargetId(null);
      return;
    }
    try {
      await supabase
        .from('org_department_members')
        .update({ manager_id: targetMemberId })
        .eq('id', draggedMemberId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign manager');
    }
    setDraggedMemberId(null);
    setDropTargetId(null);
  };

  // Get eligible managers for dropdown (excluding self and those that would create cycles)
  const getEligibleManagers = (member: DeptMember): DeptMember[] => {
    return members.filter(
      (m) => m.id !== member.id && !wouldCreateCycle(members, member.id, m.id)
    );
  };

  // Render a single tree row
  const renderTreeNode = (node: TreeNode, depth: number, isLast: boolean) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isRoot = depth === 0;
    const avatarGradient = isRoot
      ? 'linear-gradient(135deg, #10B981, #059669)'
      : 'linear-gradient(135deg, #8B5CF6, #EC4899)';

    const isDragging = draggedMemberId === node.id;
    const isDropTarget = dropTargetId === node.id && draggedMemberId !== node.id;

    return (
      <React.Fragment key={node.id}>
        <div
          draggable={canManage}
          onDragStart={(e) => {
            if (!canManage) return;
            setDraggedMemberId(node.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDraggedMemberId(null);
            setDropTargetId(null);
          }}
          onDragOver={(e) => {
            if (!canManage || !draggedMemberId || draggedMemberId === node.id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDropTargetId(node.id);
          }}
          onDragLeave={() => {
            if (dropTargetId === node.id) setDropTargetId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!canManage) return;
            handleDrop(node.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1.25rem',
            paddingLeft: `${1.25 + depth * 2}rem`,
            borderBottom: '1px solid #2D2D2D',
            cursor: canManage ? 'grab' : 'pointer',
            transition: 'background 0.15s, outline 0.15s, opacity 0.15s',
            position: 'relative',
            opacity: isDragging ? 0.4 : 1,
            outline: isDropTarget ? '2px solid #3B82F6' : 'none',
            outlineOffset: '-2px',
            background: isDropTarget ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isDropTarget) e.currentTarget.style.background = '#141414';
          }}
          onMouseLeave={(e) => {
            if (!isDropTarget) e.currentTarget.style.background = 'transparent';
          }}
          onClick={() => {
            if (draggedMemberId) return; // don't navigate during drag
            router.push(`/company/${companyId}/department/${deptId}/member/${node.user_id}`);
          }}
        >
          {/* Connector lines */}
          {depth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${depth * 2}rem`,
                top: 0,
                bottom: isLast ? '50%' : 0,
                width: '1px',
                background: '#3D3D3D',
              }}
            />
          )}
          {depth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${depth * 2}rem`,
                top: '50%',
                width: '1rem',
                height: '1px',
                background: '#3D3D3D',
              }}
            />
          )}

          {/* Expand/collapse toggle */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              style={{
                padding: '0.125rem',
                background: 'none',
                border: 'none',
                color: '#71717A',
                cursor: 'pointer',
                marginRight: '0.5rem',
                transition: 'transform 0.2s',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              }}
            >
              <ChevronDownIcon style={{ width: '14px', height: '14px' }} />
            </button>
          )}
          {!hasChildren && <div style={{ width: '22px', marginRight: '0.5rem' }} />}

          {/* Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: avatarGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              flexShrink: 0,
              marginRight: '0.75rem',
            }}
          >
            {node.user_name?.charAt(0).toUpperCase() || '?'}
          </div>

          {/* Name & email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>
                {node.user_name}
              </span>
              {hasChildren && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: '#71717A',
                    background: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '0.25rem',
                    padding: '0 0.375rem',
                  }}
                >
                  {node.children.length} report{node.children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span style={{ color: '#71717A', fontSize: '0.75rem' }}>{node.user_email}</span>
          </div>

          {/* Role */}
          <div style={{ marginRight: '1rem' }} onClick={(e) => e.stopPropagation()}>
            {editingRoleId === node.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <input
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRole(node.id);
                    if (e.key === 'Escape') setEditingRoleId(null);
                  }}
                  autoFocus
                  style={{
                    padding: '0.375rem 0.5rem',
                    background: '#141414',
                    border: '1px solid #3B82F6',
                    borderRadius: '0.375rem',
                    color: '#FFFFFF',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    width: '140px',
                  }}
                />
                <button
                  onClick={() => handleSaveRole(node.id)}
                  style={{
                    padding: '0.25rem',
                    background: 'none',
                    border: 'none',
                    color: '#10B981',
                    cursor: 'pointer',
                  }}
                >
                  <CheckIcon style={{ width: '16px', height: '16px' }} />
                </button>
                <button
                  onClick={() => setEditingRoleId(null)}
                  style={{
                    padding: '0.25rem',
                    background: 'none',
                    border: 'none',
                    color: '#71717A',
                    cursor: 'pointer',
                  }}
                >
                  <XMarkIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    color: '#A1A1AA',
                    fontSize: '0.8125rem',
                    padding: '0.25rem 0.625rem',
                    background: '#141414',
                    borderRadius: '0.375rem',
                    border: '1px solid #2D2D2D',
                  }}
                >
                  {node.role}
                </span>
                {canManage && (
                  <button
                    onClick={() => {
                      setEditingRoleId(node.id);
                      setEditRoleValue(node.role);
                    }}
                    style={{
                      padding: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: '#71717A',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#3B82F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                  >
                    <PencilIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {canManage && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => openAssignManager(node)}
                style={{
                  padding: '0.375rem',
                  background: 'none',
                  border: 'none',
                  color: '#71717A',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#3B82F6')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                title="Assign Manager"
              >
                <UserGroupIcon style={{ width: '16px', height: '16px' }} />
              </button>
              <button
                onClick={() => handleRemoveMember(node.id)}
                style={{
                  padding: '0.375rem',
                  background: 'none',
                  border: 'none',
                  color: '#71717A',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                title="Remove from department"
              >
                <TrashIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren &&
          !isCollapsed &&
          node.children.map((child, idx) =>
            renderTreeNode(child, depth + 1, idx === node.children.length - 1)
          )}
      </React.Fragment>
    );
  };

  if (authLoading || !user || loading) {
    return (
      <div
        style={{
          background: '#0D0D0D',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A1A1AA',
          fontFamily: 'Mabry Pro, sans-serif',
        }}
      >
        Loading...
      </div>
    );
  }

  const visibleMembers = getVisibleMembers();
  const tree = buildHierarchyTree(visibleMembers);
  const eligibleManagers = selectedMemberForManager
    ? getEligibleManagers(selectedMemberForManager)
    : [];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0D0D0D',
        fontFamily: 'Mabry Pro, sans-serif',
      }}
    >
      <Sidebar />
      <main
        className="page-main"
        style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/company"
            style={{ color: '#71717A', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
          >
            Company
          </Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link
            href={`/company/${companyId}`}
            style={{ color: '#71717A', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
          >
            {companyName}
          </Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>{deptName}</span>
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {deptName}
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
              {visibleMembers.length < members.length &&
                ` (showing ${visibleMembers.length})`}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setMemberEmail('');
                setMemberRole('member');
                setMemberReportsTo(null);
                setSearchResults([]);
                setShowAddMember(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
            >
              <UserPlusIcon style={{ width: '16px', height: '16px' }} /> Add Employee
            </button>
          )}
        </div>

        {/* Drag hint */}
        {canManage && members.length > 1 && (
          <p style={{ color: '#52525B', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Drag and drop an employee onto another to assign them as their manager.
          </p>
        )}

        {/* Drop zone: make top-level */}
        {canManage && draggedMemberId && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = '#3D3D3D';
              e.currentTarget.style.background = 'transparent';
            }}
            onDrop={async (e) => {
              e.preventDefault();
              if (!draggedMemberId) return;
              try {
                await supabase
                  .from('org_department_members')
                  .update({ manager_id: null })
                  .eq('id', draggedMemberId);
                fetchData();
              } catch (err) {
                console.error(err);
              }
              setDraggedMemberId(null);
              setDropTargetId(null);
            }}
            style={{
              padding: '0.75rem',
              marginBottom: '0.75rem',
              border: '2px dashed #3D3D3D',
              borderRadius: '0.75rem',
              textAlign: 'center',
              color: '#71717A',
              fontSize: '0.8125rem',
              transition: 'all 0.15s',
            }}
          >
            Drop here to make top-level (no manager)
          </div>
        )}

        {/* Hierarchy Tree */}
        <div
          style={{
            background: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '1rem',
            overflow: 'hidden',
          }}
        >
          {visibleMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A' }}>
              {members.length === 0
                ? 'No employees in this department yet'
                : 'You do not have access to view other members'}
            </div>
          ) : (
            <div>
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #2D2D2D',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: '#71717A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Employee
                </span>
                <span
                  style={{
                    color: '#71717A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginRight: '1rem',
                  }}
                >
                  Role
                </span>
                {canManage && (
                  <span
                    style={{
                      color: '#71717A',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '70px',
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </span>
                )}
              </div>

              {/* Tree rows */}
              {tree.map((rootNode, idx) =>
                renderTreeNode(rootNode, 0, idx === tree.length - 1)
              )}
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
            onClick={() => setShowAddMember(false)}
          >
            <div
              style={{
                background: '#1A1A1A',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '420px',
                maxWidth: '90vw',
                border: '1px solid #2D2D2D',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <h3
                  style={{
                    color: '#FFFFFF',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Add Employee
                </h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717A',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Email search */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#A1A1AA',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Search by Email
                </label>
                <input
                  value={memberEmail}
                  onChange={(e) => searchUserByEmail(e.target.value)}
                  placeholder="Type email to search..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')}
                />
              </div>

              {/* Role */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#A1A1AA',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Role (free text)
                </label>
                <input
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="e.g. Designer, Engineer, Lead..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3D3D3D')}
                />
              </div>

              {/* Reports To dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#A1A1AA',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Reports To
                </label>
                <select
                  value={memberReportsTo ?? ''}
                  onChange={(e) =>
                    setMemberReportsTo(e.target.value ? Number(e.target.value) : null)
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">None (top-level)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search results */}
              {searching && (
                <div style={{ color: '#71717A', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
                  Searching...
                </div>
              )}
              {searchResults.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        background: '#141414',
                        borderRadius: '0.5rem',
                        border: '1px solid #2D2D2D',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {u.name}
                        </div>
                        <div style={{ color: '#71717A', fontSize: '0.75rem' }}>{u.email}</div>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        disabled={saving}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: '#10B981',
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? '...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {memberEmail.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <div style={{ color: '#71717A', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assign Manager Modal */}
        {showAssignManager && selectedMemberForManager && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
            onClick={() => setShowAssignManager(false)}
          >
            <div
              style={{
                background: '#1A1A1A',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '420px',
                maxWidth: '90vw',
                border: '1px solid #2D2D2D',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <h3
                  style={{
                    color: '#FFFFFF',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Assign Manager
                </h3>
                <button
                  onClick={() => setShowAssignManager(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717A',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <p
                style={{
                  color: '#A1A1AA',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                Select who <strong style={{ color: '#FFFFFF' }}>{selectedMemberForManager.user_name}</strong> reports to:
              </p>

              <select
                value={selectedManagerId ?? ''}
                onChange={(e) =>
                  setSelectedManagerId(e.target.value ? Number(e.target.value) : null)
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#141414',
                  border: '1px solid #3D3D3D',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '1.25rem',
                }}
              >
                <option value="">None (top-level)</option>
                {eligibleManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user_name} ({m.role})
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAssignManager(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#A1A1AA',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignManager}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: '#3B82F6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2563EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#3B82F6')}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
