import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageCarSettings,
  canViewCarList,
  canWriteCarRequest,
  getCarPermissions,
  type CarPermissionFlags,
} from "@/lib/car/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type CarScope = { kind: "district" };

export async function resolveCarScope(
  user: AmssSessionUser,
  perms: CarPermissionFlags,
): Promise<CarScope | null> {
  if (!canViewCarList(user, perms)) return null;
  return { kind: "district" };
}

export function scopeLabel(_scope: CarScope): string {
  return "ระดับเขต";
}

export async function requireCarScope(): Promise<{
  user: AmssSessionUser;
  perms: CarPermissionFlags;
  scope: CarScope;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getCarPermissions(Number(session.user.id));
  const scope = await resolveCarScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireCarWriteAccess() {
  const ctx = await requireCarScope();
  if (!canWriteCarRequest(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ยื่นคำขอใช้ยานพาหนะ");
  }
  return ctx;
}

export async function requireCarSettingsAccess() {
  const ctx = await requireCarScope();
  if (!canManageCarSettings(ctx.user, ctx.perms)) {
    redirect("/modules/car/requests");
  }
  return ctx;
}
