import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewAchievementList,
  canWriteAchievementScore,
  getAchievementPermissions,
  type AchievementPermissionFlags,
} from "@/lib/achievement/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type AchievementScope = { kind: "district" };

export async function resolveAchievementScope(
  user: AmssSessionUser,
  perms: AchievementPermissionFlags,
): Promise<AchievementScope | null> {
  if (!canViewAchievementList(user, perms)) return null;
  return { kind: "district" };
}

export function scopeLabel(_scope: AchievementScope): string {
  return "ระดับเขต";
}

export async function requireAchievementScope() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getAchievementPermissions(Number(session.user.id));
  const scope = await resolveAchievementScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireAchievementWriteAccess() {
  const ctx = await requireAchievementScope();
  if (!canWriteAchievementScore(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกคะแนน");
  }
  return ctx;
}
