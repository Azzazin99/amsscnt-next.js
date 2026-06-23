import { asc, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookGroupMembers, bookGroups, schools } from "@/lib/db/schema";

export const BOOK_GROUPS_PAGE_SIZE = 25;

export type BookGroupListRow = {
  id: number;
  name: string;
  sortOrder: number;
  memberCount: number;
};

export async function getBookGroupById(id: number) {
  const [row] = await db
    .select({
      id: bookGroups.id,
      name: bookGroups.name,
      sortOrder: bookGroups.sortOrder,
    })
    .from(bookGroups)
    .where(eq(bookGroups.id, id))
    .limit(1);

  return row ?? null;
}

export async function listBookGroupMemberIds(groupId: number): Promise<number[]> {
  const rows = await db
    .select({ schoolId: bookGroupMembers.schoolId })
    .from(bookGroupMembers)
    .where(eq(bookGroupMembers.groupId, groupId));
  return rows.map((r) => r.schoolId);
}

function buildWhere(q: string) {
  if (q.length >= 2) return ilike(bookGroups.name, `%${q}%`);
  return undefined;
}

export async function countBookGroups(q: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(bookGroups)
    .where(buildWhere(q));
  return Number(row?.total ?? 0);
}

export async function listBookGroupsPage(input: {
  q: string;
  page: number;
}): Promise<BookGroupListRow[]> {
  const offset = (input.page - 1) * BOOK_GROUPS_PAGE_SIZE;

  const rows = await db
    .select({
      id: bookGroups.id,
      name: bookGroups.name,
      sortOrder: bookGroups.sortOrder,
      memberCount: count(bookGroupMembers.id),
    })
    .from(bookGroups)
    .leftJoin(
      bookGroupMembers,
      eq(bookGroupMembers.groupId, bookGroups.id),
    )
    .where(buildWhere(input.q))
    .groupBy(bookGroups.id, bookGroups.name, bookGroups.sortOrder)
    .orderBy(asc(bookGroups.sortOrder), asc(bookGroups.name))
    .limit(BOOK_GROUPS_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    ...row,
    memberCount: Number(row.memberCount),
  }));
}

export function parseBookGroupListParams(params: { page?: string; q?: string }) {
  return {
    page: Math.max(1, Number(params.page) || 1),
    q: (params.q ?? "").trim(),
  };
}

export async function resolveBookGroupListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / BOOK_GROUPS_PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countMembersInBookGroup(groupId: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(bookGroupMembers)
    .where(eq(bookGroupMembers.groupId, groupId));
  return Number(row?.total ?? 0);
}

export async function listSchoolsForBookGroupForm() {
  return db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolCode));
}
