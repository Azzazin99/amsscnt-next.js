import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { systemSyncCode, bookobecPermissions } from "../../src/lib/db/schema";
import {
  legacyTableExists,
  parseLegacyPermissionFlag,
  type ImportMaps,
} from "./shared";
import { queryClient } from "../../src/lib/db";

async function importSystemSyncCode() {
  if (!(await legacyTableExists("system_sync_code"))) {
    return;
  }

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM system_sync_code ORDER BY id LIMIT 1`;

  const row = rows[0];
  if (!row) return;

  const officeCode = String(row.office_code ?? "").trim();
  const syncCode = String(row.sync_code ?? "").trim();
  if (!officeCode) return;

  const existing = await db.select().from(systemSyncCode).limit(1);
  if (existing.length > 0) {
    await db
      .update(systemSyncCode)
      .set({ officeCode, syncCode })
      .where(eq(systemSyncCode.id, existing[0].id));
    return;
  }

  await db.insert(systemSyncCode).values({ officeCode, syncCode });
}

export async function importBookobec(maps: ImportMaps) {
  const { userMap } = maps;

  await importSystemSyncCode();

  if (!(await legacyTableExists("bookobec_permission"))) {
    return;
  }

  const permRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM bookobec_permission ORDER BY id`;

  const seenUsers = new Set<number>();
  for (const row of permRows) {
    const personId = String(row.person_id ?? "");
    const userId = userMap.get(personId);
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    await db.insert(bookobecPermissions).values({
      userId,
      p1: parseLegacyPermissionFlag(row.p1_bookobec),
      p2: parseLegacyPermissionFlag(row.p2_bookobec),
      officerPersonId: row.officer ? String(row.officer) : null,
    });
  }
}
