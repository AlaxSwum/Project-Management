// ============================================================================
// TIMELINE TYPES
// Complete type definitions for Timeline & Roadmap features
// ============================================================================

export interface TimelineFolder {
  id: number;
  name: string;
  description?: string;
  created_by_id: number;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
}

export interface FolderMember {
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

export interface Category {
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

export type ItemStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'delayed';
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type Phase = 'Planning' | 'Design' | 'Development' | 'Testing' | 'Launch' | 'Maintenance';
export type AllocationMode = 'SPAN' | 'DAILY';
export type AllocationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type CapacityUnit = 'tasks' | 'hours' | 'points';

export interface TimelineItem {
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
  phase?: Phase;
  status: ItemStatus;
  completion_percentage: number;
  planned_budget: number;
  actual_spending: number;
  budget_variance_percentage?: number;
  team_leader_id?: number;
  team_member_ids?: number[];
  priority: ItemPriority;
  depends_on_item_ids?: number[];
  notes?: string;
  created_by_id?: number;
  created_at?: string;
  // Joined fields
  category_name?: string;
  checklist_count?: number;
  checklist_completed?: number;
  assignees?: ItemAssignee[];
}

export interface ChecklistItem {
  id?: number;
  timeline_item_id: number;
  item_text: string;
  is_completed: boolean;
  item_order: number;
  completed_at?: string;
  completed_by_id?: number;
}

export interface ItemAssignee {
  id: number;
  item_id: number;
  member_id: number;
  allocation_mode: AllocationMode;
  allocation_effort_total?: number;
  created_at?: string;
  // Joined fields
  member_name?: string;
  member_email?: string;
}

export interface ItemAllocation {
  id: number;
  item_id: number;
  member_id: number;
  allocation_date: string;
  phase: Phase;
  planned_effort: number;
  actual_effort?: number;
  status: AllocationStatus;
  completed_at?: string;
  notes?: string;
  created_at?: string;
  // Joined fields
  item_title?: string;
  item_color?: string;
  member_name?: string;
}

export interface PersonalTodo {
  id: number;
  folder_id: number;
  member_id: number;
  todo_date: string;
  title: string;
  description?: string;
  linked_item_id?: number;
  priority: ItemPriority;
  planned_effort: number;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
  // Joined fields
  linked_item_title?: string;
}

export interface MemberCapacity {
  id: number;
  folder_id: number;
  member_id: number;
  unit: CapacityUnit;
  capacity_per_day: number;
  capacity_per_week?: number;
  created_at?: string;
  // Joined fields
  member_name?: string;
}

export interface KPI {
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

// Workload aggregation types
export interface WorkloadCell {
  memberId: number;
  memberName: string;
  timeBucket: string; // YYYY-MM or YYYY-Www or YYYY-MM-DD
  totalEffort: number;
  taskCount: number;
  capacity: number;
  isOverloaded: boolean;
  phaseBreakdown: PhaseBreakdown;
  allocations: ItemAllocation[];
}

export interface PhaseBreakdown {
  Planning: number;
  Design: number;
  Development: number;
  Testing: number;
  Launch: number;
  Maintenance: number;
}

// Per-person KPI types
export interface PersonKPI {
  memberId: number;
  memberName: string;
  completionRate: number;
  onTimeRate: number;
  overdueCount: number;
  effortCompleted: number;
  effortPlanned: number;
  itemsCompleted: number;
  itemsAssigned: number;
  averageCompletionTime?: number;
}

// View modes
export type ViewMode = 'day' | 'week' | 'month' | 'quarter';
export type TabMode = 'timeline' | 'workload' | 'todos' | 'reports' | 'team';
export type WorkloadViewMode = 'day' | 'week' | 'month';

// Form types
export interface NewItemForm {
  title: string;
  description: string;
  category_id: number;
  start_date: string;
  end_date: string;
  phase: Phase;
  status: ItemStatus;
  planned_budget: number;
  actual_spending: number;
  completion_percentage: number;
  priority: ItemPriority;
  team_leader_id: number;
  team_member_ids: number[];
  color: string;
  // New assignee fields
  assignees: AssigneeForm[];
}

export interface AssigneeForm {
  member_id: number;
  allocation_mode: AllocationMode;
  allocation_effort_total?: number;
  daily_allocations?: DailyAllocationForm[];
}

export interface DailyAllocationForm {
  date: string;
  planned_effort: number;
  phase: Phase;
}

export interface NewTodoForm {
  title: string;
  description: string;
  todo_date: string;
  priority: ItemPriority;
  planned_effort: number;
  linked_item_id?: number;
}

export interface CapacityForm {
  member_id: number;
  unit: CapacityUnit;
  capacity_per_day: number;
  capacity_per_week?: number;
}

// Filter types
export interface WorkloadFilters {
  phases: Phase[];
  statuses: AllocationStatus[];
  categories: number[];
  members: number[];
}
