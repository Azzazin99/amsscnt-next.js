import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const [res] = await db.execute(sql`SELECT COUNT(*) as count FROM register_receives`);
  console.log("Receives count:", res);
}
main().then(() => process.exit(0)).catch(console.error);
