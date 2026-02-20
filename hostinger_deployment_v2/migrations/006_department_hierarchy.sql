-- Migration: Add hierarchical manager structure to department members
-- Run this on Supabase SQL Editor

-- Add manager_id self-referencing column to org_department_members
-- NULL manager_id = top-level (root node)
-- ON DELETE SET NULL = if a manager is removed, their reports become top-level
ALTER TABLE org_department_members
ADD COLUMN manager_id INTEGER REFERENCES org_department_members(id) ON DELETE SET NULL;

-- Index for fast hierarchy lookups
CREATE INDEX idx_dept_members_manager ON org_department_members(manager_id);
