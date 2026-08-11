import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { formatPersonName } from "@/lib/auth/format-name";
import {
  people,
  planActivities,
  planPermissions,
  planProjects,
  planStrategies,
  planYears,
  systemSyncCode,
  workgroups,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

// ---- Stub exports for missing functions ----
export const countBudgetReceiveRows = async (_budgetYear?: number, _q?: string): Promise<number> => 0;
export const listBudgetReceiveRows = async (_budgetYear?: number, _page?: number, _q?: string): Promise<any[]> => [];
export const getPlanProjectOwnerReport = async (_id: number): Promise<any> => null;
export const listActivitiesForStop = async (_budgetYear: number): Promise<any[]> => [];
export const listActivityFundingForYear = async (_budgetYear: number): Promise<any[]> => [];
export const listAllocationCheckRows = async (_budgetYear: number): Promise<any[]> => [];
export const listSurplusProjectReport = async (_budgetYear: number): Promise<any[]> => [];
export const listPlanReportProjects = async (_options: any): Promise<any[]> => [];
export const listPlanStrategies = async (_budgetYear: number): Promise<any[]> => [];
export const listPlanStaffPermissions = async (): Promise<any[]> => [];
export const listSmssSchoolOptions = async (): Promise<any[]> => [];
export const listStrategyOptions = async (_budgetYear?: number): Promise<any[]> => [];

export function parsePlanReportSearchParams(_params: Record<string, string | string[] | undefined>): any {
  return {};
}

export async function resolvePlanReportYear(requestedYear?: number): Promise<PlanYearRow | null> {
  if (requestedYear) {
    const [row] = await db
      .select()
      .from(planYears)
      .where(eq(planYears.budgetYear, requestedYear))
      .limit(1);
    return row ?? null;
  }
  return getActivePlanYear();
}


export type PlanYearRow = {
  id: number;
  budgetYear: number;
  yearActive: boolean;
};

export type PlanProjectRow = {
  id: number;
  budgetYear: number;
  codeClus: number;
  workgroupName: string | null;
  codeProj: string;
  nameProj: string;
  budgetProj: number;
  ownerProj: string;
  ownerName: string | null;
  beginDate: string;
  finishDate: string;
  fileDetail?: string | null;
};

export type PlanReportProjectRow = PlanProjectRow & {
  activities?: any[];
  fileDetail?: string | null;
  evalParticular?: string | null;
  evalResult?: string | null;
};

export type PlanProjectDetail = PlanProjectRow & {
  codeTegy: string;
};

export type PlanActivityRow = {
  id: number;
  budgetYear: number;
  codeClus: number;
  codeProj: string;
  codeActi: string;
  nameActi: string;
  budgetActi: number;
  beginDate: string;
  finishDate: string;
  projectName: string | null;
};

export type PlanActivityDetail = PlanActivityRow & {
  ownerActi: string;
  codeApprove: string;
  stop: number | null;
};

export type WorkgroupOption = {
  legacyCode: number;
  name: string;
};

export type PersonOption = {
  personId: string;
  displayName: string;
};

export async function getActivePlanYear(): Promise<PlanYearRow | null> {
  const [row] = await db
    .select()
    .from(planYears)
    .where(eq(planYears.yearActive, true))
    .orderBy(desc(planYears.budgetYear))
    .limit(1);
  return row ?? null;
}

export async function getPlanYear(id: number): Promise<PlanYearRow | null> {
  const [row] = await db
    .select()
    .from(planYears)
    .where(eq(planYears.id, id))
    .limit(1);
  return row ?? null;
}

export async function listPlanYears(): Promise<PlanYearRow[]> {
  return db.select().from(planYears).orderBy(desc(planYears.budgetYear));
}

export async function listWorkgroupOptions(): Promise<WorkgroupOption[]> {
  const rows = await db
    .select({
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
    })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name));

  return rows
    .filter((r): r is WorkgroupOption => r.legacyCode != null)
    .map((r) => ({ legacyCode: r.legacyCode!, name: r.name }));
}

export async function listPersonOptions(): Promise<PersonOption[]> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(eq(people.status, 0))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((r) => ({
    personId: r.personId,
    displayName: formatPersonName({
      prefix: r.prefix,
      firstName: r.firstName,
      lastName: r.lastName,
    }),
  }));
}

export function parsePlanListParams(params: {
  page?: string;
  q?: string;
  proj?: string;
}) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() ?? "";
  const codeProj = params.proj?.trim() ?? "";
  return { page, q, codeProj };
}

