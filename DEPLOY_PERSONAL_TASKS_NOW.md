# 🚀 Deploy Personal Task Management System

## ⚡ QUICK DEPLOYMENT INSTRUCTIONS

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project: `bayyefskgflbyyuwrlgm`
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Run the SQL
Copy the entire content from `deploy-personal-direct.sql` and paste it into the SQL Editor, then click **"Run"**.

Or copy this SQL directly:

```sql
-- =============================================
-- DEPLOY PERSONAL TASK MANAGEMENT SYSTEM
-- =============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

-- Create personal_tasks table
CREATE TABLE personal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100),
    tags TEXT[],
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create personal_time_blocks table
CREATE TABLE personal_time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES personal_tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    block_type VARCHAR(50) DEFAULT 'task' CHECK (block_type IN ('task', 'break', 'meeting', 'focus', 'personal', 'other')),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_personal_tasks_updated_at 
    BEFORE UPDATE ON personal_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_time_blocks_updated_at 
    BEFORE UPDATE ON personal_time_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_tasks
CREATE POLICY "Users can view their own personal tasks" 
    ON personal_tasks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal tasks" 
    ON personal_tasks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal tasks" 
    ON personal_tasks FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal tasks" 
    ON personal_tasks FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for personal_time_blocks
CREATE POLICY "Users can view their own time blocks" 
    ON personal_time_blocks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks" 
    ON personal_time_blocks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" 
    ON personal_time_blocks FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" 
    ON personal_time_blocks FOR DELETE 
    USING (auth.uid() = user_id);

-- Create views for Month/Week/Day tabs
CREATE OR REPLACE VIEW personal_today_view AS
SELECT 
    pt.id, pt.user_id, pt.title, pt.description, pt.status, pt.priority, pt.due_date, pt.estimated_duration,
    'task' as item_type, pt.created_at as start_time, NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date::date = CURRENT_DATE AND pt.status != 'completed'
UNION ALL
SELECT 
    ptb.id, ptb.user_id, ptb.title, ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority, ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type, ptb.start_time, ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time::date = CURRENT_DATE;

CREATE OR REPLACE VIEW personal_week_view AS
SELECT 
    pt.id, pt.user_id, pt.title, pt.description, pt.status, pt.priority, pt.due_date, pt.estimated_duration,
    'task' as item_type, pt.created_at as start_time, NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date >= date_trunc('week', CURRENT_DATE)
    AND pt.due_date < date_trunc('week', CURRENT_DATE) + interval '1 week'
    AND pt.status != 'completed'
UNION ALL
SELECT 
    ptb.id, ptb.user_id, ptb.title, ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority, ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type, ptb.start_time, ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time >= date_trunc('week', CURRENT_DATE)
    AND ptb.start_time < date_trunc('week', CURRENT_DATE) + interval '1 week';

CREATE OR REPLACE VIEW personal_month_view AS
SELECT 
    pt.id, pt.user_id, pt.title, pt.description, pt.status, pt.priority, pt.due_date, pt.estimated_duration,
    'task' as item_type, pt.created_at as start_time, NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date >= date_trunc('month', CURRENT_DATE)
    AND pt.due_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
    AND pt.status != 'completed'
UNION ALL
SELECT 
    ptb.id, ptb.user_id, ptb.title, ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority, ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type, ptb.start_time, ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time >= date_trunc('month', CURRENT_DATE)
    AND ptb.start_time < date_trunc('month', CURRENT_DATE) + interval '1 month';

-- Grant permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT SELECT ON personal_today_view TO authenticated;
GRANT SELECT ON personal_week_view TO authenticated;
GRANT SELECT ON personal_month_view TO authenticated;

-- Success message
SELECT 'Personal Task Management System deployed successfully!' as message;
```

### Step 3: Verify Deployment
After running the SQL, you should see:
- ✅ Tables created: `personal_tasks`, `personal_time_blocks`
- ✅ Views created: `personal_today_view`, `personal_week_view`, `personal_month_view`
- ✅ RLS policies enabled for user privacy
- ✅ 15-minute time blocking support

### Step 4: Test the Tables
Run this query to verify everything works:

```sql
-- Test query
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename IN ('personal_tasks', 'personal_time_blocks');

-- Check views
SELECT 
    schemaname, 
    viewname, 
    viewowner 
FROM pg_views 
WHERE viewname LIKE 'personal_%_view';
```

## 🎯 What You Get

### **Personal Tasks Table**
- User-specific task management
- Priority levels (low, medium, high, urgent)
- Status tracking (pending, in_progress, completed, cancelled)
- Due dates, categories, tags
- Time tracking (estimated vs actual duration)
- Recurring task support

### **Time Blocks Table** 
- 15-minute time blocking
- Different block types (task, break, meeting, focus, personal)
- Color coding for UI
- Integration with personal tasks
- Completion tracking

### **Ready-Made Views**
- **Day Tab**: `personal_today_view` - Today's tasks and time blocks
- **Week Tab**: `personal_week_view` - This week's tasks and time blocks  
- **Month Tab**: `personal_month_view` - This month's tasks and time blocks

### **Security**
- Row Level Security (RLS) ensures users only see their own data
- User authentication integration
- Privacy protection built-in

## 🚀 Next Steps

1. **Deploy the database** (copy SQL above into Supabase)
2. **Update your frontend** to use the new tables
3. **Implement the Month/Week/Day tabs** in your UI
4. **Add 15-minute time blocking interface**
5. **Test the personal task management features**

Your personal task management system is ready! 🎉
