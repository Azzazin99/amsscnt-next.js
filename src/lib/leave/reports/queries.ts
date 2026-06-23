import "server-only";

import { and, asc, count, desc, eq, gte, inArray, lte, or, type SQL } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import {
  leaveCancellations,
  leaveCollect,
  leaveRequests,
  people,
  schools,
  users,
} from "@/lib/db/schema";
import {
  grantStatusLabel,
  leaveTypeLabel,
} from "@/lib/leave/constants";
import { resolveLeavePersonDisplayName } from "@/lib/leave/display-name";
import { PAGE_SIZE } from "@/lib/leave/queries";
import { overlapDays, reportPeriodRange } from "@/lib/leave/reports/period";
import type {
  LeaveCancellationReportRow,
  LeaveReportListRow,
  LeaveReportPeriod,
  LeaveSickPrivacyBirthRow,
  LeaveTypeStat,
  LeaveVacationStatRow,
} from "@/lib/leave/reports/types";
import type { LeaveScope } from "@/lib/leave/scope";
import { positionLabel } from "@/lib/person/position-labels";

function requestScopeCondition(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(leaveRequests.schoolId, scope.schoolId),
    eq(leaveRequests.personId, viewerPersonId),
  );
}

function cancellationScopeCondition(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(leaveRequests.schoolId, scope.schoolId),
    eq(leaveCancellations.personId, viewerPersonId),
  );
}

function emptyStat(): LeaveTypeStat {
  return { times: 0, days: 0 };
}

function addStat(
  stat: LeaveTypeStat,
  days: number,
): LeaveTypeStat {
  if (days <= 0) return stat;
  return { times: stat.times + 1, days: stat.days + days };
}

type ApprovedLeaveRow = {
  personId: string;
  leaveType: number;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
};

type ApprovedCancelRow = {
  personId: string;
  leaveType: number;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
};

async function loadApprovedLeavesInRange(
  personIds: string[],
  startIso: string,
  endIso: string,
): Promise<ApprovedLeaveRow[]> {
  if (personIds.length === 0) return [];

  return db
    .select({
      personId: leaveRequests.personId,
      leaveType: leaveRequests.leaveType,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
    })
    .from(leaveRequests)
    .where(
      and(
        inArray(leaveRequests.personId, personIds),
        eq(leaveRequests.commanderGrant, 1),
        lte(leaveRequests.leaveStart, endIso),
        gte(leaveRequests.leaveFinish, startIso),
      ),
    );
}

async function loadApprovedCancellationsInRange(
  personIds: string[],
  startIso: string,
  endIso: string,
): Promise<ApprovedCancelRow[]> {
  if (personIds.length === 0) return [];

  return db
    .select({
      personId: leaveCancellations.personId,
      leaveType: leaveCancellations.leaveType,
      cancelStart: leaveCancellations.cancelStart,
      cancelFinish: leaveCancellations.cancelFinish,
      cancelTotal: leaveCancellations.cancelTotal,
    })
    .from(leaveCancellations)
    .where(
      and(
        inArray(leaveCancellations.personId, personIds),
        eq(leaveCancellations.commanderGrant, 1),
        lte(leaveCancellations.cancelStart, endIso),
        gte(leaveCancellations.cancelFinish, startIso),
      ),
    );
}

