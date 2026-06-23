import "server-only";

import { and, eq, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { bangkokTodayIso } from "@/lib/book/dates";
import { db } from "@/lib/db";
import { people, personDelegate } from "@/lib/db/schema";
import { requireLeaveScope, type LeaveScope } from "@/lib/leave/scope";

export async function isSchoolPrincipalReportViewer(
  personId: string,
  schoolCode: string | null | undefined,
): Promise<boolean> {
  const [person] = await db
    .select({
      organizationType: people.organizationType,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);

  if (
    person?.organizationType === "school" &&
    person.positionCode === 1
  ) {
    return true;
  }

  const code = schoolCode?.trim();
  if (!code) return false;

  const today = bangkokTodayIso();
  const [delegate] = await db
    .select({ id: personDelegate.id })
    .from(personDelegate)
    .where(
      and(
        eq(personDelegate.personId, personId),
        eq(personDelegate.schoolCode, code),
        lte(personDelegate.start, today),
        gte(personDelegate.finish, today),
      ),
    )
    .limit(1);

  return delegate != null;
}

export async function resolveSchoolPrincipalReportViewer(
  personId: string,
  scope: LeaveScope,
): Promise<boolean> {
  if (scope.kind !== "school") return false;
  return isSchoolPrincipalReportViewer(personId, scope.schoolCode);
}

/** เปิดรายงานระดับเขต — login เขต หรือ ผอ./รก. โรงเรียน */
export async function requireDistrictLeaveReportPage() {
  const ctx = await requireLeaveScope();
  const isPrincipalViewer = await resolveSchoolPrincipalReportViewer(
    ctx.user.personId,
    ctx.scope,
  );

  if (ctx.scope.kind !== "district" && !isPrincipalViewer) {
    redirect("/modules/leave/reports");
  }

  const reportScope: LeaveScope =
    ctx.scope.kind === "district" ? ctx.scope : { kind: "district" };

  return { ...ctx, isPrincipalViewer, reportScope };
}
