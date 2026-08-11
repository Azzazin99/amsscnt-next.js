import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import { db } from "@/lib/db";
import { systemSyncCode } from "@/lib/db/schema";

export type SystemSyncCodeRow = {
  id: number;
  officeCode: string;
  syncCode: string;
};

export async function getSystemSyncCode(): Promise<SystemSyncCodeRow | null> {
  const [row] = await db
    .select()
    .from(systemSyncCode)
    .orderBy(asc(systemSyncCode.id))
    .limit(1);

  return row ?? null;
}

export async function ensureSystemSyncCodeRow(): Promise<SystemSyncCodeRow> {
  const existing = await getSystemSyncCode();
  if (existing) return existing;

  const district = await getDistrictSettingsRow();
  await db
    .insert(systemSyncCode)
    .values({
      officeCode: district?.officeCode ?? "1701",
      syncCode: "",
    });

  const inserted = await getSystemSyncCode();
  if (!inserted) {
    throw new Error("ไม่สามารถสร้างรายการรหัสเชื่อม สพฐ. ได้");
  }

  return inserted;
}

export async function updateSystemSyncCode(input: {
  officeCode: string;
  syncCode: string;
}): Promise<SystemSyncCodeRow> {
  const row = await ensureSystemSyncCodeRow();

  await db
    .update(systemSyncCode)
    .set({
      officeCode: input.officeCode.trim(),
      syncCode: input.syncCode.trim(),
    })
    .where(eq(systemSyncCode.id, row.id));

  const updated = await getSystemSyncCode();
  if (!updated) {
    throw new Error("ไม่สามารถบันทึกรหัสเชื่อม สพฐ. ได้");
  }

  return updated;
}

export function isSyncCodeConfigured(
  row: SystemSyncCodeRow | null,
): row is SystemSyncCodeRow & { syncCode: string } {
  return Boolean(row?.officeCode?.trim() && row?.syncCode?.trim());
}
