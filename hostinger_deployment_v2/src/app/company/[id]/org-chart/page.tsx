'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  buildHierarchyTree,
  type HierarchyMember,
  type TreeNode,
} from '@/lib/hierarchy-utils';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface DeptInfo {
  id: number;
  name: string;
  description: string;
  member_count: number;
}

interface Responsibility {
  id: number;
  content: string;
}

interface MemberDetail {
  user_name: string;
  user_email: string;
  dept_role: string;
  company_role: string;
  department_name: string;
  manager_name: string | null;
  responsibilities: Responsibility[];
  direct_reports: string[];
}

export default function OrgChartPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = Number(params?.id);
  const { user, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [departments, setDepartments] = useState<DeptInfo[]>([]);
  const [deptMembers, setDeptMembers] = useState<Record<number, HierarchyMember[]>>({});
  const [deptTrees, setDeptTrees] = useState<Record<number, TreeNode[]>>({});
  const [loading, setLoading] = useState(true);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Member detail modal
  const [selectedMember, setSelectedMember] = useState<HierarchyMember | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch company
      const { data: companyData } = await supabase.from('org_companies').select('name').eq('id', companyId).single();
      setCompanyName(companyData?.name || '');

      // Fetch all departments
      const { data: deptData } = await supabase.from('org_departments').select('*').eq('company_id', companyId).order('created_at', { ascending: true });
      const deptList = deptData || [];

      // Fetch all department members across all departments
      const deptIds = deptList.map((d: any) => d.id);
      if (deptIds.length === 0) {
        setDepartments([]);
        setLoading(false);
        return;
      }

      const { data: allDeptMembers } = await supabase
        .from('org_department_members')
        .select('*')
        .in('department_id', deptIds);

      // Get all user IDs
      const allUserIds = [...new Set((allDeptMembers || []).map((m: any) => m.user_id))];
      let usersMap: Record<number, any> = {};
      if (allUserIds.length > 0) {
        const { data: users } = await supabase.from('auth_user').select('id, name, email, position').in('id', allUserIds);
        (users || []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      // Group members by department and build trees
      const membersByDept: Record<number, HierarchyMember[]> = {};
      const treesByDept: Record<number, TreeNode[]> = {};
      const countMap: Record<number, number> = {};

      for (const dept of deptList) {
        const deptMemberList = (allDeptMembers || []).filter((m: any) => m.department_id === dept.id);
        const enriched: HierarchyMember[] = deptMemberList.map((m: any) => ({
          ...m,
          manager_id: m.manager_id || null,
          user_name: usersMap[m.user_id]?.name || 'Unknown',
          user_email: usersMap[m.user_id]?.email || '',
          position: usersMap[m.user_id]?.position || null,
        }));
        membersByDept[dept.id] = enriched;
        treesByDept[dept.id] = buildHierarchyTree(enriched);
        countMap[dept.id] = enriched.length;
      }

      setDeptMembers(membersByDept);
      setDeptTrees(treesByDept);
      setDepartments(deptList.map((d: any) => ({ ...d, member_count: countMap[d.id] || 0 })));
    } catch (err) {
      console.error('Error fetching org chart data:', err);
    }
    setLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const toggleCollapse = (key: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Fetch member detail on click
  const handleMemberClick = async (member: HierarchyMember, deptId: number) => {
    setSelectedMember(member);
    setLoadingDetail(true);
    try {
      const dept = departments.find((d) => d.id === deptId);
      const allMembers = deptMembers[deptId] || [];

      // Get company role
      const { data: companyMembership } = await supabase
        .from('org_company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', member.user_id)
        .single();

      // Get responsibilities
      const { data: respData } = await supabase
        .from('org_member_responsibilities')
        .select('id, content')
        .eq('department_id', deptId)
        .eq('user_id', member.user_id)
        .order('created_at', { ascending: true });

      // Get manager name
      let managerName: string | null = null;
      if (member.manager_id) {
        const managerRow = allMembers.find((m) => m.id === member.manager_id);
        if (managerRow) managerName = managerRow.user_name;
      }

      // Get direct reports
      const directReports = allMembers
        .filter((m) => m.manager_id === member.id)
        .map((m) => m.user_name);

      setMemberDetail({
        user_name: member.user_name,
        user_email: member.user_email,
        dept_role: member.role,
        company_role: companyMembership?.role || 'member',
        department_name: dept?.name || '',
        manager_name: managerName,
        responsibilities: respData || [],
        direct_reports: directReports,
      });
    } catch (err) {
      console.error('Error fetching member detail:', err);
    }
    setLoadingDetail(false);
  };

  // Colors for department headers
  const deptColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#F97316'];

  // Render a single tree node recursively
  const renderNode = (node: TreeNode, deptId: number, deptColor: string, depth: number = 0, isLast: boolean = true) => {
    const nodeKey = `${deptId}-${node.id}`;
    const isCollapsed = collapsedNodes.has(nodeKey);
    const hasChildren = node.children.length > 0;
    const roleColor = node.role === 'admin' || node.role === 'manager' || node.role === 'lead'
      ? deptColor : '#71717A';

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Node card */}
        <div
          onClick={() => handleMemberClick(node, deptId)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.875rem',
            background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem',
            cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px', maxWidth: '220px',
            position: 'relative',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = deptColor; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFF', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
          }}>
            {node.user_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.user_name}
            </div>
            <div style={{ color: roleColor, fontSize: '0.6875rem', fontWeight: 500 }}>
              {node.position || node.role}
            </div>
          </div>
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleCollapse(nodeKey); }}
              style={{ padding: '0.125rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', flexShrink: 0, lineHeight: 0 }}
            >
              <ChevronDownIcon style={{
                width: '14px', height: '14px',
                transition: 'transform 0.2s',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              }} />
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <>
            {/* Vertical line down from parent */}
            <div style={{ width: '2px', height: '20px', background: '#2D2D2D' }} />

            {node.children.length === 1 ? (
              // Single child - straight line
              renderNode(node.children[0], deptId, deptColor, depth + 1, true)
            ) : (
              // Multiple children - horizontal connector
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Horizontal line */}
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {node.children.map((child, idx) => (
                    <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {/* Horizontal connector piece */}
                      <div style={{
                        height: '2px', background: '#2D2D2D',
                        position: 'absolute', top: 0,
                        left: idx === 0 ? '50%' : 0,
                        right: idx === node.children.length - 1 ? '50%' : 0,
                      }} />
                      {/* Vertical line down to child */}
                      <div style={{ width: '2px', height: '20px', background: '#2D2D2D' }} />
                      <div style={{ padding: '0 0.5rem' }}>
                        {renderNode(child, deptId, deptColor, depth + 1, idx === node.children.length - 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (authLoading || !user || loading) {
    return <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontFamily: 'Mabry Pro, sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Mabry Pro, sans-serif' }}>
      <Sidebar />
      <main className="page-main" style={{ flex: 1, marginLeft: '280px', padding: '2rem', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href="/company" style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>Company</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <Link href={`/company/${companyId}`} style={{ color: '#71717A', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}>{companyName}</Link>
          <ChevronRightIcon style={{ width: '14px', height: '14px', color: '#52525B' }} />
          <span style={{ color: '#FFFFFF' }}>Org Chart</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Organization Chart</h1>
            <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.25rem' }}>{companyName} — {departments.length} department{departments.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => router.push(`/company/${companyId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
          >
            <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
            Back
          </button>
        </div>

        {/* Org Chart Container */}
        <div style={{ overflowX: 'auto', paddingBottom: '2rem' }}>
          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717A' }}>
              <p>No departments found. Create departments to see the org chart.</p>
            </div>
          ) : (
            /* Company root node */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'fit-content' }}>
              {/* Company card */}
              <div style={{
                padding: '1rem 1.5rem', background: '#1A1A1A',
                border: '2px solid #10B981', borderRadius: '1rem',
                textAlign: 'center', minWidth: '200px',
              }}>
                <div style={{ color: '#10B981', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Company</div>
                <div style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700 }}>{companyName}</div>
                <div style={{ color: '#71717A', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {departments.reduce((acc, d) => acc + d.member_count, 0)} members
                </div>
              </div>

              {/* Line down from company */}
              <div style={{ width: '2px', height: '30px', background: '#2D2D2D' }} />

              {/* Departments row */}
              {departments.length === 1 ? (
                renderDepartment(departments[0], 0)
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Horizontal connector across departments */}
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {departments.map((dept, idx) => (
                      <div key={dept.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div style={{
                          height: '2px', background: '#2D2D2D',
                          position: 'absolute', top: 0,
                          left: idx === 0 ? '50%' : 0,
                          right: idx === departments.length - 1 ? '50%' : 0,
                        }} />
                        <div style={{ width: '2px', height: '24px', background: '#2D2D2D' }} />
                        <div style={{ padding: '0 1.5rem' }}>
                          {renderDepartment(dept, idx)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => { setSelectedMember(null); setMemberDetail(null); }}
          >
            <div
              style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1.5rem', width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2D2D2D' }}
              onClick={(e) => e.stopPropagation()}
            >
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#71717A' }}>Loading...</div>
              ) : memberDetail ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFF', fontSize: '1.25rem', fontWeight: 700,
                      }}>
                        {memberDetail.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{memberDetail.user_name}</h3>
                        <p style={{ color: '#71717A', fontSize: '0.8125rem', margin: '0.125rem 0 0' }}>{memberDetail.user_email}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedMember(null); setMemberDetail(null); }} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                      <XMarkIcon style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem' }}>
                      <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Department</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{memberDetail.department_name}</div>
                    </div>
                    <div style={{ background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem' }}>
                      <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Department Role</div>
                      <div style={{ color: memberDetail.dept_role === 'manager' || memberDetail.dept_role === 'lead' ? '#F59E0B' : memberDetail.dept_role === 'admin' ? '#10B981' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{memberDetail.dept_role}</div>
                    </div>
                    <div style={{ background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem' }}>
                      <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Company Role</div>
                      <div style={{ color: memberDetail.company_role === 'admin' ? '#10B981' : memberDetail.company_role === 'manager' ? '#F59E0B' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{memberDetail.company_role}</div>
                    </div>
                    <div style={{ background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '0.75rem' }}>
                      <div style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reports To</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{memberDetail.manager_name || '—'}</div>
                    </div>
                  </div>

                  {/* Direct Reports */}
                  {memberDetail.direct_reports.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Direct Reports ({memberDetail.direct_reports.length})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {memberDetail.direct_reports.map((name, idx) => (
                          <span key={idx} style={{ padding: '0.25rem 0.625rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '1rem', color: '#FFFFFF', fontSize: '0.8125rem' }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  <div>
                    <div style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Responsibilities</div>
                    {memberDetail.responsibilities.length === 0 ? (
                      <p style={{ color: '#52525B', fontSize: '0.8125rem' }}>No responsibilities assigned yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {memberDetail.responsibilities.map((r) => (
                          <div key={r.id} style={{ padding: '0.5rem 0.75rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.8125rem' }}>
                            {r.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  // Render a department block with its hierarchy
  function renderDepartment(dept: DeptInfo, colorIdx: number) {
    const color = deptColors[colorIdx % deptColors.length];
    const trees = deptTrees[dept.id] || [];
    const deptKey = `dept-${dept.id}`;
    const isDeptCollapsed = collapsedNodes.has(deptKey);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Department card */}
        <div
          style={{
            padding: '0.75rem 1.25rem', background: '#1A1A1A',
            border: `2px solid ${color}`, borderRadius: '0.75rem',
            textAlign: 'center', minWidth: '180px', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => toggleCollapse(deptKey)}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ color, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
            Department
            <ChevronDownIcon style={{ width: '12px', height: '12px', transition: 'transform 0.2s', transform: isDeptCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700 }}>{dept.name}</div>
          <div style={{ color: '#71717A', fontSize: '0.6875rem', marginTop: '0.125rem' }}>{dept.member_count} member{dept.member_count !== 1 ? 's' : ''}</div>
        </div>

        {/* Members tree */}
        {!isDeptCollapsed && trees.length > 0 && (
          <>
            <div style={{ width: '2px', height: '20px', background: '#2D2D2D' }} />

            {trees.length === 1 ? (
              renderNode(trees[0], dept.id, color, 0, true)
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {trees.map((rootNode, idx) => (
                    <div key={rootNode.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      <div style={{
                        height: '2px', background: '#2D2D2D',
                        position: 'absolute', top: 0,
                        left: idx === 0 ? '50%' : 0,
                        right: idx === trees.length - 1 ? '50%' : 0,
                      }} />
                      <div style={{ width: '2px', height: '20px', background: '#2D2D2D' }} />
                      <div style={{ padding: '0 0.5rem' }}>
                        {renderNode(rootNode, dept.id, color, 0, idx === trees.length - 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
}
