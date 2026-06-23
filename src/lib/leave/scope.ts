import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import {
  canViewLeaveList,
  canWriteLeaveRequest,
  getLeavePermissions,
  type LeavePermissionFlags,
} from "@/lib/leave/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type LeaveScope =
  | { kind: "district" }
  | {
      kind: "school";
      schoolId: number;
      schoolCode: string;
      schoolName: string;
    };

export async function resolveSchoolIdByCode(
  schoolCode: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);
  return row?.id ?? null;
}

export async function resolveLeaveScope(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
): Promise<LeaveScope | null> {
  if (!canViewLeaveList(user, perms)) return null;

  if (
    user.organizationType === "district" &&
    (user.loginStatus === 99 ||
      user.loginStatus <= 4 ||
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.isAdmin ||
      user.isSuperAdmin ||
      user.moduleAdmins.includes("leave"))
  ) {
    return { kind: "district" };
  }

  if (user.organizationType !== "school") {
    if (perms.p1 === 1 || perms.p2 === 1 || user.moduleAdmins.includes("leave")) {
      return { kind: "district" };
    }
    return null;
  }

  const schoolCode = user.userSchoolCode?.trim();
  if (!schoolCode) return null;

  const schoolId = await resolveSchoolIdByCode(schoolCode);
  if (!schoolId) return null;

  return {
    kind: "school",
    schoolId,
    schoolCode,
    schoolName: user.userSchoolName?.trim() || schoolCode,
  };
}

export function scopeLabel(scope: LeaveScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requireLeaveScope(): Promise<{
  user: AmssSessionUser;
  perms: LeavePermissionFlags;
  scope: LeaveScope;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getLeavePermissions(Number(session.user.id));
  const scope = await resolveLeaveScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireLeaveWriteAccess() {
  const ctx = await requireLeaveScope();
  if (!canWriteLeaveRequest(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ยื่นคำขอลา");
  }
  return ctx;
}
