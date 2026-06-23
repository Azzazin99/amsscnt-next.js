import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageAffairSettings,
  canViewAffairList,
  canWriteAffair,
  getAffairPermissions,
  type AffairPermissionFlags,
} from "@/lib/affair/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireAffairScope(): Promise<{
  user: AmssSessionUser;
  perms: AffairPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getAffairPermissions(Number(session.user.id));
  if (!canViewAffairList(session.user, perms)) {
    redirect("/home");
  }

  return { user: session.user, perms };
}

export async function requireAffairWriteAccess() {
  const ctx = await requireAffairScope();
  if (!canWriteAffair(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกภารกิจผู้อำนวยการ");
  }
  return ctx;
}

export async function requireAffairSettingsAccess() {
  const ctx = await requireAffairScope();
  if (!canManageAffairSettings(ctx.user)) {
    redirect("/modules/affair");
  }
  return ctx;
}
