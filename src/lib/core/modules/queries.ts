import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { menuGroups, modules } from "@/lib/db/schema";

export const MODULES_PAGE_SIZE = 50;

export type ModuleListRow = {
  id: number;
  slug: string;
  name: string;
  menuGroupName: string | null;
  whereWork: number;
  sortOrder: number;
  active: boolean;
};

export async function getModuleById(id: number) {
  const [row] = await db
    .select({
      id: modules.id,
      slug: modules.slug,
      name: modules.name,
      menuGroupId: modules.menuGroupId,
      whereWork: modules.whereWork,
      sortOrder: modules.sortOrder,
      active: modules.active,
    })
    .from(modules)
    .where(eq(modules.id, id))
    .limit(1);

  return row ?? null;
}

function buildModuleWhere(q: string, status: "all" | "active" | "inactive") {
  const conditions = [];
  if (q.length >= 2) {
    conditions.push(
      or(ilike(modules.name, `%${q}%`), ilike(modules.slug, `%${q}%`)),
    );
  }
  if (status === "active") conditions.push(eq(modules.active, true));
  if (status === "inactive") conditions.push(eq(modules.active, false));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function countModules(
  q: string,
  status: "all" | "active" | "inactive",
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(modules)
    .where(buildModuleWhere(q, status));
  return Number(row?.total ?? 0);
}

export async function listModulesPage(input: {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
}): Promise<ModuleListRow[]> {
  const offset = (input.page - 1) * MODULES_PAGE_SIZE;
  return db
    .select({
      id: modules.id,
      slug: modules.slug,
      name: modules.name,
      menuGroupName: menuGroups.name,
      whereWork: modules.whereWork,
      sortOrder: modules.sortOrder,
      active: modules.active,
    })
    .from(modules)
    .leftJoin(menuGroups, eq(modules.menuGroupId, menuGroups.id))
    .where(buildModuleWhere(input.q, input.status))
    .orderBy(asc(modules.sortOrder), asc(modules.name))
    .limit(MODULES_PAGE_SIZE)
    .offset(offset);
}

export function parseModuleListParams(params: {
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

export async function resolveModuleListPage(
  parsed: ReturnType<typeof parseModuleListParams>,
) {
  const total = await countModules(parsed.q, parsed.status);
  const totalPages = Math.max(1, Math.ceil(total / MODULES_PAGE_SIZE));
  return parsed.page > totalPages ? totalPages : parsed.page;
}

export async function listModulesForSelect() {
  return db
    .select({ slug: modules.slug, name: modules.name })
    .from(modules)
    .orderBy(asc(modules.sortOrder), asc(modules.name));
}
