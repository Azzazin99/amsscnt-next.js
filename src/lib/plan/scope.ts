import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewPlan, canWritePlan } from "@/lib/plan/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requirePlanAccess(): Promise<{ user: AmssSessionUser }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canViewPlan(session.user)) redirect("/home");
  return { user: session.user };
}

export async function requirePlanWriteAccess(): Promise<{ user: AmssSessionUser }> {
  const ctx = await requirePlanAccess();
  if (!canWritePlan(ctx.user)) {
    throw new Error("ไม่มีสิทธิ์บันทึกข้อมูลแผนงาน");
  }
  return ctx;
}
