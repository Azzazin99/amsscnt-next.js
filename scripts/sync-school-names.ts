import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { schools } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Syncing School Names from legacy system_school ===");

  // Check if system_school table exists and has rows
  const [legacyRows] = (await db.execute(
    sql.raw("SELECT school_code, school_name FROM system_school"),
  )) as any[];

  console.log(`Found ${legacyRows?.length ?? 0} rows in legacy system_school`);

  if (!legacyRows || legacyRows.length === 0) {
    console.log("No rows in system_school. Checking AMSS.sql or manual mapping...");
    return;
  }

  let updatedCount = 0;
  for (const legacyRow of legacyRows) {
    const code = String(legacyRow.school_code).trim();
    const name = String(legacyRow.school_name).trim();

    if (!code || !name) continue;

    const res = await db
      .update(schools)
      .set({ name })
      .where(eq(schools.schoolCode, code));

    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} school names in schools table!`);
  process.exit(0);
}

main().catch(console.error);
