import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissionPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type PermissionModuleFlags = {
  p1: number;
  p2: number;
  officerPersonId: string | null;
};

export async function getPermissionModuleFlags(
  userId: number,
): Promise<PermissionModuleFlags> {
  const [row] = await db
    .select()
    .from(permissionPermissions)
    .where(eq(permissionPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isPermissionModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("permission")
  );
}

export function isDistrictPermissionUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolPermissionUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewPermissionList(
  user: AmssSessionUser,
  perms: PermissionModuleFlags,
): boolean {
  if (isPermissionModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictPermissionUser(user.loginStatus);
  }
  return (
    user.organizationType === "school" &&
    isSchoolPermissionUser(user.loginStatus)
  );
}

export function canManagePermissionSettings(
  user: AmssSessionUser,
  perms: PermissionModuleFlags,
): boolean {
  return isPermissionModuleAdmin(user) || perms.p1 === 1;
}

export function canWritePermissionRequest(
  user: AmssSessionUser,
  perms: PermissionModuleFlags,
): boolean {
  if (isPermissionModuleAdmin(user)) return true;
  if (perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictPermissionUser(user.loginStatus);
}

export function canApprovePermission(
  user: AmssSessionUser,
  perms: PermissionModuleFlags,
): boolean {
  return isPermissionModuleAdmin(user) || perms.p1 === 1;
}
