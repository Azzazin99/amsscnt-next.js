import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { moduleAdmins, modules, users } from "@/lib/db/schema";

export const MODULE_ADMINS_PAGE_SIZE = 25;

export type ModuleAdminListRow = {
  id: number;
  userId: number;
  username: string;
  userName: string;
  moduleSlug: string;
  moduleName: string | null;
};

export async function countModuleAdmins(q: string): Promise<number> {
  const where =
    q.length >= 2
      ? or(
          ilike(users.username, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(moduleAdmins.moduleSlug, `%${q}%`),
        )
      : undefined;

  const [row] = await db
    .select({ total: count() })
    .from(moduleAdmins)
    .innerJoin(users, eq(moduleAdmins.userId, users.id))
    .where(where);

  return Number(row?.total ?? 0);
}

export async function listModuleAdminsPage(input: {
  q: string;
  page: number;
}): Promise<ModuleAdminListRow[]> {
  const where =
    input.q.length >= 2
      ? or(
          ilike(users.username, `%${input.q}%`),
          ilike(users.name, `%${input.q}%`),
          ilike(moduleAdmins.moduleSlug, `%${input.q}%`),
        )
      : undefined;

  const offset = (input.page - 1) * MODULE_ADMINS_PAGE_SIZE;

  const rows = await db
    .select({
      id: moduleAdmins.id,
      userId: moduleAdmins.userId,
      username: users.username,
      userName: users.name,
      moduleSlug: moduleAdmins.moduleSlug,
      moduleName: modules.name,
    })
    .from(moduleAdmins)
    .innerJoin(users, eq(moduleAdmins.userId, users.id))
    .leftJoin(modules, eq(modules.slug, moduleAdmins.moduleSlug))
    .where(where)
    .orderBy(asc(moduleAdmins.moduleSlug), asc(users.username))
    .limit(MODULE_ADMINS_PAGE_SIZE)
    .offset(offset);

  return rows;
}

export function parseModuleAdminListParams(params: { page?: string; q?: string }) {
  const q = params.q?.trim() ?? "";
  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  return { q, page } as const;
}

export async function resolveModuleAdminListPage(
  parsed: ReturnType<typeof parseModuleAdminListParams>,
) {
  const total = await countModuleAdmins(parsed.q);
  const totalPages = Math.max(1, Math.ceil(total / MODULE_ADMINS_PAGE_SIZE));
  return parsed.page > totalPages ? totalPages : parsed.page;
}

export async function listUsersForModuleAdminPicker() {
  return db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
    })
    .from(users)
    .where(eq(users.status, 1))
    .orderBy(asc(users.username));
}

export async function getModuleAdminById(id: number) {
  const [row] = await db
    .select({
      id: moduleAdmins.id,
      userId: moduleAdmins.userId,
      moduleSlug: moduleAdmins.moduleSlug,
    })
    .from(moduleAdmins)
    .where(eq(moduleAdmins.id, id))
    .limit(1);

  return row ?? null;
}
