-- Create a helper function to list public tables for use via RPC
CREATE OR REPLACE FUNCTION list_public_tables()
RETURNS TABLE(table_name text, table_schema text, table_type text)
LANGUAGE sql
AS $$
  SELECT table_name, table_schema, table_type
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
$$;
