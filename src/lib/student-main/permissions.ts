import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type StudentPermissionFlags = {
  p1: number;
  p2: number;
  officerPersonId: string | null;
};

export async function getStudentPermissions(
  userId: number,
  schoolId: number | null,
): Promise<StudentPermissionFlags> {
  const conditions = [eq(studentPermissions.userId, userId)];
  if (schoolId) {
    conditions.push(eq(studentPermissions.schoolId, schoolId));
  } else {
    conditions.push(isNull(studentPermissions.schoolId));
  }

  const [row] = await db
    .select()
    .from(studentPermissions)
    .where(and(...conditions))
    .limit(1);

  if (!row && schoolId) {
    const [districtRow] = await db
      .select()
      .from(studentPermissions)
      .where(
        and(
          eq(studentPermissions.userId, userId),
          isNull(studentPermissions.schoolId),
        ),
      )
      .limit(1);
    return {
      p1: districtRow?.p1 ?? 0,
      p2: districtRow?.p2 ?? 0,
      officerPersonId: districtRow?.officerPersonId ?? null,
    };
  }

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isStudentModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("student_main")
  );
}

export function isDistrictStudentUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolStudentUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewStudentList(
  user: AmssSessionUser,
  perms: StudentPermissionFlags,
): boolean {
  if (isStudentModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictStudentUser(user.loginStatus);
  }
  return (
    user.organizationType === "school" && isSchoolStudentUser(user.loginStatus)
  );
}

export function canManageStudentSettings(
  user: AmssSessionUser,
  perms: StudentPermissionFlags,
): boolean {
  return isStudentModuleAdmin(user) || perms.p1 === 1;
}

export function canWriteStudent(
  user: AmssSessionUser,
  perms: StudentPermissionFlags,
): boolean {
  if (isStudentModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictStudentUser(user.loginStatus);
}
