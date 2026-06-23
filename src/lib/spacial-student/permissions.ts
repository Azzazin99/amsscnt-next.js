import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { spacialStudentPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type SpacialStudentPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
  officerPersonId: string | null;
};

export async function getSpacialStudentPermissions(
  userId: number,
  schoolId: number | null,
): Promise<SpacialStudentPermissionFlags> {
  const conditions = [eq(spacialStudentPermissions.userId, userId)];
  if (schoolId) {
    conditions.push(eq(spacialStudentPermissions.schoolId, schoolId));
  } else {
    conditions.push(isNull(spacialStudentPermissions.schoolId));
  }

  const [row] = await db
    .select()
    .from(spacialStudentPermissions)
    .where(and(...conditions))
    .limit(1);

  if (!row && schoolId) {
    const [districtRow] = await db
      .select()
      .from(spacialStudentPermissions)
      .where(
        and(
          eq(spacialStudentPermissions.userId, userId),
          isNull(spacialStudentPermissions.schoolId),
        ),
      )
      .limit(1);
    return {
      p1: districtRow?.p1 ?? 0,
      p2: districtRow?.p2 ?? 0,
      p3: districtRow?.p3 ?? 0,
      officerPersonId: districtRow?.officerPersonId ?? null,
    };
  }

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    p3: row?.p3 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isSpacialStudentModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("spacial_student")
  );
}

export function isDistrictSpacialUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolSpacialUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewSpacialStudentList(
  user: AmssSessionUser,
  perms: SpacialStudentPermissionFlags,
): boolean {
  if (isSpacialStudentModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1 || perms.p3 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictSpacialUser(user.loginStatus);
  }
  return (
    user.organizationType === "school" && isSchoolSpacialUser(user.loginStatus)
  );
}

export function canManageSpacialStudentSettings(
  user: AmssSessionUser,
  perms: SpacialStudentPermissionFlags,
): boolean {
  return isSpacialStudentModuleAdmin(user) || perms.p1 === 1;
}

export function canWriteSpacialStudent(
  user: AmssSessionUser,
  perms: SpacialStudentPermissionFlags,
): boolean {
  if (isSpacialStudentModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictSpacialUser(user.loginStatus);
}
