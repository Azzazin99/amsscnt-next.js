import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cabinetPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type CabinetPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getCabinetPermissions(
  userId: number,
): Promise<CabinetPermissionFlags> {
  const [row] = await db
    .select()
    .from(cabinetPermissions)
    .where(eq(cabinetPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isCabinetModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("cabinet")
  );
}

export function isCabinetDistrictUser(loginStatus: number): boolean {
  return loginStatus >= 2 && loginStatus <= 4;
}

export function canViewCabinetList(
  user: AmssSessionUser,
  perms: CabinetPermissionFlags,
): boolean {
  if (isCabinetModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return isCabinetDistrictUser(user.loginStatus);
}

export function canUploadCabinet(
  user: AmssSessionUser,
  perms: CabinetPermissionFlags,
): boolean {
  return canViewCabinetList(user, perms);
}

export function canManageCabinetSettings(
  user: AmssSessionUser,
  perms: CabinetPermissionFlags,
): boolean {
  return isCabinetModuleAdmin(user) || perms.p1 === 1;
}
