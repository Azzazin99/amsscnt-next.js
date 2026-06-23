import { and, eq, inArray, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  leaveCancellations,
  leaveCollect,
  leaveQuotaBalances,
  leaveRequests,
  people,
} from "@/lib/db/schema";
import {
  computeCarryoverVacation,
  computeEntitlement,
} from "@/lib/leave/regulation/entitlements";
import {
  budgetYearFromIsoDate,
  budgetYearMatchesDateColumn,
} from "@/lib/leave/regulation/fiscal-year";
import type { LeaveTypeId } from "@/lib/leave/regulation/types";
import { LEAVE_TYPES, isLeaveTypeId } from "@/lib/leave/regulation/types";

export type QuotaSummary = {
  leaveType: LeaveTypeId;
  label: string;
  entitled: number | null;
  used: number;
  remaining: number | null;
  carried: number;
  unlimited: boolean;
  missingServiceStart: boolean;
};

async function sumApprovedCancellationDays(
  personId: string,
  budgetYear: number,
  leaveType: LeaveTypeId,
): Promise<number> {
  const [row] = await db
    .select({ total: sum(leaveCancellations.cancelTotal) })
    .from(leaveCancellations)
    .where(
      and(
        eq(leaveCancellations.personId, personId),
        eq(leaveCancellations.leaveType, leaveType),
        eq(leaveCancellations.commanderGrant, 1),
        budgetYearMatchesDateColumn(leaveCancellations.cancelStart, budgetYear),
      ),
    );

  return Number(row?.total ?? 0);
}

async function sumApprovedLeaveDays(
  personId: string,
  budgetYear: number,
  leaveType: LeaveTypeId,
): Promise<number> {
  const [row] = await db
    .select({ total: sum(leaveRequests.leaveTotal) })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.personId, personId),
        eq(leaveRequests.leaveType, leaveType),
        eq(leaveRequests.commanderGrant, 1),
        budgetYearMatchesDateColumn(leaveRequests.leaveStart, budgetYear),
      ),
    );

  const gross = Number(row?.total ?? 0);
  const cancelled = await sumApprovedCancellationDays(
    personId,
    budgetYear,
    leaveType,
  );

  return Math.max(0, gross - cancelled);
}

async function getServiceStartDate(personId: string): Promise<string | null> {
  const [row] = await db
    .select({ serviceStartDate: people.serviceStartDate })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);
  return row?.serviceStartDate ?? null;
}

async function getPreviousVacationCarryover(
  personId: string,
  budgetYear: number,
): Promise<number> {
  const prevYear = budgetYear - 1;
  const [prev] = await db
    .select()
    .from(leaveQuotaBalances)
    .where(
      and(
        eq(leaveQuotaBalances.personId, personId),
        eq(leaveQuotaBalances.budgetYear, prevYear),
        eq(leaveQuotaBalances.leaveType, 4),
      ),
    )
    .limit(1);

  if (prev) {
    return computeCarryoverVacation(prev.entitled, prev.used);
  }

  const used = await sumApprovedLeaveDays(personId, prevYear, 4);
  const serviceStart = await getServiceStartDate(personId);
  if (!serviceStart) return 0;

  const ent = computeEntitlement({
    leaveType: 4,
    serviceStartIso: serviceStart,
    asOfIso: `${prevYear - 543}-09-30`,
  });
  const entitled = ent.entitled ?? 0;
  return computeCarryoverVacation(entitled, used);
}

function summaryFromBalanceRow(
  typeId: LeaveTypeId,
  entitled: number,
  used: number,
  carried: number,
): QuotaSummary {
  const def = LEAVE_TYPES[typeId];
  return {
    leaveType: typeId,
    label: def.label,
    entitled,
    used,
    remaining: Math.max(0, entitled - used),
    carried,
    unlimited: false,
    missingServiceStart: false,
  };
}

