import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import {
  canViewPermissionList,
  canWritePermissionRequest,
  getPermissionModuleFlags,
  type PermissionModuleFlags,
} from "@/lib/permission/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type PermissionScope =
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

export async function resolvePermissionScope(
  user: AmssSessionUser,
  perms: PermissionModuleFlags,
): Promise<PermissionScope | null> {
  if (!canViewPermissionList(user, perms)) return null;

  if (
    user.organizationType === "district" &&
    (user.loginStatus === 99 ||
      user.loginStatus <= 4 ||
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.isAdmin ||
      user.isSuperAdmin ||
      user.moduleAdmins.includes("permission"))
  ) {
    return { kind: "district" };
  }

  if (user.organizationType !== "school") {
    if (
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.moduleAdmins.includes("permission")
    ) {
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

export function scopeLabel(scope: PermissionScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requirePermissionScope(): Promise<{
  user: AmssSessionUser;
  perms: PermissionModuleFlags;
  scope: PermissionScope;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPermissionModuleFlags(Number(session.user.id));
  const scope = await resolvePermissionScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requirePermissionWriteAccess() {
  const ctx = await requirePermissionScope();
  if (!canWritePermissionRequest(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ยื่นคำขอไปราชการ");
  }
  return ctx;
}
