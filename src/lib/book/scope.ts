import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import {
  canViewBookList,
  canWriteBook,
  getBookPermissions,
  type BookPermissionFlags,
} from "@/lib/book/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export type BookScope =
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

export async function resolveBookScope(
  user: AmssSessionUser,
  perms: BookPermissionFlags,
): Promise<BookScope | null> {
  if (!canViewBookList(user, perms)) return null;

  if (
    user.organizationType === "district" &&
    (user.loginStatus === 99 ||
      user.loginStatus <= 4 ||
      perms.p1 === 1 ||
      user.isAdmin ||
      user.isSuperAdmin ||
      user.moduleAdmins.includes("book"))
  ) {
    return { kind: "district" };
  }

  if (user.organizationType !== "school") {
    if (perms.p1 === 1 || user.moduleAdmins.includes("book")) {
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

/** คีย์ inbox ตาม legacy send_to */
export function inboxSendTo(scope: BookScope): string {
  if (scope.kind === "district") return "saraban";
  return scope.schoolCode;
}

export function scopeLabel(scope: BookScope): string {
  if (scope.kind === "district") return "ระดับเขต";
  return scope.schoolName;
}

export async function requireBookScope(): Promise<{
  user: AmssSessionUser;
  perms: BookPermissionFlags;
  scope: BookScope;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookPermissions(Number(session.user.id));
  const scope = await resolveBookScope(session.user, perms);
  if (!scope) redirect("/home");

  return { user: session.user, perms, scope };
}

export async function requireBookWriteAccess() {
  const ctx = await requireBookScope();
  if (!canWriteBook(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกหนังสือ");
  }
  return ctx;
}
