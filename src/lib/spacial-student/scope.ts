import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import {
  canViewSpacialStudentList,
  canWriteSpacialStudent,
  getSpacialStudentPermissions,
  type SpacialStudentPermissionFlags,
} from "@/lib/spacial-student/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type SpacialStudentScope =
  | { kind: "district" }
  | {
      kind: "school";
      schoolId: number;
      schoolCode: string;
      schoolName: string;
    };

async function resolveSchoolIdByCode(schoolCode: string): Promise<number | null> {
  const [row] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);
  return row?.id ?? null;
}

export async function resolveSpacialStudentScope(
  user: AmssSessionUser,
  perms: SpacialStudentPermissionFlags,
): Promise<SpacialStudentScope | null> {
  if (!canViewSpacialStudentList(user, perms)) return null;

  if (
    user.organizationType === "district" &&
    (user.loginStatus === 99 ||
      user.loginStatus <= 4 ||
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.isAdmin ||
      user.isSuperAdmin ||
      user.moduleAdmins.includes("spacial_student"))
  ) {
    return { kind: "district" };
  }

  if (user.organizationType !== "school") {
    if (
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.moduleAdmins.includes("spacial_student")
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

export function scopeLabel(scope: SpacialStudentScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requireSpacialStudentScope() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId =
    session.user.organizationType === "school"
      ? await resolveSchoolIdByCode(session.user.userSchoolCode?.trim() ?? "")
      : null;

  const perms = await getSpacialStudentPermissions(
    Number(session.user.id),
    schoolId,
  );
  const scope = await resolveSpacialStudentScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireSpacialStudentWriteAccess() {
  const ctx = await requireSpacialStudentScope();
  if (!canWriteSpacialStudent(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกข้อมูลนักเรียนพิเศษ");
  }
  return ctx;
}

export async function requireSpacialStudentSettingsAccess() {
  const ctx = await requireSpacialStudentScope();
  const { canManageSpacialStudentSettings } = await import(
    "@/lib/spacial-student/permissions"
  );
  if (!canManageSpacialStudentSettings(ctx.user, ctx.perms)) {
    redirect("/modules/spacial_student/students");
  }
  return ctx;
}
