import type { MySqlTable } from "drizzle-orm/mysql-core";
import { db } from ".";

/**
 * Insert a row into a MySQL table and return its insertId.
 * Replaces PostgreSQL's `.returning({ id: table.id })`.
 */
export async function insertAndGetId<T extends MySqlTable>(
  table: T,
  values: T["$inferInsert"],
): Promise<number> {
  const [result] = await db.insert(table).values(values);
  return (result as { insertId: number }).insertId;
}
