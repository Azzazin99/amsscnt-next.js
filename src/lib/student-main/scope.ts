import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import {
  canViewStudentList,
  canWriteStudent,
  getStudentPermissions,
  type StudentPermissionFlags,
} from "@/lib/student-main/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type StudentScope =
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

export async function resolveStudentScope(
  user: AmssSessionUser,
  perms: StudentPermissionFlags,
): Promise<StudentScope | null> {
  if (!canViewStudentList(user, perms)) return null;

  if (
    user.organizationType === "district" &&
    (user.loginStatus === 99 ||
      user.loginStatus <= 4 ||
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.isAdmin ||
      user.isSuperAdmin ||
      user.moduleAdmins.includes("student_main"))
  ) {
    return { kind: "district" };
  }

  if (user.organizationType !== "school") {
    if (
      perms.p1 === 1 ||
      perms.p2 === 1 ||
      user.moduleAdmins.includes("student_main")
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

export function scopeLabel(scope: StudentScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requireStudentScope() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId =
    session.user.organizationType === "school"
      ? await resolveSchoolIdByCode(session.user.userSchoolCode?.trim() ?? "")
      : null;

  const perms = await getStudentPermissions(
    Number(session.user.id),
    schoolId,
  );
  const scope = await resolveStudentScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireStudentWriteAccess() {
  const ctx = await requireStudentScope();
  if (!canWriteStudent(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกข้อมูลนักเรียน");
  }
  return ctx;
}

export async function requireStudentSettingsAccess() {
  const ctx = await requireStudentScope();
  const { canManageStudentSettings } = await import(
    "@/lib/student-main/permissions"
  );
  if (!canManageStudentSettings(ctx.user, ctx.perms)) {
    redirect("/modules/student_main/students");
  }
  return ctx;
}
