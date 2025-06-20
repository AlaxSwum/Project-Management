-- Simple SQL script to create meetings table (no complex RLS policies)
-- Run this in your Supabase SQL editor

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