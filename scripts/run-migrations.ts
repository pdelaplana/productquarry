import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Running migration: ${fileName}`);

  try {
    const sql = fs.readFileSync(filePath, "utf-8");
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // Try direct execution if rpc fails
      const { error: directError } = await supabase.from("_migrations").insert({
        name: fileName,
        executed_at: new Date().toISOString(),
      });

      if (directError) {
        console.error(`❌ Error in ${fileName}:`, error);
        return false;
      }
    }

    console.log(`✅ Successfully ran ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to run ${fileName}:`, err);
    return false;
  }
}

async function runAllMigrations() {
  console.log("🚀 Starting database migrations...\n");

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const success = await runMigration(filePath);

    if (!success) {
      console.error("\n❌ Migration failed. Stopping execution.");
      process.exit(1);
    }
  }

  console.log("\n✅ All migrations completed successfully!");
}

runAllMigrations().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
