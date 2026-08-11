import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function main() {
  console.log("Adding columns to people table...");
  try {
    await db.execute(sql`ALTER TABLE people ADD COLUMN birth_date DATE`);
    console.log("Added birth_date column");
  } catch (e: any) {
    console.log("birth_date:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE people ADD COLUMN person_order INT DEFAULT 0`);
    console.log("Added person_order column");
  } catch (e: any) {
    console.log("person_order:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE people ADD COLUMN picture_url VARCHAR(255)`);
    console.log("Added picture_url column");
  } catch (e: any) {
    console.log("picture_url:", e.message);
  }

  console.log("Migration finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
