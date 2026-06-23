import { and, asc, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  people,
  registerReceives,
  registerSends,
  workgroups,
} from "@/lib/db/schema";

export const WORKGROUPS_PAGE_SIZE = 25;

export type WorkgroupListRow = {
  id: number;
  legacyCode: number | null;
  name: string;
  sortOrder: number;
  active: boolean;
  peopleCount: number;
};

export type WorkgroupOption = {
  id: number;
  name: string;
};

export async function listWorkgroupsForSelect(): Promise<WorkgroupOption[]> {
  return db
    .select({ id: workgroups.id, name: workgroups.name })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name));
}

export async function getWorkgroupById(id: number) {
  const [row] = await db
    .select({
      id: workgroups.id,
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
      sortOrder: workgroups.sortOrder,
      active: workgroups.active,
    })
    .from(workgroups)
    .where(eq(workgroups.id, id))
    .limit(1);

  return row ?? null;
}

export async function countPeopleInWorkgroup(workgroupId: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(people)
    .where(eq(people.workgroupId, workgroupId));

  return Number(row?.total ?? 0);
}

export async function countRegisterRefsForWorkgroup(
  workgroupId: number,
): Promise<number> {
  const [receiveRow] = await db
    .select({ total: count() })
    .from(registerReceives)
    .where(eq(registerReceives.workgroupId, workgroupId));

  const [sendRow] = await db
    .select({ total: count() })
    .from(registerSends)
    .where(eq(registerSends.workgroupId, workgroupId));

  return Number(receiveRow?.total ?? 0) + Number(sendRow?.total ?? 0);
}

function buildWhere(q: string, status: "all" | "active" | "inactive") {
  const conditions = [];
  if (q.length >= 2) {
    conditions.push(ilike(workgroups.name, `%${q}%`));
  }
  if (status === "active") {
    conditions.push(eq(workgroups.active, true));
  } else if (status === "inactive") {
    conditions.push(eq(workgroups.active, false));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function countWorkgroups(
  q: string,
  status: "all" | "active" | "inactive",
): Promise<number> {
  const where = buildWhere(q, status);
  const [row] = await db
    .select({ total: count() })
    .from(workgroups)
    .where(where);

  return Number(row?.total ?? 0);
}

export async function listWorkgroupsPage(input: {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
}): Promise<WorkgroupListRow[]> {
  const where = buildWhere(input.q, input.status);
  const offset = (input.page - 1) * WORKGROUPS_PAGE_SIZE;

  const rows = await db
    .select({
      id: workgroups.id,
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
      sortOrder: workgroups.sortOrder,
      active: workgroups.active,
      peopleCount: count(people.id),
    })
    .from(workgroups)
    .leftJoin(people, eq(people.workgroupId, workgroups.id))
    .where(where)
    .groupBy(
      workgroups.id,
      workgroups.legacyCode,
      workgroups.name,
      workgroups.sortOrder,
      workgroups.active,
    )
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name))
    .limit(WORKGROUPS_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    ...row,
    peopleCount: Number(row.peopleCount),
  }));
}

export function parseWorkgroupListParams(params: {
  page?: string;
  q?: string;
  status?: string;
}): { q: string; status: "all" | "active" | "inactive"; page: number } {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "inactive" || statusRaw === "active" ? statusRaw : "all";

  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  return { q, status, page };
}

export async function resolveWorkgroupListPage(
  parsed: ReturnType<typeof parseWorkgroupListParams>,
): Promise<number> {
  const total = await countWorkgroups(parsed.q, parsed.status);
  const totalPages = Math.max(1, Math.ceil(total / WORKGROUPS_PAGE_SIZE));
  if (parsed.page > totalPages) return totalPages;
  return parsed.page;
}
