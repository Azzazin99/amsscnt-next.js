import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { affairPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type AffairPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getAffairPermissions(
  userId: number,
): Promise<AffairPermissionFlags> {
  const [row] = await db
    .select()
    .from(affairPermissions)
    .where(eq(affairPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isAffairModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("affair")
  );
}

export function isAffairViewer(loginStatus: number): boolean {
  return loginStatus <= 14;
}

export function isAffairDistrictStaff(loginStatus: number): boolean {
  return loginStatus >= 2 && loginStatus <= 4;
}

export function canViewAffairList(
  user: AmssSessionUser,
  perms: AffairPermissionFlags,
): boolean {
  if (isAffairModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return isAffairViewer(user.loginStatus);
}

export function canWriteAffair(
  user: AmssSessionUser,
  perms: AffairPermissionFlags,
): boolean {
  if (isAffairModuleAdmin(user)) return true;
  if (perms.p1 === 1 && isAffairDistrictStaff(user.loginStatus)) return true;
  return false;
}

export function canManageAffairSettings(user: AmssSessionUser): boolean {
  return isAffairModuleAdmin(user);
}

export const canManageAffairStaffPermissions = isAffairModuleAdmin;
