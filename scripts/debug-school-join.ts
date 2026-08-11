import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { schools } from "../src/lib/db/schema";

async function main() {
  const [rows] = (await db.execute(sql.raw("SELECT * FROM system_school LIMIT 10"))) as any[];
  console.log("system_school legacy rows:", rows);

  const schoolDbRows = await db.select().from(schools).limit(10);
  console.log("schools Drizzle table rows:", schoolDbRows);
  process.exit(0);
}

main().catch(console.error);