function aggregateTypeStats(
  personId: string,
  leaves: ApprovedLeaveRow[],
  cancellations: ApprovedCancelRow[],
  startIso: string,
  endIso: string,
): { sick: LeaveTypeStat; privacy: LeaveTypeStat; birth: LeaveTypeStat } {
  const stats = {
    sick: emptyStat(),
    privacy: emptyStat(),
    birth: emptyStat(),
  };

  for (const row of leaves.filter((r) => r.personId === personId)) {
    const days = overlapDays(startIso, endIso, row.leaveStart, row.leaveFinish);
    if (row.leaveType === 1) stats.sick = addStat(stats.sick, days);
    if (row.leaveType === 2) stats.privacy = addStat(stats.privacy, days);
    if (row.leaveType === 3) stats.birth = addStat(stats.birth, days);
  }

  for (const row of cancellations.filter((r) => r.personId === personId)) {
    const days = overlapDays(
      startIso,
      endIso,
      row.cancelStart,
      row.cancelFinish,
    );
    if (row.leaveType === 1 && days > 0) {
      stats.sick = {
        times: Math.max(0, stats.sick.times - 1),
        days: Math.max(0, stats.sick.days - days),
      };
    }
    if (row.leaveType === 2 && days > 0) {
      stats.privacy = {
        times: Math.max(0, stats.privacy.times - 1),
        days: Math.max(0, stats.privacy.days - days),
      };
    }
    if (row.leaveType === 3 && days > 0) {
      stats.birth = {
        times: Math.max(0, stats.birth.times - 1),
        days: Math.max(0, stats.birth.days - days),
      };
    }
  }

  return stats;
}

export async function countLeaveOnDate(
  scope: LeaveScope,
  viewerPersonId: string,
  isoDate: string,
): Promise<number> {
  const conditions = [
    requestScopeCondition(scope, viewerPersonId),
    lte(leaveRequests.leaveStart, isoDate),
    gte(leaveRequests.leaveFinish, isoDate),
  ].filter(Boolean) as SQL[];

  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .where(and(...conditions));

  return Number(row?.total ?? 0);
}

export async function listLeaveOnDate(
  scope: LeaveScope,
  viewerPersonId: string,
  isoDate: string,
): Promise<LeaveReportListRow[]> {
  const conditions = [
    requestScopeCondition(scope, viewerPersonId),
    lte(leaveRequests.leaveStart, isoDate),
    gte(leaveRequests.leaveFinish, isoDate),
  ].filter(Boolean) as SQL[];

  const rows = await db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolName: schools.name,
      createdAt: leaveRequests.createdAt,
      leaveType: leaveRequests.leaveType,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
      commanderGrant: leaveRequests.commanderGrant,
    })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(and(...conditions))
    .orderBy(asc(leaveRequests.leaveType), asc(leaveRequests.id));

  return rows.map((row) => ({
    id: row.id,
    displayName: resolveLeavePersonDisplayName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      personId: row.personId,
    }),
    schoolName: row.schoolName,
    requestDate: row.createdAt.toISOString().slice(0, 10),
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    leaveTotal: row.leaveTotal,
    grantLabel: grantStatusLabel(row.commanderGrant),
  }));
}

export async function countLeaveReportAll(
  scope: LeaveScope,
  viewerPersonId: string,
): Promise<number> {
  const scopeCond = requestScopeCondition(scope, viewerPersonId);
  const query = db.select({ total: count() }).from(leaveRequests);
  const [row] = scopeCond ? await query.where(scopeCond) : await query;
  return Number(row?.total ?? 0);
}

export async function listLeaveReportAllPage(input: {
  scope: LeaveScope;
  viewerPersonId: string;
  page: number;
}): Promise<LeaveReportListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const scopeCond = requestScopeCondition(input.scope, input.viewerPersonId);

  const base = db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolName: schools.name,
      createdAt: leaveRequests.createdAt,
      leaveType: leaveRequests.leaveType,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
      commanderGrant: leaveRequests.commanderGrant,
    })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .orderBy(desc(leaveRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = scopeCond ? await base.where(scopeCond) : await base;

  return rows.map((row) => ({
    id: row.id,
    displayName: resolveLeavePersonDisplayName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      personId: row.personId,
    }),
    schoolName: row.schoolName,
    requestDate: row.createdAt.toISOString().slice(0, 10),
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    leaveTotal: row.leaveTotal,
    grantLabel: grantStatusLabel(row.commanderGrant),
  }));
}