async function tryQuotaFromBalance(
  personId: string,
  budgetYear: number,
  typeId: LeaveTypeId,
): Promise<QuotaSummary | null> {
  if (typeId === 4) return null;

  const [balance] = await db
    .select()
    .from(leaveQuotaBalances)
    .where(
      and(
        eq(leaveQuotaBalances.personId, personId),
        eq(leaveQuotaBalances.budgetYear, budgetYear),
        eq(leaveQuotaBalances.leaveType, typeId),
      ),
    )
    .limit(1);

  if (!balance) return null;

  return summaryFromBalanceRow(
    typeId,
    balance.entitled,
    balance.used,
    balance.carried,
  );
}

async function computeQuotaSummary(
  personId: string,
  typeId: LeaveTypeId,
  asOfIso: string,
): Promise<QuotaSummary> {
  const def = LEAVE_TYPES[typeId];
  const budgetYear = budgetYearFromIsoDate(asOfIso);

  if (typeId === 4) {
    const [collect] = await db
      .select()
      .from(leaveCollect)
      .where(
        and(
          eq(leaveCollect.budgetYear, budgetYear),
          eq(leaveCollect.personId, personId),
        ),
      )
      .limit(1);

    if (collect) {
      const used = await sumApprovedLeaveDays(personId, budgetYear, typeId);
      const entitled = collect.thisYearDay;
      const carried = collect.collectDay;
      const total = entitled + carried;
      return {
        leaveType: typeId,
        label: def.label,
        entitled,
        used,
        remaining: Math.max(0, total - used),
        carried,
        unlimited: false,
        missingServiceStart: false,
      };
    }
  } else {
    const cached = await tryQuotaFromBalance(personId, budgetYear, typeId);
    if (cached) return cached;
  }

  const serviceStart = await getServiceStartDate(personId);

  let carried = 0;
  if (typeId === 4) {
    carried = await getPreviousVacationCarryover(personId, budgetYear);
  }

  const ent = computeEntitlement({
    leaveType: typeId,
    serviceStartIso: serviceStart,
    asOfIso,
    carriedVacationDays: carried,
  });

  const used = await sumApprovedLeaveDays(personId, budgetYear, typeId);

  const missingServiceStart = typeId === 4 && !serviceStart;

  const remaining =
    ent.unlimited || ent.entitled === null
      ? null
      : Math.max(0, ent.entitled - used);

  return {
    leaveType: typeId,
    label: def.label,
    entitled: ent.entitled,
    used,
    remaining,
    carried: ent.carried,
    unlimited: ent.unlimited,
    missingServiceStart,
  };
}

export async function getQuotaSummary(
  personId: string,
  leaveType: number,
  asOfIso: string,
): Promise<QuotaSummary | null> {
  if (!isLeaveTypeId(leaveType)) return null;
  return computeQuotaSummary(personId, leaveType, asOfIso);
}

