import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type NewsPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getNewsPermissions(
  userId: number,
): Promise<NewsPermissionFlags> {
  const [row] = await db
    .select()
    .from(newsPermissions)
    .where(eq(newsPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isNewsModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("news")
  );
}

export function isNewsDistrictUser(loginStatus: number): boolean {
  return loginStatus >= 2 && loginStatus <= 4;
}

export function canViewNewsList(
  user: AmssSessionUser,
  perms: NewsPermissionFlags,
): boolean {
  if (isNewsModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return isNewsDistrictUser(user.loginStatus);
}

export function canWriteNews(
  user: AmssSessionUser,
  perms: NewsPermissionFlags,
): boolean {
  if (isNewsModuleAdmin(user)) return true;
  return perms.p1 === 1;
}

export function canManageNewsSettings(user: AmssSessionUser): boolean {
  return isNewsModuleAdmin(user);
}