export async function countCancellationReport(
  scope: LeaveScope,
  viewerPersonId: string,
): Promise<number> {
  const scopeCond = cancellationScopeCondition(scope, viewerPersonId);
  const query = db
    .select({ total: count() })
    .from(leaveCancellations)
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    );

  const [row] = scopeCond ? await query.where(scopeCond) : await query;
  return Number(row?.total ?? 0);
}

export async function listCancellationReportPage(input: {
  scope: LeaveScope;
  viewerPersonId: string;
  page: number;
}): Promise<LeaveCancellationReportRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const scopeCond = cancellationScopeCondition(input.scope, input.viewerPersonId);

  const base = db
    .select({
      id: leaveCancellations.id,
      personId: leaveCancellations.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      createdAt: leaveCancellations.createdAt,
      leaveType: leaveCancellations.leaveType,
      cancelStart: leaveCancellations.cancelStart,
      cancelFinish: leaveCancellations.cancelFinish,
      cancelTotal: leaveCancellations.cancelTotal,
      commanderGrant: leaveCancellations.commanderGrant,
    })
    .from(leaveCancellations)
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(users, eq(users.personId, leaveCancellations.personId))
    .orderBy(desc(leaveCancellations.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = scopeCond ? await base.where(scopeCond) : await base;

  return rows.map((row) => ({
    id: row.id,
    displayName: resolveLeavePersonDisplayName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      personId: row.personId,
    }),
    requestDate: row.createdAt.toISOString().slice(0, 10),
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    cancelStart: row.cancelStart,
    cancelFinish: row.cancelFinish,
    cancelTotal: row.cancelTotal,
    grantLabel: grantStatusLabel(row.commanderGrant),
  }));
}

async function listDistrictPeople() {
  return db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(
      and(eq(people.organizationType, "district"), eq(people.status, 0)),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));
}

export async function listDistrictSickPrivacyBirthStats(
  budgetYear: number,
  period: LeaveReportPeriod,
): Promise<LeaveSickPrivacyBirthRow[]> {
  const { startIso, endIso } = reportPeriodRange(budgetYear, period);
  const districtPeople = await listDistrictPeople();
  const personIds = districtPeople.map((p) => p.personId);

  const [leaves, cancellations] = await Promise.all([
    loadApprovedLeavesInRange(personIds, startIso, endIso),
    loadApprovedCancellationsInRange(personIds, startIso, endIso),
  ]);

  return districtPeople.map((person) => {
    const stats = aggregateTypeStats(
      person.personId,
      leaves,
      cancellations,
      startIso,
      endIso,
    );
    return {
      personId: person.personId,
      displayName: formatPersonName({
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        fallback: person.personId,
      }),
      positionLabel: positionLabel(person.positionCode),
      schoolName: null,
      ...stats,
    };
  });
}