export async function getQuotaSummariesForTypes(
  personId: string,
  leaveTypes: readonly LeaveTypeId[],
  asOfIso: string,
): Promise<Map<LeaveTypeId, QuotaSummary>> {
  const uniqueTypes = [...new Set(leaveTypes)];
  const budgetYear = budgetYearFromIsoDate(asOfIso);
  const result = new Map<LeaveTypeId, QuotaSummary>();

  if (uniqueTypes.length === 0) return result;

  const balanceRows = await db
    .select()
    .from(leaveQuotaBalances)
    .where(
      and(
        eq(leaveQuotaBalances.personId, personId),
        eq(leaveQuotaBalances.budgetYear, budgetYear),
        inArray(leaveQuotaBalances.leaveType, [...uniqueTypes]),
      ),
    );

  const balanceByType = new Map(
    balanceRows.map((row) => [row.leaveType as LeaveTypeId, row]),
  );

  let collectRow: (typeof leaveCollect.$inferSelect) | null = null;
  if (uniqueTypes.includes(4)) {
    const [collect] = await db
      .select()
      .from(leaveCollect)
      .where(
        and(
          eq(leaveCollect.budgetYear, budgetYear),
          eq(leaveCollect.personId, personId),
        ),
      )
      .limit(1);
    collectRow = collect ?? null;
  }

  const serviceStartNeeded = uniqueTypes.some(
    (t) => t === 4 && !collectRow && !balanceByType.has(4),
  );
  const serviceStart = serviceStartNeeded
    ? await getServiceStartDate(personId)
    : null;

  let prevCarryover: number | null = null;

  await Promise.all(
    uniqueTypes.map(async (typeId) => {
      if (typeId === 4 && collectRow) {
        const used = await sumApprovedLeaveDays(personId, budgetYear, typeId);
        const entitled = collectRow.thisYearDay;
        const carried = collectRow.collectDay;
        const total = entitled + carried;
        result.set(typeId, {
          leaveType: typeId,
          label: LEAVE_TYPES[typeId].label,
          entitled,
          used,
          remaining: Math.max(0, total - used),
          carried,
          unlimited: false,
          missingServiceStart: false,
        });
        return;
      }

      if (typeId !== 4) {
        const balance = balanceByType.get(typeId);
        if (balance) {
          result.set(
            typeId,
            summaryFromBalanceRow(
              typeId,
              balance.entitled,
              balance.used,
              balance.carried,
            ),
          );
          return;
        }
      }

      if (typeId === 4) {
        if (prevCarryover === null) {
          prevCarryover = await getPreviousVacationCarryover(
            personId,
            budgetYear,
          );
        }
        const ent = computeEntitlement({
          leaveType: 4,
          serviceStartIso: serviceStart,
          asOfIso,
          carriedVacationDays: prevCarryover,
        });
        const used = await sumApprovedLeaveDays(personId, budgetYear, 4);
        result.set(typeId, {
          leaveType: 4,
          label: LEAVE_TYPES[4].label,
          entitled: ent.entitled,
          used,
          remaining:
            ent.unlimited || ent.entitled === null
              ? null
              : Math.max(0, ent.entitled - used),
          carried: ent.carried,
          unlimited: ent.unlimited,
          missingServiceStart: !serviceStart,
        });
        return;
      }

      const ent = computeEntitlement({
        leaveType: typeId,
        serviceStartIso: serviceStart,
        asOfIso,
        carriedVacationDays: 0,
      });
      const used = await sumApprovedLeaveDays(personId, budgetYear, typeId);
      result.set(typeId, {
        leaveType: typeId,
        label: LEAVE_TYPES[typeId].label,
        entitled: ent.entitled,
        used,
        remaining:
          ent.unlimited || ent.entitled === null
            ? null
            : Math.max(0, ent.entitled - used),
        carried: ent.carried,
        unlimited: ent.unlimited,
        missingServiceStart: false,
      });
    }),
  );

  return result;
}

export async function validateQuotaForRequest(
  personId: string,
  leaveType: number,
  leaveStart: string,
  requestedDays: number,
): Promise<string | null> {
  const summary = await getQuotaSummary(personId, leaveType, leaveStart);
  if (!summary) return "ประเภทการลาไม่ถูกต้อง";

  if (summary.unlimited) return null;

  if (summary.remaining === null) {
    if (leaveType === 4) {
      return "กรุณาระบุวันเริ่มราชการในข้อมูลบุคลากรก่อนยื่นลาพักผ่อน";
    }
    return null;
  }

  if (requestedDays > summary.remaining) {
    return `เกินสิทธิ์ลาคงเหลือ (เหลือ ${summary.remaining} วัน)`;
  }

  return null;
}

export async function syncQuotaBalance(
  personId: string,
  budgetYear: number,
  leaveType: LeaveTypeId,
): Promise<void> {
  const asOfIso = `${budgetYear - 543}-09-30`;
  const summary = await computeQuotaSummary(personId, leaveType, asOfIso);
  if (summary.unlimited) return;

  await db
    .insert(leaveQuotaBalances)
    .values({
      personId,
      budgetYear,
      leaveType,
      entitled: summary.entitled ?? 0,
      used: summary.used,
      carried: summary.carried,
    })
    .onConflictDoUpdate({
      target: [
        leaveQuotaBalances.personId,
        leaveQuotaBalances.budgetYear,
        leaveQuotaBalances.leaveType,
      ],
      set: {
        entitled: summary.entitled ?? 0,
        used: summary.used,
        carried: summary.carried,
      },
    });
}
