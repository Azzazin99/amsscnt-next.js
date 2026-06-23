import { and, eq, isNull, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerReceives, registerSends, schools } from "@/lib/db/schema";
import {
  canViewDistrictRegisters,
  canViewSchoolRegisters,
  canWriteDistrictRegisters,
  canWriteSchoolRegisters,
  getBookregisterPermissions,
  type BookregisterPermissionFlags,
} from "@/lib/bookregister/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type BookregisterScope =
  | { kind: "district"; schoolId: null }
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

export async function resolveBookregisterScope(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): Promise<BookregisterScope | null> {
  if (canViewDistrictRegisters(user, perms)) {
    return { kind: "district", schoolId: null };
  }

  if (!canViewSchoolRegisters(user)) return null;

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

export function scopeReceiveSchoolCondition(scope: BookregisterScope): SQL {
  if (scope.kind === "district") return isNull(registerReceives.schoolId);
  return eq(registerReceives.schoolId, scope.schoolId);
}

export function scopeSendSchoolCondition(scope: BookregisterScope): SQL {
  if (scope.kind === "district") return isNull(registerSends.schoolId);
  return eq(registerSends.schoolId, scope.schoolId);
}

export function canWriteRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  scope: BookregisterScope,
): boolean {
  if (scope.kind === "district") {
    return canWriteDistrictRegisters(user, perms);
  }
  return canWriteSchoolRegisters(user, perms);
}

export function scopeLabel(scope: BookregisterScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requireBookregisterScope(): Promise<{
  user: AmssSessionUser;
  perms: BookregisterPermissionFlags;
  scope: BookregisterScope;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  const scope = await resolveBookregisterScope(session.user, perms);
  if (!scope) redirect("/modules/bookregister");

  return { user: session.user, perms, scope };
}

export async function requireBookregisterWriteScope() {
  const ctx = await requireBookregisterScope();
  if (!canWriteRegisters(ctx.user, ctx.perms, ctx.scope)) {
    throw new Error("ไม่มีสิทธิ์บันทึกทะเบียน");
  }
  return ctx;
}