export async function resolvePlanListPage(total: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(Math.max(1, page), totalPages);
}

function projectSearchWhere(budgetYear: number, q: string) {
  const base = eq(planProjects.budgetYear, budgetYear);
  if (!q) return base;
  const pattern = `%${q}%`;
  return and(
    base,
    or(
      like(planProjects.codeProj, pattern),
      like(planProjects.nameProj, pattern),
      like(planProjects.ownerProj, pattern),
    ),
  );
}

export async function countPlanProjects(budgetYear: number, q: string, _kind?: string | number) {
  const [row] = await db
    .select({ total: count() })
    .from(planProjects)
    .where(projectSearchWhere(budgetYear, q));
  return row?.total ?? 0;
}

export async function listPlanProjectsPage(options: {
  budgetYear: number;
  page: number;
  q: string;
  kind?: string | number;
  projectKind?: string | number;
}): Promise<PlanProjectRow[]> {
  const offset = (options.page - 1) * PAGE_SIZE;
  const owner = db
    .select({
      personId: people.personId,
      displayName: sql<string>`trim(concat(coalesce(${people.prefix}, ''), ' ', ${people.firstName}, ' ', ${people.lastName}))`.as(
        "display_name",
      ),
    })
    .from(people)
    .as("owner_person");

  const rows = await db
    .select({
      id: planProjects.id,
      budgetYear: planProjects.budgetYear,
      codeClus: planProjects.codeClus,
      workgroupName: workgroups.name,
      codeProj: planProjects.codeProj,
      nameProj: planProjects.nameProj,
      budgetProj: planProjects.budgetProj,
      ownerProj: planProjects.ownerProj,
      ownerName: owner.displayName,
      beginDate: planProjects.beginDate,
      finishDate: planProjects.finishDate,
    })
    .from(planProjects)
    .leftJoin(
      workgroups,
      eq(workgroups.legacyCode, planProjects.codeClus),
    )
    .leftJoin(owner, eq(owner.personId, planProjects.ownerProj))
    .where(projectSearchWhere(options.budgetYear, options.q))
    .orderBy(asc(planProjects.codeProj))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map((r) => ({
    ...r,
    budgetProj: r.budgetProj ?? 0,
  }));
}

export async function getPlanProject(id: number): Promise<PlanProjectDetail | null> {
  const owner = db
    .select({
      personId: people.personId,
      displayName: sql<string>`trim(concat(coalesce(${people.prefix}, ''), ' ', ${people.firstName}, ' ', ${people.lastName}))`.as(
        "display_name",
      ),
    })
    .from(people)
    .as("owner_person");

  const [row] = await db
    .select({
      id: planProjects.id,
      budgetYear: planProjects.budgetYear,
      codeClus: planProjects.codeClus,
      workgroupName: workgroups.name,
      codeTegy: planProjects.codeTegy,
      codeProj: planProjects.codeProj,
      nameProj: planProjects.nameProj,
      budgetProj: planProjects.budgetProj,
      ownerProj: planProjects.ownerProj,
      ownerName: owner.displayName,
      beginDate: planProjects.beginDate,
      finishDate: planProjects.finishDate,
      fileDetail: planProjects.fileDetail,
    })
    .from(planProjects)
    .leftJoin(workgroups, eq(workgroups.legacyCode, planProjects.codeClus))
    .leftJoin(owner, eq(owner.personId, planProjects.ownerProj))
    .where(eq(planProjects.id, id))
    .limit(1);

  if (!row) return null;
  return { ...row, budgetProj: row.budgetProj ?? 0 };
}

export async function suggestNextProjectCode(budgetYear: number, _kind?: string | number): Promise<string> {
  const [row] = await db
    .select({ codeProj: planProjects.codeProj })
    .from(planProjects)
    .where(eq(planProjects.budgetYear, budgetYear))
    .orderBy(desc(planProjects.id))
    .limit(1);

  const next = row ? Number.parseInt(row.codeProj, 10) + 1 : 1;
  return String(next).padStart(3, "0");
}

export async function listProjectOptions(budgetYear: number) {
  return db
    .select({
      id: planProjects.id,
      codeProj: planProjects.codeProj,
      nameProj: planProjects.nameProj,
      codeClus: planProjects.codeClus,
      fileDetail: planProjects.fileDetail,
    })
    .from(planProjects)
    .where(eq(planProjects.budgetYear, budgetYear))
    .orderBy(asc(planProjects.codeProj));
}

