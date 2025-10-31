import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function _executeSql(sql) {
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    const { error } = await supabase.rpc('query', { query_text: `${statement};` });

    if (error) {
      throw error;
    }
  }
}

async function _runMigration(filePath, fileName) {
  console.log(`\n📄 Running migration: ${fileName}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Execute the SQL directly using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // If the RPC doesn't exist, we need to execute via pg_stat_statements or direct query
      console.log(`⚠️  Direct execution for ${fileName}`);

      // For now, let's just log the SQL and ask user to run it manually
      console.log('\nPlease run this SQL in Supabase SQL Editor:');
      console.log('==========================================');
      console.log(sql);
      console.log('==========================================\n');
    }

    console.log(`✅ Successfully prepared ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to run ${fileName}:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files:\n`);

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Migration: ${file}`);
    console.log('='.repeat(60));

    const sql = readFileSync(filePath, 'utf-8');
    console.log('\nSQL Content:');
    console.log(sql);
    console.log(`\n${'='.repeat(60)}`);

    console.log(`\n⚠️  Please copy the SQL above and run it in your Supabase SQL Editor`);
    console.log(`    Project: ${supabaseUrl}`);
    console.log(`    Go to: SQL Editor → New Query → Paste → Run\n`);
  }

  console.log('\n✅ All migrations prepared!');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to https://app.supabase.com');
  console.log('   2. Select your project');
  console.log("   3. Click 'SQL Editor' in the sidebar");
  console.log('   4. Copy and run each migration SQL shown above in order');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
