-- Optimize project member queries to prevent timeouts
-- Add indexes for faster lookups

-- Index on project_members for faster project lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_id 
ON projects_project_members(project_id);

-- Index on project_members for faster user lookups
CREATE INDEX IF NOT EXISTS idx_project_members_user_id 
ON projects_project_members(user_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_project_members_project_user 
ON projects_project_members(project_id, user_id);

-- Index on auth_user for avatar lookups
CREATE INDEX IF NOT EXISTS idx_auth_user_id 
ON auth_user(id);

-- Analyze tables to update statistics
ANALYZE projects_project_members;
ANALYZE auth_user;
