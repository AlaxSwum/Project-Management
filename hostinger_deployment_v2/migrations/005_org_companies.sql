-- Migration: Organization/Company Management Tables
-- Run this on Supabase SQL Editor

-- 1. Companies table
CREATE TABLE IF NOT EXISTS org_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Company members (admin/manager/member)
CREATE TABLE IF NOT EXISTS org_company_members (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES org_companies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- 3. Departments within companies
CREATE TABLE IF NOT EXISTS org_departments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES org_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Department members with dynamic roles
CREATE TABLE IF NOT EXISTS org_department_members (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  role VARCHAR(255) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, user_id)
);

-- 5. Member responsibilities
CREATE TABLE IF NOT EXISTS org_member_responsibilities (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Checklists (daily/weekly/monthly)
CREATE TABLE IF NOT EXISTS org_checklists (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
