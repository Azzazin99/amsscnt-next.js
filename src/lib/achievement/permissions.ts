import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { achievementPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type AchievementPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
  officerPersonId: string | null;
};

export async function getAchievementPermissions(
  userId: number,
): Promise<AchievementPermissionFlags> {
  const [row] = await db
    .select()
    .from(achievementPermissions)
    .where(eq(achievementPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    p3: row?.p3 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isAchievementModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("achievement")
  );
}

export function isDistrictAchievementUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function canViewAchievementList(
  user: AmssSessionUser,
  perms: AchievementPermissionFlags,
): boolean {
  if (isAchievementModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1 || perms.p3 === 1) return true;
  return (
    user.organizationType === "district" &&
    isDistrictAchievementUser(user.loginStatus)
  );
}

export function canManageAchievementSettings(
  user: AmssSessionUser,
  _perms: AchievementPermissionFlags,
): boolean {
  return isAchievementModuleAdmin(user);
}

export const canManageAchievementStaffPermissions = isAchievementModuleAdmin;

export function canWriteAchievementScore(
  user: AmssSessionUser,
  perms: AchievementPermissionFlags,
): boolean {
  if (isAchievementModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  return (
    user.organizationType === "district" &&
    isDistrictAchievementUser(user.loginStatus)
  );
}
