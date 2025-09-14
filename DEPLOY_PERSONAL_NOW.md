# 🚀 Deploy Personal Task Management System NOW

## ✅ Status: Ready for Deployment!

Your Personal Task Management System has been updated and is ready for deployment to your website.

## 🎯 Quick 2-Step Deployment:

### Step 1: Deploy Database (2 minutes)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select project: `bayyefskgflbyyuwrlgm` 
3. Click **SQL Editor** → **New Query**
4. **Copy and paste this SQL** (click Run after pasting):

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

-- Indexes
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);

-- Trigger function
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

-- RLS Policies
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

-- Grant permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;

-- Success message
SELECT 'Personal Task Management System deployed successfully!' as message;
```

### Step 2: Deploy to Website (2 minutes)
**Copy and run this command in your terminal:**

```bash
ssh root@168.231.116.32 'cd /var/www/project_management && git pull origin main && systemctl stop nextjs-pm && cd frontend && rm -rf .next && npm install && npm run build && systemctl start nextjs-pm && sleep 3 && systemctl status nextjs-pm'
```

## 🎉 What You'll Get After Deployment:

### ✅ **Personal Task Management Features:**
- **Month/Week/Day tabs** for different time views
- **15-minute time blocking** system  
- **Personal task storage** (user-specific privacy)
- **Priority levels** (Low, Medium, High, Urgent)
- **Status tracking** (Pending, In Progress, Completed)
- **Time estimation** and tracking
- **Categories and descriptions**
- **Color-coded time blocks**

### 🔒 **Security & Privacy:**
- **Row Level Security** - Users only see their own tasks
- **User authentication** integration
- **Data isolation** between users

### 🌐 **Live Website:**
- **Frontend**: https://srv875725.hstgr.cloud/personal
- **Navigation**: Updated sidebar with "My Personal" link

## 📋 **After Deployment - Test Your System:**

1. **Visit your website**: https://srv875725.hstgr.cloud
2. **Click "My Personal"** in the sidebar
3. **Test the features**:
   - Create a new task
   - Switch between Month/Week/Day views
   - Add a time block with 15-minute scheduling
   - Mark tasks as completed
   - Test different priority levels

## 🔍 **Verify Database Deployment:**
Run this query in Supabase SQL Editor to confirm:
```sql
SELECT tablename FROM pg_tables WHERE tablename LIKE 'personal_%';
```

You should see:
- `personal_tasks`
- `personal_time_blocks`

## 🚀 **Ready to Deploy!**

**Total deployment time: ~4 minutes**

Your Personal Task Management System with Month/Week/Day tabs and 15-minute time blocking is ready to go live!

Just run the two steps above and you'll have a fully functional personal task management system on your website.
