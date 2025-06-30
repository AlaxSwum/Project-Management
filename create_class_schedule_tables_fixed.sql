-- Create class schedule folders table (hierarchical structure)
CREATE TABLE IF NOT EXISTS public.class_schedule_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES public.class_schedule_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by INTEGER REFERENCES public.auth_user(id) ON DELETE SET NULL
);

-- Create class schedule members table
CREATE TABLE IF NOT EXISTS public.class_schedule_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.auth_user(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Create class schedule main table
CREATE TABLE IF NOT EXISTS public.class_schedule (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    class_info TEXT,
    class_start_date DATE NOT NULL,
    duration VARCHAR(100), -- e.g., "2 hours", "90 minutes"
    days TEXT[], -- Array of days: {"Monday", "Wednesday", "Friday"}
    time_range VARCHAR(100), -- e.g., "7:00 PM - 9:00 PM"
    platform VARCHAR(255), -- e.g., "Zoom", "Google Meet", "In-Person"
    instructor_name VARCHAR(255), -- Instructor name
    instructor_info TEXT, -- Multi-sentence instructor information
    post_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    folder_id INTEGER REFERENCES public.class_schedule_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by INTEGER REFERENCES public.auth_user(id) ON DELETE SET NULL
);

-- Add instructor_name column if it doesn't exist (for existing installations)
ALTER TABLE public.class_schedule ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);

-- Create default root folders (using NULL for created_by to avoid foreign key issues)
INSERT INTO public.class_schedule_folders (name, description, parent_id, created_by) VALUES
('Programming Classes', 'Software development and programming courses', NULL, NULL),
('Business Classes', 'Business and management training sessions', NULL, NULL),
('Design Classes', 'UI/UX and graphic design workshops', NULL, NULL),
('Language Classes', 'Foreign language learning sessions', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_schedule_folders_parent_id ON public.class_schedule_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_class_schedule_folder_id ON public.class_schedule(folder_id);
CREATE INDEX IF NOT EXISTS idx_class_schedule_created_by ON public.class_schedule(created_by);
CREATE INDEX IF NOT EXISTS idx_class_schedule_start_date ON public.class_schedule(class_start_date);
CREATE INDEX IF NOT EXISTS idx_class_schedule_days ON public.class_schedule USING GIN(days);
CREATE INDEX IF NOT EXISTS idx_class_schedule_members_user_id ON public.class_schedule_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.class_schedule_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all class schedule folders" ON public.class_schedule_folders;
DROP POLICY IF EXISTS "Users can create class schedule folders" ON public.class_schedule_folders;
DROP POLICY IF EXISTS "Users can update their own class schedule folders" ON public.class_schedule_folders;
DROP POLICY IF EXISTS "Users can delete their own class schedule folders" ON public.class_schedule_folders;
DROP POLICY IF EXISTS "Users can view all class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Users can create class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Users can update their own class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Users can delete their own class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Users can view all class schedule members" ON public.class_schedule_members;
DROP POLICY IF EXISTS "Admins can manage class schedule members" ON public.class_schedule_members;

-- Create SIMPLE and PERMISSIVE RLS policies for class_schedule_folders
CREATE POLICY "Anyone can view class schedule folders" ON public.class_schedule_folders
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create class schedule folders" ON public.class_schedule_folders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update class schedule folders" ON public.class_schedule_folders
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete class schedule folders" ON public.class_schedule_folders
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create SIMPLE and PERMISSIVE RLS policies for class_schedule
CREATE POLICY "Anyone can view class schedules" ON public.class_schedule
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create class schedules" ON public.class_schedule
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update class schedules" ON public.class_schedule
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete class schedules" ON public.class_schedule
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create SIMPLE and PERMISSIVE RLS policies for class_schedule_members
CREATE POLICY "Anyone can view class schedule members" ON public.class_schedule_members
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage class schedule members" ON public.class_schedule_members
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_class_schedule_folders_updated_at BEFORE UPDATE ON public.class_schedule_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_schedule_updated_at BEFORE UPDATE ON public.class_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.class_schedule_folders TO anon, authenticated;
GRANT ALL ON public.class_schedule TO anon, authenticated;
GRANT ALL ON public.class_schedule_members TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 