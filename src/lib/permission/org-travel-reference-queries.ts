import "server-only";

import { and, desc, eq, gte, isNull, lte, type SQL } from "drizzle-orm";
import { fiscalYearRange } from "@/lib/leave/regulation/fiscal-year";
import { getActivePermissionYear } from "@/lib/permission/queries";
import {
  mapReportRow,
  reportSelect,
  type PermissionReportListRow,
} from "@/lib/permission/reports/queries";
import type { PermissionScope } from "@/lib/permission/scope";
import { db } from "@/lib/db";
import { permissionRequests, people, schools } from "@/lib/db/schema";

export function orgUnitScopeCondition(scope: PermissionScope): SQL {
  if (scope.kind === "district") {
    return isNull(permissionRequests.schoolId);
  }
  return eq(permissionRequests.schoolId, scope.schoolId);
}

export async function listOrgTravelForPermissionReference(
  scope: PermissionScope,
): Promise<PermissionReportListRow[]> {
  const activeYear = await getActivePermissionYear();
  const conditions: SQL[] = [orgUnitScopeCondition(scope)];

  if (activeYear) {
    const { startIso, endIso } = fiscalYearRange(activeYear.budgetYear);
    conditions.push(lte(permissionRequests.travelStart, endIso));
    conditions.push(gte(permissionRequests.travelFinish, startIso));
  }

  const rows = await db
    .select(reportSelect)
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(and(...conditions))
    .orderBy(
      desc(permissionRequests.travelStart),
      desc(permissionRequests.id),
    );

  return rows.map(mapReportRow);
}