export async function listDistrictVacationStats(
  budgetYear: number,
): Promise<LeaveVacationStatRow[]> {
  const { startIso, endIso } = reportPeriodRange(budgetYear, "full");
  const districtPeople = await listDistrictPeople();
  const personIds = districtPeople.map((p) => p.personId);

  const collectRows = await db
    .select()
    .from(leaveCollect)
    .where(eq(leaveCollect.budgetYear, budgetYear));

  const collectByPerson = new Map(
    collectRows.map((row) => [row.personId, row]),
  );

  const leaves = await db
    .select({
      personId: leaveRequests.personId,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
    })
    .from(leaveRequests)
    .where(
      and(
        inArray(leaveRequests.personId, personIds),
        eq(leaveRequests.leaveType, 4),
        eq(leaveRequests.commanderGrant, 1),
        lte(leaveRequests.leaveStart, endIso),
        gte(leaveRequests.leaveFinish, startIso),
      ),
    );

  const cancellations = await db
    .select({
      personId: leaveCancellations.personId,
      cancelStart: leaveCancellations.cancelStart,
      cancelFinish: leaveCancellations.cancelFinish,
      cancelTotal: leaveCancellations.cancelTotal,
    })
    .from(leaveCancellations)
    .where(
      and(
        inArray(leaveCancellations.personId, personIds),
        eq(leaveCancellations.leaveType, 4),
        eq(leaveCancellations.commanderGrant, 1),
        lte(leaveCancellations.cancelStart, endIso),
        gte(leaveCancellations.cancelFinish, startIso),
      ),
    );

  return districtPeople.map((person) => {
    const collect = collectByPerson.get(person.personId);
    const collectDay = collect?.collectDay ?? 0;
    const thisYearDay = collect?.thisYearDay ?? 0;
    const totalEntitled = collectDay + thisYearDay;

    let leaveTimes = 0;
    let leaveDays = 0;
    for (const row of leaves.filter((r) => r.personId === person.personId)) {
      const days = overlapDays(
        startIso,
        endIso,
        row.leaveStart,
        row.leaveFinish,
      );
      if (days > 0) {
        leaveTimes += 1;
        leaveDays += days;
      }
    }
    for (const row of cancellations.filter(
      (r) => r.personId === person.personId,
    )) {
      const days = overlapDays(
        startIso,
        endIso,
        row.cancelStart,
        row.cancelFinish,
      );
      if (days > 0) {
        leaveDays = Math.max(0, leaveDays - days);
      }
    }

    return {
      personId: person.personId,
      displayName: formatPersonName({
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        fallback: person.personId,
      }),
      positionLabel: positionLabel(person.positionCode),
      collectDay,
      thisYearDay,
      totalEntitled,
      leaveTimes,
      leaveDays,
      remaining: Math.max(0, totalEntitled - leaveDays),
    };
  });
}

export async function listSchoolPrincipalStats(
  budgetYear: number,
): Promise<LeaveSickPrivacyBirthRow[]> {
  const { startIso, endIso } = reportPeriodRange(budgetYear, "full");

  const principalPeople = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      schoolName: schools.name,
    })
    .from(people)
    .innerJoin(schools, eq(schools.id, people.schoolId))
    .where(
      and(
        eq(people.organizationType, "school"),
        eq(people.status, 0),
        eq(people.positionCode, 1),
        eq(schools.schoolType, 1),
      ),
    )
    .orderBy(asc(schools.schoolCode), asc(people.firstName));

  const personIds = principalPeople.map((p) => p.personId);
  const [leaves, cancellations] = await Promise.all([
    loadApprovedLeavesInRange(personIds, startIso, endIso),
    loadApprovedCancellationsInRange(personIds, startIso, endIso),
  ]);

  return principalPeople.map((person) => {
    const stats = aggregateTypeStats(
      person.personId,
      leaves,
      cancellations,
      startIso,
      endIso,
    );
    return {
      personId: person.personId,
      displayName: formatPersonName({
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        fallback: person.personId,
      }),
      positionLabel: positionLabel(person.positionCode),
      schoolName: person.schoolName,
      ...stats,
    };
  });
}

export async function listSchoolStaffStats(
  scope: Extract<LeaveScope, { kind: "school" }>,
  budgetYear: number,
): Promise<LeaveSickPrivacyBirthRow[]> {
  const { startIso, endIso } = reportPeriodRange(budgetYear, "full");

  const schoolPeople = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(
      and(
        eq(people.organizationType, "school"),
        eq(people.status, 0),
        eq(people.schoolId, scope.schoolId),
      ),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));

  const personIds = schoolPeople.map((p) => p.personId);
  const [leaves, cancellations] = await Promise.all([
    loadApprovedLeavesInRange(personIds, startIso, endIso),
    loadApprovedCancellationsInRange(personIds, startIso, endIso),
  ]);

  return schoolPeople.map((person) => {
    const stats = aggregateTypeStats(
      person.personId,
      leaves,
      cancellations,
      startIso,
      endIso,
    );
    return {
      personId: person.personId,
      displayName: formatPersonName({
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        fallback: person.personId,
      }),
      positionLabel: positionLabel(person.positionCode),
      schoolName: scope.schoolName,
      ...stats,
    };
  });
}

export async function resolveReportPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}