function activitySearchWhere(
  budgetYear: number,
  q: string,
  codeProj: string,
) {
  const parts = [eq(planActivities.budgetYear, budgetYear)];
  if (codeProj) parts.push(eq(planActivities.codeProj, codeProj));
  if (q) {
    const pattern = `%${q}%`;
    parts.push(
      or(
        like(planActivities.codeActi, pattern),
        like(planActivities.nameActi, pattern),
      )!,
    );
  }
  return and(...parts);
}

export async function countPlanActivities(
  budgetYear: number,
  q: string,
  codeProj: string,
) {
  const [row] = await db
    .select({ total: count() })
    .from(planActivities)
    .where(activitySearchWhere(budgetYear, q, codeProj));
  return row?.total ?? 0;
}

export async function listPlanActivitiesPage(options: {
  budgetYear: number;
  page: number;
  q: string;
  codeProj: string;
}): Promise<PlanActivityRow[]> {
  const offset = (options.page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: planActivities.id,
      budgetYear: planActivities.budgetYear,
      codeClus: planActivities.codeClus,
      codeProj: planActivities.codeProj,
      codeActi: planActivities.codeActi,
      nameActi: planActivities.nameActi,
      budgetActi: planActivities.budgetActi,
      beginDate: planActivities.beginDate,
      finishDate: planActivities.finishDate,
      projectName: planProjects.nameProj,
    })
    .from(planActivities)
    .leftJoin(
      planProjects,
      and(
        eq(planProjects.budgetYear, planActivities.budgetYear),
        eq(planProjects.codeProj, planActivities.codeProj),
      ),
    )
    .where(
      activitySearchWhere(options.budgetYear, options.q, options.codeProj),
    )
    .orderBy(asc(planActivities.codeActi))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map((r) => ({ ...r, budgetActi: r.budgetActi ?? 0 }));
}

export async function getPlanActivity(id: number): Promise<PlanActivityDetail | null> {
  const [row] = await db
    .select({
      id: planActivities.id,
      budgetYear: planActivities.budgetYear,
      codeClus: planActivities.codeClus,
      codeProj: planActivities.codeProj,
      codeActi: planActivities.codeActi,
      nameActi: planActivities.nameActi,
      budgetActi: planActivities.budgetActi,
      ownerActi: planActivities.ownerActi,
      codeApprove: planActivities.codeApprove,
      stop: planActivities.stop,
      beginDate: planActivities.beginDate,
      finishDate: planActivities.finishDate,
      projectName: planProjects.nameProj,
    })
    .from(planActivities)
    .leftJoin(
      planProjects,
      and(
        eq(planProjects.budgetYear, planActivities.budgetYear),
        eq(planProjects.codeProj, planActivities.codeProj),
      ),
    )
    .where(eq(planActivities.id, id))
    .limit(1);

  if (!row) return null;
  return { ...row, budgetActi: row.budgetActi ?? 0 };
}

export async function countActivitiesForProject(
  budgetYear: number,
  codeProj: string,
) {
  const [row] = await db
    .select({ total: count() })
    .from(planActivities)
    .where(
      and(
        eq(planActivities.budgetYear, budgetYear),
        eq(planActivities.codeProj, codeProj),
      ),
    );
  return row?.total ?? 0;
}

export async function getPlanStaffPermission(key: string | number) {
  if (typeof key === "number") {
    const [row] = await db
      .select()
      .from(planPermissions)
      .where(eq(planPermissions.id, key))
      .limit(1);
    return row ?? null;
  }
  const [row] = await db
    .select()
    .from(planPermissions)
    .where(eq(planPermissions.personId, key))
    .limit(1);
  return row ?? null;
}

export async function getPlanStrategy(id: number) {
  const [row] = await db
    .select()
    .from(planStrategies)
    .where(eq(planStrategies.id, id))
    .limit(1);
  return row ?? null;
}

export function formatPlanActivitySourceLabel(
  source?: string | null,
  options?: { missing?: string },
): string {
  if (!source) {
    return options?.missing === "empty" ? "" : "ยังไม่ได้กำหนด";
  }
  if (source === "smss") return "นำเข้าจาก SMSS";
  if (source.startsWith("2_")) return `งบประมาณงวด ${source.slice(2)}`;
  if (source.startsWith("1_")) return `นอกงบประมาณ(${source.slice(2)})`;
  return String(source);
}

export async function getSmssSchoolSync(schoolCode: string) {
  const [row] = await db
    .select()
    .from(systemSyncCode)
    .where(eq(systemSyncCode.officeCode, schoolCode))
    .limit(1);
  return row ?? null;
}
