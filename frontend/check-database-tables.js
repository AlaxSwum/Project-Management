#!/usr/bin/env node

/**
 * Database Table Checker for Supabase
 * Checks if absence/leave management tables exist
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(` ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { exists: false, error: error.message };
      }
      return { exists: false, error: error.message };
    }
    
    return { exists: true, data };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    });

    if (error) {
      // Try alternative method using information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (schemaError) {
        return { schema: null, error: schemaError.message };
      }
      return { schema: schemaData };
    }
    
    return { schema: data };
  } catch (err) {
    return { schema: null, error: err.message };
  }
}

async function listAllTables() {
  // Prefer RPC function (requires running add_list_public_tables_function.sql once)
  try {
    const { data, error } = await supabase.rpc('list_public_tables');
    if (error) {
      throw error;
    }
    return { tables: data };
  } catch (rpcErr) {
    // Fallback message
    return { tables: null, error: `RPC list_public_tables not available (${rpcErr.message}). Please run add_list_public_tables_function.sql in Supabase.` };
  }
}

async function getRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { count: null, error: error.message };
    }
    
    return { count };
  } catch (err) {
    return { count: null, error: err.message };
  }
}

async function checkAbsenceTables() {
  logSection('🔍 CHECKING ABSENCE/LEAVE MANAGEMENT TABLES');

  const tables = ['leave_requests', 'employee_leave_balance'];
  let allTablesExist = true;

  for (const tableName of tables) {
    logInfo(`Checking table: ${tableName}`);
    
    const { exists, error } = await checkTableExists(tableName);
    
    if (exists) {
      logSuccess(`Table '${tableName}' exists!`);
      
      // Get row count
      const { count, error: countError } = await getRowCount(tableName);
      if (count !== null) {
        logInfo(`  └─ Contains ${count} records`);
      }
    } else {
      logError(`Table '${tableName}' does not exist`);
      logError(`  └─ Error: ${error}`);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

const path = require('path');
const fs = require('fs');

function extractTableNamesFromSQLFiles(rootDir) {
  const sqlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql'));
  const tableNames = new Set();
  const regex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_\.\"]+)/gi;
  for (const file of sqlFiles) {
    try {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        let fullName = match[1].replace(/\"/g, '').trim();
        // Keep only table name (strip schema if present)
        const parts = fullName.split('.');
        const nameOnly = parts[parts.length - 1];
        if (nameOnly) tableNames.add(nameOnly);
      }
    } catch (_) { /* ignore */ }
  }
  return Array.from(tableNames);
}

async function checkExistingTables() {
  logSection('📋 LISTING ALL EXISTING TABLES');
  // Try RPC first
  const { tables, error } = await listAllTables();
  if (!error && tables && tables.length > 0) {
    logSuccess(`Found ${tables.length} tables in your database:`);
    tables.forEach(t => {
      const name = t.table_name || t.table_name;
      const schema = t.table_schema || 'public';
      logInfo(`  • ${schema}.${name}`);
    });
    return;
  }

  // Fallback: derive candidates from local SQL files, then verify existence by querying each
  logWarning('Falling back to verification from local SQL files...');
  const rootDir = path.resolve(__dirname, '..', '..');
  const candidates = extractTableNamesFromSQLFiles(rootDir);
  const existing = [];
  for (const name of candidates) {
    const { exists } = await checkTableExists(name);
    if (exists) existing.push(name);
  }
  if (existing.length > 0) {
    logSuccess(`Verified ${existing.length} existing tables (from ${candidates.length} candidates):`);
    existing.sort().forEach(n => logInfo(`  • public.${n}`));
  } else {
    logWarning('Could not verify any tables via fallback method.');
  }
}

async function testConnection() {
  logSection('🌐 TESTING SUPABASE CONNECTION');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('auth_user')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        logWarning('Connection successful, but auth_user table not found');
        logInfo('This is normal if you\'re using a different auth setup');
        return true;
      } else {
        logError(`Connection failed: ${error.message}`);
        return false;
      }
    } else {
      logSuccess('Connection to Supabase successful!');
      return true;
    }
  } catch (err) {
    logError(`Connection error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.clear();
  logSection('🚀 SUPABASE DATABASE TABLE CHECKER');
  logInfo('Project: Project Management System');
  logInfo(`Database: ${SUPABASE_URL}`);
  logInfo(`Time: ${new Date().toLocaleString()}`);

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    logError('Cannot proceed without database connection');
    process.exit(1);
  }

  // Check existing tables
  await checkExistingTables();

  // Check absence tables specifically
  const absenceTablesExist = await checkAbsenceTables();

  // Summary
  logSection('📊 SUMMARY');
  
  if (absenceTablesExist) {
    logSuccess('✅ All absence management tables exist!');
    logInfo('Your leave/absence system is ready to use.');
  } else {
    logWarning('❌ Absence management tables are missing');
    logInfo('Run the SQL commands in create_absence_tables.sql to set them up.');
    logInfo('Or visit your Supabase dashboard → SQL Editor and paste the SQL.');
  }

  console.log('\n' + '='.repeat(60));
  logInfo('Check completed successfully!');
  console.log('='.repeat(60) + '\n');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  logError(`Unhandled promise rejection: ${error.message}`);
  process.exit(1);
});

// Run the checker
main().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
}); 