-- Migration: Add position field to company members
-- Position is the job title (e.g. CEO, CTO, Marketing Director)
-- This is different from role which controls access (admin/manager/member)

ALTER TABLE org_company_members ADD COLUMN IF NOT EXISTS position VARCHAR(255) DEFAULT '';
