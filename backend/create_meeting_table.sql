-- SQL script to create the meetings table in Supabase
-- Run this in your Supabase SQL editor if the Python script doesn't work

-- Create the meetings table
CREATE TABLE IF NOT EXISTS public.projects_meeting (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    attendees TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_id BIGINT NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES public.projects_project(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_meeting_project_id ON public.projects_meeting(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_meeting_created_by_id ON public.projects_meeting(created_by_id);
CREATE INDEX IF NOT EXISTS idx_projects_meeting_date ON public.projects_meeting(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects_meeting ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view meetings for their projects" ON public.projects_meeting
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects_project 
            WHERE created_by_id = auth.uid()::bigint
            UNION
            SELECT project_id FROM public.projects_project_members 
            WHERE user_id = auth.uid()::bigint
        )
    );

CREATE POLICY "Users can create meetings for their projects" ON public.projects_meeting
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects_project 
            WHERE created_by_id = auth.uid()::bigint
            UNION
            SELECT project_id FROM public.projects_project_members 
            WHERE user_id = auth.uid()::bigint
        )
    );

CREATE POLICY "Users can update meetings they created" ON public.projects_meeting
    FOR UPDATE
    USING (created_by_id = auth.uid()::bigint);

CREATE POLICY "Users can delete meetings they created" ON public.projects_meeting
    FOR DELETE
    USING (created_by_id = auth.uid()::bigint); 