import { eq } from "drizzle-orm";
import { getAccessibleModules } from "@/lib/modules/get-app-menu";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export function isIdocumentModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("idocument")
  );
}

export function isIdocumentDistrictStaff(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export async function canViewIdocument(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isIdocumentModuleAdmin(user)) return true;
  const accessible = await getAccessibleModules(user);
  return accessible.some((m) => m.slug === "idocument");
}

export function canWriteIdocument(user: AmssSessionUser): boolean {
  if (isIdocumentModuleAdmin(user)) return true;
  return (
    user.organizationType === "district" &&
    isIdocumentDistrictStaff(user.loginStatus)
  );
}

export async function getPersonPositionCode(
  personId: string,
): Promise<number | null> {
  const [row] = await db
    .select({ positionCode: people.positionCode })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);
  return row?.positionCode ?? null;
}

export function isIdocumentLeaderPosition(
  positionCode: number | null | undefined,
): boolean {
  return positionCode === 1 || positionCode === 2;
}

export async function canViewIdocumentInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isIdocumentModuleAdmin(user)) return true;
  if (user.loginStatus < 4) return true;
  const positionCode = await getPersonPositionCode(user.personId);
  return positionCode !== null && positionCode <= 3;
}

export async function canViewAllCompletedReports(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isIdocumentModuleAdmin(user)) return true;
  const positionCode = await getPersonPositionCode(user.personId);
  return isIdocumentLeaderPosition(positionCode);
}
