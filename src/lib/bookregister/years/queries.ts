import type { BookregisterScope } from "@/lib/bookregister/scope";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { registerYears } from "@/lib/db/schema";

export type RegisterYearRow = {
  id: number;
  year: number;
  yearActive: boolean;
  startReceiveNum: number;
  startSendNum: number;
  startCommandNum: number;
  startCertificateNum: number;
};

export async function listDistrictYears(): Promise<RegisterYearRow[]> {
  const rows = await db
    .select({
      id: registerYears.id,
      year: registerYears.year,
      yearActive: registerYears.yearActive,
      startReceiveNum: registerYears.startReceiveNum,
      startSendNum: registerYears.startSendNum,
      startCommandNum: registerYears.startCommandNum,
      startCertificateNum: registerYears.startCertificateNum,
    })
    .from(registerYears)
    .where(isNull(registerYears.schoolId))
    .orderBy(desc(registerYears.year));

  return rows;
}

export async function getDistrictYear(id: number) {
  const [row] = await db
    .select()
    .from(registerYears)
    .where(and(eq(registerYears.id, id), isNull(registerYears.schoolId)))
    .limit(1);

  return row ?? null;
}

export async function getActiveDistrictYear() {
  const [row] = await db
    .select()
    .from(registerYears)
    .where(
      and(isNull(registerYears.schoolId), eq(registerYears.yearActive, true)),
    )
    .limit(1);

  return row ?? null;
}

export async function getActiveSchoolYear(schoolId: number) {
  const [row] = await db
    .select()
    .from(registerYears)
    .where(
      and(
        eq(registerYears.schoolId, schoolId),
        eq(registerYears.yearActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getActiveRegisterYear(scope: BookregisterScope) {
  if (scope.kind === "district") return getActiveDistrictYear();
  return getActiveSchoolYear(scope.schoolId);
}

export async function listSchoolYears(
  schoolId: number,
): Promise<RegisterYearRow[]> {
  return db
    .select({
      id: registerYears.id,
      year: registerYears.year,
      yearActive: registerYears.yearActive,
      startReceiveNum: registerYears.startReceiveNum,
      startSendNum: registerYears.startSendNum,
      startCommandNum: registerYears.startCommandNum,
      startCertificateNum: registerYears.startCertificateNum,
    })
    .from(registerYears)
    .where(eq(registerYears.schoolId, schoolId))
    .orderBy(desc(registerYears.year));
}

export async function listRegisterYears(
  scope: BookregisterScope,
): Promise<RegisterYearRow[]> {
  if (scope.kind === "district") return listDistrictYears();
  return listSchoolYears(scope.schoolId);
}

export async function deactivateOtherDistrictYears(exceptId?: number) {
  const rows = await db
    .select({ id: registerYears.id })
    .from(registerYears)
    .where(isNull(registerYears.schoolId));

  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(registerYears)
      .set({ yearActive: false })
      .where(eq(registerYears.id, row.id));
  }
}
