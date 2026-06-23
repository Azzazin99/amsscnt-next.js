import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";

export const USERS_PAGE_SIZE = 25;

export type UserListRow = {
  id: number;
  username: string;
  name: string;
  personId: string;
  organizationType: "district" | "school";
  schoolName: string | null;
  isAdmin: boolean;
  status: number;
};

export async function getUserById(id: number) {
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      personId: users.personId,
      email: users.email,
      name: users.name,
      organizationType: users.organizationType,
      schoolId: users.schoolId,
      isAdmin: users.isAdmin,
      isSuperAdmin: users.isSuperAdmin,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row ?? null;
}

export async function getUserByUsername(username: string, excludeId?: number) {
  const trimmed = username.trim();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, trimmed))
    .limit(1);

  if (!row) return null;
  if (excludeId != null && row.id === excludeId) return null;
  return row;
}

function buildWhere(q: string, status: "all" | "active" | "inactive") {
  const conditions = [];
  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(users.username, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(users.personId, `%${q}%`),
      ),
    );
  }
  if (status === "active") conditions.push(eq(users.status, 1));
  if (status === "inactive") conditions.push(eq(users.status, 0));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function countUsers(
  q: string,
  status: "all" | "active" | "inactive",
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(buildWhere(q, status));
  return Number(row?.total ?? 0);
}

export async function listUsersPage(input: {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
}): Promise<UserListRow[]> {
  const offset = (input.page - 1) * USERS_PAGE_SIZE;

  return db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      personId: users.personId,
      organizationType: users.organizationType,
      schoolName: schools.name,
      isAdmin: users.isAdmin,
      status: users.status,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(buildWhere(input.q, input.status))
    .orderBy(asc(users.username))
    .limit(USERS_PAGE_SIZE)
    .offset(offset);
}

export function parseUserListParams(params: {
  page?: string;
  q?: string;
  status?: string;
}) {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "inactive" || statusRaw === "active" ? statusRaw : "all";
  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  return { q, status, page } as const;
}

export async function resolveUserListPage(
  parsed: ReturnType<typeof parseUserListParams>,
) {
  const total = await countUsers(parsed.q, parsed.status);
  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  return parsed.page > totalPages ? totalPages : parsed.page;
}

export async function listSchoolsForUserSelect() {
  return db
    .select({ id: schools.id, name: schools.name, schoolCode: schools.schoolCode })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolCode));
}
