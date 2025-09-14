# 🚀 Deploy Personal Task Management to Your Website NOW

## ✅ Status: Ready to Deploy!

Your Personal Task Management System is now committed to GitHub and ready for deployment.

## 🎯 Quick Deployment (2 Steps)

### Step 1: Deploy to Hostinger Website
Run this command to deploy to your live website:

```bash
ssh root@168.231.116.32 'cd /var/www/project_management && git pull origin main && systemctl stop nextjs-pm && cd frontend && rm -rf .next && npm install && npm run build && systemctl start nextjs-pm'
```

**Or use the deployment script:**
```bash
ssh root@168.231.116.32 'cd /var/www/project_management && ./deploy-personal-tasks-hostinger.sh'
```

### Step 2: Deploy Database to Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select project: `bayyefskgflbyyuwrlgm`
3. Click **SQL Editor** → **New Query**
4. Copy and paste this SQL:

```sql
-- Personal Task Management System Database
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

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

-- Indexes for performance
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);

-- Trigger function for updated_at
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

-- Enable Row Level Security
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
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
SELECT 'Personal Task Management System deployed successfully!' as message,
       'Tables: personal_tasks, personal_time_blocks' as tables_created,
       'Views: personal_today_view, personal_week_view, personal_month_view' as views_created;
```

5. Click **Run** to deploy the database

## 🎉 What You'll Get After Deployment

### ✅ Personal Task Management Features:
- **Month/Week/Day tabs** for different time views
- **15-minute time blocking** system
- **Personal task storage** (user-specific)
- **Priority levels** and categories
- **Time tracking** capabilities
- **Recurring task** support
- **Color-coded time blocks**

### 🔒 Security:
- **Row Level Security** - Users only see their own tasks
- **User authentication** integration
- **Privacy protection** built-in

### 🌐 Live Website:
- **Frontend**: https://srv875725.hstgr.cloud
- **Database**: Supabase (bayyefskgflbyyuwrlgm)

## 📋 Verification Steps

After deployment, verify everything works:

1. **Check website is running**: Visit https://srv875725.hstgr.cloud
2. **Test database**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'personal_%';
   ```
3. **Check views**: 
   ```sql
   SELECT viewname FROM pg_views WHERE viewname LIKE 'personal_%';
   ```

## 🚀 Ready to Deploy!

Your Personal Task Management System is ready for deployment. Just run the commands above and you'll have:

- ✅ Personal task management
- ✅ 15-minute time blocking  
- ✅ Month/Week/Day views
- ✅ User privacy & security
- ✅ Live on your website

**Estimated deployment time: 3-5 minutes** ⏱️
