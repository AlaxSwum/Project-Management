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
    instructor_info TEXT, -- Multi-sentence instructor information
    post_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    folder_id INTEGER REFERENCES public.class_schedule_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by INTEGER REFERENCES public.auth_user(id) ON DELETE SET NULL
);

-- Create default root folders
INSERT INTO public.class_schedule_folders (name, description, parent_id, created_by) VALUES
('Programming Classes', 'Software development and programming courses', NULL, 1),
('Business Classes', 'Business and management training sessions', NULL, 1),
('Design Classes', 'UI/UX and graphic design workshops', NULL, 1),
('Language Classes', 'Foreign language learning sessions', NULL, 1);

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

-- Create RLS policies for class_schedule_folders
CREATE POLICY "Users can view all class schedule folders" ON public.class_schedule_folders
    FOR SELECT USING (true);

CREATE POLICY "Users can create class schedule folders" ON public.class_schedule_folders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own class schedule folders" ON public.class_schedule_folders
    FOR UPDATE USING (created_by = (SELECT id FROM public.auth_user WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete their own class schedule folders" ON public.class_schedule_folders
    FOR DELETE USING (created_by = (SELECT id FROM public.auth_user WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Create RLS policies for class_schedule
CREATE POLICY "Users can view all class schedules" ON public.class_schedule
    FOR SELECT USING (true);

CREATE POLICY "Users can create class schedules" ON public.class_schedule
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own class schedules" ON public.class_schedule
    FOR UPDATE USING (created_by = (SELECT id FROM public.auth_user WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete their own class schedules" ON public.class_schedule
    FOR DELETE USING (created_by = (SELECT id FROM public.auth_user WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Create RLS policies for class_schedule_members
CREATE POLICY "Users can view all class schedule members" ON public.class_schedule_members
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage class schedule members" ON public.class_schedule_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_user 
            WHERE id = (SELECT id FROM public.auth_user WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
            AND (is_superuser = true OR is_staff = true OR role IN ('admin', 'hr'))
        )
    );

-- Add some sample data
INSERT INTO public.class_schedule (
    class_name, 
    class_info, 
    class_start_date, 
    duration, 
    days, 
    time_range, 
    platform, 
    instructor_info, 
    folder_id, 
    created_by
) VALUES
(
    'React.js Fundamentals',
    'Learn the basics of React.js including components, state management, and hooks. Perfect for beginners who want to start building modern web applications.',
    '2024-02-01',
    '2 hours',
    ARRAY['Monday', 'Wednesday'],
    '7:00 PM - 9:00 PM',
    'Zoom',
    'John Smith - Senior Frontend Developer with 8 years of experience. Worked at Google and Meta. Specialized in React ecosystem and modern JavaScript.',
    1,
    1
),
(
    'Business Strategy Workshop',
    'Comprehensive workshop covering strategic planning, market analysis, and competitive positioning for growing businesses.',
    '2024-02-05',
    '3 hours',
    ARRAY['Tuesday', 'Thursday'],
    '6:00 PM - 9:00 PM',
    'Google Meet',
    'Sarah Johnson - MBA from Harvard Business School. Former McKinsey consultant with 10+ years in strategy consulting. Currently VP of Strategy at Fortune 500 company.',
    2,
    1
);

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