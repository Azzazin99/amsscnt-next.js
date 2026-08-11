import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewPlan,
  canWritePlan,
  getPlanPermissions,
  type PlanPermissionFlags,
} from "@/lib/plan/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requirePlanAccess(): Promise<{
  user: AmssSessionUser;
  perms: PlanPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPlanPermissions(session.user.personId);
  if (!canViewPlan(session.user, perms)) redirect("/home");

  return { user: session.user, perms };
}

export async function requirePlanWriteAccess(): Promise<{
  user: AmssSessionUser;
  perms: PlanPermissionFlags;
}> {
  const ctx = await requirePlanAccess();
  if (!canWritePlan(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกข้อมูลแผนงาน");
  }
  return ctx;
}

export const requirePlanEditAccess = requirePlanWriteAccess;
export const requirePlanOperateAccess = requirePlanWriteAccess;
