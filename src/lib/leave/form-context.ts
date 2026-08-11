import "server-only";

import { cache } from "react";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { isLeaveTypeEligibleForSex } from "@/lib/leave/constants";
import { db } from "@/lib/db";
import { leavePermissions, people, users } from "@/lib/db/schema";
import {
  buildLeaveStatisticsSnapshot,
  type LastLeaveInfo,
  type LeaveApproverOption,
  type LeaveRequesterProfile,
  type LeaveStatisticsSnapshot,
  type StatsLeaveTypeId,
} from "@/lib/leave/form-context-shared";
import { getLeaveCollectForPerson } from "@/lib/leave/collection-queries";
import { getPersonSex } from "@/lib/leave/queries";
import {
  getQuotaSummariesForTypes,
  type QuotaSummary,
} from "@/lib/leave/quota";
import { budgetYearFromIsoDate } from "@/lib/leave/regulation/fiscal-year";
import {
  LEAVE_TYPE_IDS,
  type LeaveTypeId,
} from "@/lib/leave/regulation/types";
import type { LeaveScope } from "@/lib/leave/scope";
import { positionLabel } from "@/lib/person/position-labels";

export type {
  LastLeaveInfo,
  LeaveApproverOption,
  LeaveRequesterProfile,
  LeaveStatRow,
  LeaveStatisticsSnapshot,
  StatsLeaveTypeId,
} from "@/lib/leave/form-context-shared";

export { buildLeaveStatisticsSnapshot };

const STATS_LEAVE_TYPES = [1, 2, 3, 4] as const satisfies readonly StatsLeaveTypeId[];

const FORM_QUOTA_TYPES: LeaveTypeId[] = [2, 3, 4, 5];

export type LeaveFormContext = {
  requester: LeaveRequesterProfile | null;
  approverOptions: LeaveApproverOption[];
  jobPersonOptions: LeaveApproverOption[];
  statsAgoByType: Record<StatsLeaveTypeId, number>;
  relaxCollect: number | null;
  relaxThisYear: number | null;
  lastLeaveByType: Partial<Record<LeaveTypeId, LastLeaveInfo>>;
  quotaHints: QuotaSummary[];
  personSex: "1" | "2" | null;
};

const getCachedPersonSex = cache(getPersonSex);

const getCachedLeaveRequesterProfile = cache(
  async (personId: string): Promise<LeaveRequesterProfile | null> => {
    const [row] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
        positionCode: people.positionCode,
      })
      .from(people)
      .where(eq(people.personId, personId))
      .limit(1);

    if (!row) return null;

    return {
      displayName: formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: personId,
      }),
      positionLabel: positionLabel(row.positionCode),
    };
  },
);

const getCachedLeaveApproverOptions = cache(
  async (): Promise<LeaveApproverOption[]> => {
    const p1Rows = await db
      .select({ personId: users.personId })
      .from(leavePermissions)
      .innerJoin(users, eq(users.id, leavePermissions.userId))
      .where(eq(leavePermissions.p1, 1));

    const p1Ids = [...new Set(p1Rows.map((r) => r.personId))];

    const eligibility =
      p1Ids.length > 0
        ? or(inArray(people.positionCode, [1, 2]), inArray(people.personId, p1Ids))
        : inArray(people.positionCode, [1, 2]);

    const districtPeople = await db
      .select({
        personId: people.personId,
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(
        and(
          eq(people.organizationType, "district"),
          eq(people.status, 0),
          eligibility,
        ),
      );

    const seen = new Set<string>();
    const options: LeaveApproverOption[] = [];

    for (const row of districtPeople) {
      if (seen.has(row.personId)) continue;
      seen.add(row.personId);
      options.push({
        personId: row.personId,
        displayName: formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.personId,
        }),
      });
    }

    return options.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "th"),
    );
  },
);

export const getLeaveRequesterProfile = getCachedLeaveRequesterProfile;
export const listLeaveApproverOptions = getCachedLeaveApproverOptions;

export async function getLastApprovedLeaveSameType(
  personId: string,
  leaveType: LeaveTypeId,
): Promise<LastLeaveInfo | null> {
  const map = await getLastApprovedLeavesByType(personId);
  return map[leaveType] ?? null;
}

