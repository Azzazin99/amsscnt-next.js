import { asc, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailGroupMembers, mailGroups } from "@/lib/db/schema";

export const MAIL_GROUPS_PAGE_SIZE = 25;

export type MailGroupListRow = {
  id: number;
  name: string;
  sortOrder: number;
  memberCount: number;
};

export async function getMailGroupById(id: number) {
  const [row] = await db
    .select({
      id: mailGroups.id,
      name: mailGroups.name,
      sortOrder: mailGroups.sortOrder,
    })
    .from(mailGroups)
    .where(eq(mailGroups.id, id))
    .limit(1);

  return row ?? null;
}

export async function listMailGroupMemberIds(groupId: number): Promise<string[]> {
  const rows = await db
    .select({ personId: mailGroupMembers.personId })
    .from(mailGroupMembers)
    .where(eq(mailGroupMembers.groupId, groupId));
  return rows.map((r) => r.personId);
}

function buildWhere(q: string) {
  if (q.length >= 2) return ilike(mailGroups.name, `%${q}%`);
  return undefined;
}

export async function countMailGroups(q: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(mailGroups)
    .where(buildWhere(q));
  return Number(row?.total ?? 0);
}

export async function listMailGroupsPage(input: {
  q: string;
  page: number;
}): Promise<MailGroupListRow[]> {
  const offset = (input.page - 1) * MAIL_GROUPS_PAGE_SIZE;

  const rows = await db
    .select({
      id: mailGroups.id,
      name: mailGroups.name,
      sortOrder: mailGroups.sortOrder,
      memberCount: count(mailGroupMembers.id),
    })
    .from(mailGroups)
    .leftJoin(
      mailGroupMembers,
      eq(mailGroupMembers.groupId, mailGroups.id),
    )
    .where(buildWhere(input.q))
    .groupBy(mailGroups.id, mailGroups.name, mailGroups.sortOrder)
    .orderBy(asc(mailGroups.sortOrder), asc(mailGroups.name))
    .limit(MAIL_GROUPS_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    ...row,
    memberCount: Number(row.memberCount),
  }));
}

export function parseMailGroupListParams(params: { page?: string; q?: string }) {
  return {
    page: Math.max(1, Number(params.page) || 1),
    q: (params.q ?? "").trim(),
  };
}

export async function resolveMailGroupListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / MAIL_GROUPS_PAGE_SIZE));
  return Math.min(page, totalPages);
}
