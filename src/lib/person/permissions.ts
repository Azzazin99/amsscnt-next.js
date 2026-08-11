import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { personPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type PersonPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
};

export async function getPersonPermissions(
  userId: number,
): Promise<PersonPermissionFlags> {
  const [row] = await db
    .select()
    .from(personPermissions)
    .where(eq(personPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    p3: row?.p3 ?? 0,
  };
}

export function isPersonModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("person")
  );
}

export function isDistrictPersonUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolPersonUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewPersonList(
  user: AmssSessionUser,
  perms: PersonPermissionFlags,
): boolean {
  if (isPersonModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictPersonUser(user.loginStatus);
  }
  return (
    user.organizationType === "school" &&
    isSchoolPersonUser(user.loginStatus)
  );
}

export function canManagePersonPermissions(
  user: AmssSessionUser,
  perms: PersonPermissionFlags,
): boolean {
  return isPersonModuleAdmin(user) || perms.p1 === 1;
}

export const canManagePersonStaffPermissions = isPersonModuleAdmin;

export function canWritePerson(
  user: AmssSessionUser,
  perms: PersonPermissionFlags,
): boolean {
  if (isPersonModuleAdmin(user)) return true;
  if (perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictPersonUser(user.loginStatus);
}

export function canDeletePerson(
  user: AmssSessionUser,
  perms: PersonPermissionFlags,
): boolean {
  return isPersonModuleAdmin(user) || perms.p3 === 1;
}
