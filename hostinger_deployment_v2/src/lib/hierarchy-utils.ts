// Hierarchy utility functions for department member tree operations

export interface HierarchyMember {
  id: number;
  department_id: number;
  user_id: number;
  role: string;
  manager_id: number | null;
  user_name: string;
  user_email: string;
}

export interface TreeNode extends HierarchyMember {
  children: TreeNode[];
}

/**
 * Build a hierarchy tree from a flat list of members.
 * Returns root nodes (members with no manager) with nested children.
 */
export function buildHierarchyTree(members: HierarchyMember[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  // Create tree nodes
  for (const m of members) {
    nodeMap.set(m.id, { ...m, children: [] });
  }

  // Link children to parents
  for (const m of members) {
    const node = nodeMap.get(m.id)!;
    if (m.manager_id && nodeMap.has(m.manager_id)) {
      nodeMap.get(m.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Get all descendant user_ids under a given member (recursive).
 */
export function getSubordinateIds(members: HierarchyMember[], memberId: number): number[] {
  const result: number[] = [];
  const directReports = members.filter((m) => m.manager_id === memberId);
  for (const report of directReports) {
    result.push(report.user_id);
    result.push(...getSubordinateIds(members, report.id));
  }
  return result;
}

/**
 * Check if managerMemberId is a manager (direct or indirect) of targetMemberId.
 * Uses the member row `id` field, not user_id.
 */
export function isManagerOf(
  members: HierarchyMember[],
  managerMemberId: number,
  targetMemberId: number
): boolean {
  let current = members.find((m) => m.id === targetMemberId);
  const visited = new Set<number>();
  while (current && current.manager_id) {
    if (visited.has(current.id)) return false; // cycle guard
    visited.add(current.id);
    if (current.manager_id === managerMemberId) return true;
    current = members.find((m) => m.id === current!.manager_id);
  }
  return false;
}

/**
 * Check if setting memberId's manager to newManagerId would create a cycle.
 */
export function wouldCreateCycle(
  members: HierarchyMember[],
  memberId: number,
  newManagerId: number
): boolean {
  if (memberId === newManagerId) return true;

  // Walk up from newManagerId — if we reach memberId, it's a cycle
  let current = members.find((m) => m.id === newManagerId);
  const visited = new Set<number>();
  while (current && current.manager_id) {
    if (visited.has(current.id)) return true;
    visited.add(current.id);
    if (current.manager_id === memberId) return true;
    current = members.find((m) => m.id === current!.manager_id);
  }
  return false;
}
