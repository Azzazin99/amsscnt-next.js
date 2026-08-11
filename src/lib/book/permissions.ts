import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type BookPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
  canViewSecret: number;
};

export async function getBookPermissions(
  userId: number,
): Promise<BookPermissionFlags> {
  const [row] = await db
    .select()
    .from(bookPermissions)
    .where(eq(bookPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    p3: row?.p3 ?? 0,
    canViewSecret: row?.canViewSecret ? 1 : 0,
  };
}

export function isBookModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("book")
  );
}

export function isDistrictBookUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolBookUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewBookList(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
): boolean {
  if (isBookModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictBookUser(user.loginStatus);
  }
  return user.organizationType === "school" && isSchoolBookUser(user.loginStatus);
}

export function canWriteBook(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
): boolean {
  if (isBookModuleAdmin(user)) return true;
  if (perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictBookUser(user.loginStatus);
}

export function canManageBookGroups(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
): boolean {
  return isBookModuleAdmin(user) || perms.p1 === 1;
}

export function canViewSecretBook(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
): boolean {
  return isBookModuleAdmin(user) || perms.canViewSecret === 1;
}

export function canAccessBookSecretLevel(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
  secretLevel: number,
): boolean {
  if (secretLevel <= 0) return true;
  return canViewSecretBook(user, perms);
}

export const canManageBookSettings = isBookModuleAdmin;