export async function getLastApprovedLeavesByType(
  personId: string,
): Promise<Partial<Record<LeaveTypeId, LastLeaveInfo>>> {
  const [result] = (await db.execute(sql`
    SELECT
      leave_type AS leaveType,
      leave_start AS leaveStart,
      leave_finish AS leaveFinish,
      leave_total AS leaveTotal
    FROM (
      SELECT
        leave_type,
        leave_start,
        leave_finish,
        leave_total,
        ROW_NUMBER() OVER (PARTITION BY leave_type ORDER BY leave_start DESC, id DESC) as rn
      FROM leave_requests
      WHERE person_id = ${personId}
        AND commander_grant = 1
    ) t
    WHERE rn = 1
  `)) as unknown as [
    {
      leaveType: number;
      leaveStart: string;
      leaveFinish: string;
      leaveTotal: number;
    }[],
    unknown
  ];

  const rows = Array.isArray(result) ? result : [];
  const map: Partial<Record<LeaveTypeId, LastLeaveInfo>> = {};

  for (const row of rows) {
    if (!LEAVE_TYPE_IDS.includes(row.leaveType as LeaveTypeId)) continue;
    const typeId = row.leaveType as LeaveTypeId;
    map[typeId] = {
      leaveStart: row.leaveStart,
      leaveFinish: row.leaveFinish,
      leaveTotal: Number(row.leaveTotal),
    };
  }

  return map;
}

export async function buildLeaveStatisticsBase(
  personId: string,
  asOfIso: string,
): Promise<
  Omit<LeaveStatisticsSnapshot, "rows"> & {
    agoByType: Record<StatsLeaveTypeId, number>;
  }
> {
  const summaries = await getQuotaSummariesForTypes(
    personId,
    STATS_LEAVE_TYPES,
    asOfIso,
  );

  const agoByType = {
    1: summaries.get(1)?.used ?? 0,
    2: summaries.get(2)?.used ?? 0,
    3: summaries.get(3)?.used ?? 0,
    4: summaries.get(4)?.used ?? 0,
  } satisfies Record<StatsLeaveTypeId, number>;

  const relaxSummary = summaries.get(4);
  const budgetYear = budgetYearFromIsoDate(asOfIso);
  const collect = await getLeaveCollectForPerson(budgetYear, personId);

  return {
    agoByType,
    relaxCollect: collect?.collectDay ?? relaxSummary?.carried ?? null,
    relaxThisYear: collect?.thisYearDay ?? relaxSummary?.entitled ?? null,
  };
}

export async function listLeaveJobPersonOptions(
  scope: LeaveScope,
  excludePersonId?: string,
): Promise<LeaveApproverOption[]> {
  const scopeFilter =
    scope.kind === "district"
      ? and(eq(people.organizationType, "district"), eq(people.status, 0))
      : and(eq(people.schoolId, scope.schoolId), eq(people.status, 0));

  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(scopeFilter)
    .orderBy(people.firstName, people.lastName);

  return rows
    .filter((row) => row.personId !== excludePersonId)
    .map((row) => ({
      personId: row.personId,
      displayName: formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.personId,
      }),
    }));
}

export async function loadLeaveFormContext(input: {
  personId: string;
  scope: LeaveScope;
  asOfIso: string;
  excludePersonIdForJob?: string;
}): Promise<LeaveFormContext> {
  const personSex = await getCachedPersonSex(input.personId);

  const quotaTypesForLoad = [
    ...new Set([
      ...STATS_LEAVE_TYPES,
      ...FORM_QUOTA_TYPES.filter((t) =>
        isLeaveTypeEligibleForSex(t, personSex),
      ),
    ]),
  ] as LeaveTypeId[];

  const [
    requester,
    approverOptions,
    jobPersonOptions,
    lastLeaveByType,
    quotaMap,
    collect,
  ] = await Promise.all([
    getCachedLeaveRequesterProfile(input.personId),
    getCachedLeaveApproverOptions(),
    listLeaveJobPersonOptions(input.scope, input.excludePersonIdForJob),
    getLastApprovedLeavesByType(input.personId),
    getQuotaSummariesForTypes(
      input.personId,
      quotaTypesForLoad,
      input.asOfIso,
    ),
    getLeaveCollectForPerson(
      budgetYearFromIsoDate(input.asOfIso),
      input.personId,
    ),
  ]);

  const relaxSummary = quotaMap.get(4);

  const statsAgoByType = {
    1: quotaMap.get(1)?.used ?? 0,
    2: quotaMap.get(2)?.used ?? 0,
    3: quotaMap.get(3)?.used ?? 0,
    4: quotaMap.get(4)?.used ?? 0,
  } satisfies Record<StatsLeaveTypeId, number>;

  const quotaHints = FORM_QUOTA_TYPES.filter((t) =>
    isLeaveTypeEligibleForSex(t, personSex),
  )
    .map((t) => quotaMap.get(t))
    .filter((q): q is QuotaSummary => q !== undefined);

  return {
    requester,
    approverOptions,
    jobPersonOptions,
    statsAgoByType,
    relaxCollect: collect?.collectDay ?? relaxSummary?.carried ?? null,
    relaxThisYear: collect?.thisYearDay ?? relaxSummary?.entitled ?? null,
    lastLeaveByType,
    quotaHints,
    personSex,
  };
}
