import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  isNotNull,
  or,
  sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetCategories,
  budgetDeegaTable,
  budgetKeyActivities,
  budgetKeyActivity,
  budgetMain,
  budgetMoneyReturn,
  budgetMoneySources,
  budgetPayTypes,
  budgetPlans,
  budgetProject,
  budgetProjectProducts,
  budgetReceives,
  budgetType,
  budgetWithdraw,
  budgetYears,
  people,
  planActivities,
  planProjects,
} from "@/lib/db/schema";
import { BUDGET_KIND_CATEGORY, BUDGET_TYPE_MAIN } from "@/lib/budget/constants";

export const PAGE_SIZE = 25;

export type BudgetYearRow = {
  id: number;
  budgetYear: number;
  yearActive: boolean;
};

export type BudgetMainRow = {
  id: number;
  budgetYear: number;
  doc: string;
  item: string;
  recDate: string;
  receiveAmount: number | null;
  payAmount: number | null;
  changeAmount: number | null;
  status: number | null;
  payGroup: number | null;
  payGroupName: string | null;
  payedPerson: string | null;
  officer: string | null;
  officerName: string | null;
  approve: number | null;
  payDate: string | null;
  payee: string | null;
};

export type BudgetMainDetail = BudgetMainRow & {
  typeId: number;
  referWdId: number | null;
  referDeegaId: number | null;
  deegaNum?: string | null;
  receiveNum?: string | null;
  plan?: string | null;
  project?: string | null;
  activity?: string | null;
  withdraw?: number | null;
  tax?: number | null;
  pay?: number | null;
  directPay?: number | null;
  directPayName?: string | null;
};

export type PayTypeOption = {
  payTypeId: number;
  payTypeName: string;
};

export async function getActiveBudgetYear(): Promise<BudgetYearRow | null> {
  const [row] = await db
    .select()
    .from(budgetYears)
    .where(eq(budgetYears.yearActive, true))
    .orderBy(desc(budgetYears.budgetYear))
    .limit(1);
  return row ?? null;
}

export async function getBudgetYear(id: number): Promise<BudgetYearRow | null> {
  const [row] = await db
    .select()
    .from(budgetYears)
    .where(eq(budgetYears.id, id))
    .limit(1);
  return row ?? null;
}

export async function listBudgetYears(): Promise<BudgetYearRow[]> {
  return db.select().from(budgetYears).orderBy(desc(budgetYears.budgetYear));
}

export async function listPayTypeOptions(): Promise<PayTypeOption[]> {
  const rows = await db
    .select({
      payTypeId: budgetPayTypes.payTypeId,
      payTypeName: budgetPayTypes.payTypeName,
    })
    .from(budgetPayTypes)
    .orderBy(asc(budgetPayTypes.payTypeId));
  return rows;
}

export function parseBudgetListParams(params: { page?: string; q?: string }) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() ?? "";
  return { page, q };
}

export async function resolveBudgetListPage(total: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(Math.max(1, page), totalPages);
}

async function typeIdsForBudgetMainKind(
  budgetYear: number,
  kindType?: string,
): Promise<number[]> {
  if (!kindType || kindType === "budget") return [BUDGET_TYPE_MAIN];

  // Safely resolve the category ID; if the mapping is missing, abort early.
  const catId = BUDGET_KIND_CATEGORY[kindType as keyof typeof BUDGET_KIND_CATEGORY];
  if (catId == null) {
    console.warn(`Unknown budget kind type: ${kindType}`);
    return [-1];
  }

  try {
    const rows = await db
      .select({ typeId: budgetType.typeId })
      .from(budgetType)
      .where(
        and(
          eq(budgetType.budgetYear, budgetYear),
          eq(budgetType.categoryId, catId as any),
        ),
      );

    const ids = rows.map((row) => row.typeId);
    return ids.length ? ids : [-1];
  } catch (e) {
    console.error("Error fetching type IDs for budget kind", e);
    return [-1];
  }
}

function typeIdClause(typeIds: number[]) {
  if (typeIds.length === 0) return eq(budgetMain.typeId, -1);
  if (typeIds.length === 1) return eq(budgetMain.typeId, typeIds[0]);
  return inArray(budgetMain.typeId, typeIds);
}

async function searchWhere(
  budgetYear: number,
  q: string,
  kind: "receive" | "disburse",
  kindType?: string,
) {
  const typeIds = await typeIdsForBudgetMainKind(budgetYear, kindType);
  const parts = [
    eq(budgetMain.budgetYear, budgetYear),
    typeIdClause(typeIds),
  ];

  if (kind === "receive") {
    parts.push(isNotNull(budgetMain.receiveAmount));
  } else {
    parts.push(isNotNull(budgetMain.payAmount));
  }

  if (q) {
    const pattern = `%${q}%`;
    parts.push(
      or(
        like(budgetMain.doc, pattern),
        like(budgetMain.item, pattern),
        like(budgetMain.payedPerson, pattern),
      )!,
    );
  }

  return and(...parts);
}

export async function countBudgetMain(
  budgetYear: number,
  q: string,
  kind: "receive" | "disburse",
  kindType?: string,
) {
  const [row] = await db
    .select({ total: count() })
    .from(budgetMain)
    .where(await searchWhere(budgetYear, q, kind, kindType));
  return row?.total ?? 0;
}

export async function sumBudgetMain(
  budgetYear: number,
  q: string,
  kind: "receive" | "disburse",
  kindType?: string,
) {
  const field = kind === "receive" ? budgetMain.receiveAmount : budgetMain.payAmount;
  const [row] = await db
    .select({ totalSum: sum(field) })
    .from(budgetMain)
    .where(await searchWhere(budgetYear, q, kind, kindType));
  return Number(row?.totalSum ?? 0);
}

export async function countBudgetMainByKind(options: {
  budgetYear: number;
  kind?: string;
  mode?: "receive" | "disburse" | "pay" | "status-change" | "change";
  q: string;
}) {
  const mode = options.mode === "receive" ? "receive" : "disburse";
  return countBudgetMain(options.budgetYear, options.q, mode, options.kind);
}

export async function listBudgetMainByKind(options: {
  budgetYear: number;
  kind?: string;
  mode?: "receive" | "disburse" | "pay" | "status-change" | "change";
  page: number;
  q: string;
}) {
  const mode = options.mode === "receive" ? "receive" : "disburse";
  return listBudgetMainPage({
    budgetYear: options.budgetYear,
    page: options.page,
    q: options.q,
    kind: mode,
    kindType: options.kind,
  });
}

export async function listBudgetMainPage(options: {
  budgetYear: number;
  page: number;
  q: string;
  kind: "receive" | "disburse";
  kindType?: string;
}): Promise<BudgetMainRow[]> {
  const offset = (options.page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: budgetMain.id,
      budgetYear: budgetMain.budgetYear,
      doc: budgetMain.doc,
      item: budgetMain.item,
      recDate: budgetMain.recDate,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
      changeAmount: budgetMain.changeAmount,
      status: budgetMain.status,
      payGroup: budgetMain.payGroup,
      payGroupName: budgetPayTypes.payTypeName,
      payedPerson: budgetMain.payedPerson,
      officer: budgetMain.officer,
      officerPrefix: people.prefix,
      officerFirstName: people.firstName,
      officerLastName: people.lastName,
      approve: budgetMain.approve,
      payDate: budgetMain.payDate,
      payee: budgetMain.payee,
    })
    .from(budgetMain)
    .leftJoin(
      budgetPayTypes,
      eq(budgetPayTypes.payTypeId, budgetMain.payGroup),
    )
    .leftJoin(people, eq(people.personId, budgetMain.officer))
    .where(await searchWhere(options.budgetYear, options.q, options.kind, options.kindType))
    .orderBy(desc(budgetMain.recDate), desc(budgetMain.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    budgetYear: r.budgetYear,
    doc: r.doc,
    item: r.item,
    recDate: r.recDate,
    receiveAmount: r.receiveAmount,
    payAmount: r.payAmount,
    changeAmount: r.changeAmount,
    status: r.status,
    payGroup: r.payGroup,
    payGroupName: r.payGroupName,
    payedPerson: r.payedPerson,
    officer: r.officer,
    officerName: [r.officerPrefix, r.officerFirstName, r.officerLastName]
      .filter(Boolean)
      .join(" "),
    approve: r.approve,
    payDate: r.payDate,
    payee: r.payee,
  }));
}

export async function getBudgetMain(id: number): Promise<BudgetMainDetail | null> {
  const [row] = await db
    .select({
      id: budgetMain.id,
      budgetYear: budgetMain.budgetYear,
      doc: budgetMain.doc,
      item: budgetMain.item,
      recDate: budgetMain.recDate,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
      changeAmount: budgetMain.changeAmount,
      status: budgetMain.status,
      payGroup: budgetMain.payGroup,
      payGroupName: budgetPayTypes.payTypeName,
      payedPerson: budgetMain.payedPerson,
      officer: budgetMain.officer,
      officerPrefix: people.prefix,
      officerFirstName: people.firstName,
      officerLastName: people.lastName,
      typeId: budgetMain.typeId,
      referWdId: budgetMain.referWdId,
      referDeegaId: budgetMain.referDeegaId,
      approve: budgetMain.approve,
      payDate: budgetMain.payDate,
      payee: budgetMain.payee,
    })
    .from(budgetMain)
    .leftJoin(
      budgetPayTypes,
      eq(budgetPayTypes.payTypeId, budgetMain.payGroup),
    )
    .leftJoin(people, eq(people.personId, budgetMain.officer))
    .where(eq(budgetMain.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    doc: row.doc,
    item: row.item,
    recDate: row.recDate,
    receiveAmount: row.receiveAmount,
    payAmount: row.payAmount,
    changeAmount: row.changeAmount,
    status: row.status,
    payGroup: row.payGroup,
    payGroupName: row.payGroupName,
    payedPerson: row.payedPerson,
    officer: row.officer,
    officerName: [row.officerPrefix, row.officerFirstName, row.officerLastName]
      .filter(Boolean)
      .join(" "),
    typeId: row.typeId,
    referWdId: row.referWdId,
    referDeegaId: row.referDeegaId,
    approve: row.approve,
    payDate: row.payDate,
    payee: row.payee,
  };
}

export const getBudgetDeega = getBudgetMain;

import { budgetPermissions } from "@/lib/db/schema";

export async function getBudgetStaffPermission(id: number) {
  const [row] = await db
    .select()
    .from(budgetPermissions)
    .where(eq(budgetPermissions.id, id))
    .limit(1);
  return row ?? null;
}



export type BudgetCodeCategory = "plans" | "project-products" | "key-activities" | "money-sources";

export type BudgetCodeRow = {
  id: number;
  code: string;
  name: string;
};

export function codeCategoryTable(category: BudgetCodeCategory): any {
  if (category === "plans") return budgetPlans;
  if (category === "project-products") return budgetProjectProducts;
  if (category === "key-activities") return budgetKeyActivities;
  if (category === "money-sources") return budgetMoneySources;
  return budgetType;
}

export async function getBudgetWithdraw(id: number) {
  const [row] = await db
    .select()
    .from(budgetWithdraw)
    .where(eq(budgetWithdraw.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    recDate: row.recDate,
    document: row.document,
    item: row.item,
    pjActivity: row.pjActivity,
    payType: row.payType,
    money: row.money,
    borrowStatus: row.borrowStatus,
  };
}

export async function getBudgetType(id: number) {
  const [row] = await db
    .select()
    .from(budgetPayTypes)
    .where(eq(budgetPayTypes.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    categoryId: row.payGroupId,
    typeId: row.payTypeId,
    typeName: row.payTypeName,
    payGroupId: row.payGroupId,
    payTypeId: row.payTypeId,
    payTypeName: row.payTypeName,
  };
}

export const getBudgetPayType = getBudgetType;

export async function getBudgetCodeItem(category: string, id: number) {
  if (category === "plans") {
    const [row] = await db
      .select()
      .from(budgetPlans)
      .where(eq(budgetPlans.id, id))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }

  if (category === "project-products") {
    const [row] = await db
      .select()
      .from(budgetProjectProducts)
      .where(eq(budgetProjectProducts.id, id))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }

  if (category === "key-activities") {
    const [row] = await db
      .select()
      .from(budgetKeyActivities)
      .where(eq(budgetKeyActivities.id, id))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }

  if (category === "money-sources") {
    const [row] = await db
      .select()
      .from(budgetMoneySources)
      .where(eq(budgetMoneySources.id, id))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }

  const [row] = await db
    .select()
    .from(budgetPayTypes)
    .where(eq(budgetPayTypes.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    code: String(row.payTypeId),
    name: row.payTypeName,
  };
}

// ---- Stub exports for missing functions ----
export const getLegacyBudgetReceive = async (_id: number): Promise<any> => null;
export async function listBudgetCodeItems(category?: string, budgetYear?: number): Promise<BudgetCodeRow[]> {
  if (category === "plans" && budgetYear) {
    const rows = await db
      .select({
        id: budgetPlans.id,
        code: budgetPlans.code,
        name: budgetPlans.name,
      })
      .from(budgetPlans)
      .where(eq(budgetPlans.budgetYear, budgetYear))
      .orderBy(asc(budgetPlans.id));
    return rows;
  }
  if (category === "project-products" && budgetYear) {
    const rows = await db
      .select({
        id: budgetProjectProducts.id,
        code: budgetProjectProducts.code,
        name: budgetProjectProducts.name,
      })
      .from(budgetProjectProducts)
      .where(eq(budgetProjectProducts.budgetYear, budgetYear))
      .orderBy(asc(budgetProjectProducts.id));
    return rows;
  }
  if (category === "key-activities" && budgetYear) {
    const rows = await db
      .select({
        id: budgetKeyActivities.id,
        code: budgetKeyActivities.code,
        name: budgetKeyActivities.name,
      })
      .from(budgetKeyActivities)
      .where(eq(budgetKeyActivities.budgetYear, budgetYear))
      .orderBy(asc(budgetKeyActivities.id));
    return rows;
  }
  if (category === "money-sources" && budgetYear) {
    const rows = await db
      .select({
        id: budgetMoneySources.id,
        code: budgetMoneySources.code,
        name: budgetMoneySources.name,
      })
      .from(budgetMoneySources)
      .where(eq(budgetMoneySources.budgetYear, budgetYear))
      .orderBy(asc(budgetMoneySources.id));
    return rows;
  }
  return [];
}

export const listBudgetApproveMain = async (_budgetYear: number): Promise<any[]> => [];
export const listBudgetCancelDeegas = async (_budgetYear: number): Promise<any[]> => [];
export async function countBudgetDeegas(budgetYear: number) {
  try {
    const [res] = await db
      .select({ total: count() })
      .from(budgetDeegaTable)
      .where(eq(budgetDeegaTable.budgetYear, budgetYear));
    return res?.total ?? 0;
  } catch (error) {
    console.error("Error counting budget_deega:", error);
    return 0;
  }
}

export async function listBudgetDeegas(budgetYear: number, page = 1) {
  const offset = (page - 1) * PAGE_SIZE;
  try {
    return await db
      .select({
        id: budgetDeegaTable.id,
        budgetYear: budgetDeegaTable.budgetYear,
        deegaNum: budgetDeegaTable.deegaNum,
        doc: budgetDeegaTable.doc,
        receiveNum: budgetDeegaTable.receiveNum,
        item: budgetDeegaTable.item,
        pay: budgetDeegaTable.pay,
        withdraw: budgetDeegaTable.withdraw,
        tax: budgetDeegaTable.tax,
        payGroup: budgetDeegaTable.payGroup,
        recDate: budgetDeegaTable.recDate,
        status: budgetDeegaTable.status,
      })
      .from(budgetDeegaTable)
      .where(eq(budgetDeegaTable.budgetYear, budgetYear))
      .orderBy(desc(budgetDeegaTable.recDate), desc(budgetDeegaTable.id))
      .limit(PAGE_SIZE)
      .offset(offset);
  } catch (error) {
    console.error("Error fetching budget_deega list:", error);
    return [];
  }
}

export async function listBudgetDeegaOptions(budgetYear: number) {
  try {
    return await db
      .select({
        id: budgetDeegaTable.id,
        deegaNum: budgetDeegaTable.deegaNum,
        doc: budgetDeegaTable.doc,
        item: budgetDeegaTable.item,
      })
      .from(budgetDeegaTable)
      .where(eq(budgetDeegaTable.budgetYear, budgetYear))
      .orderBy(desc(budgetDeegaTable.id));
  } catch (error) {
    console.error("Error fetching budget_deega options:", error);
    return [];
  }
}

export async function listBudgetCategories() {
  const rows = await db
    .select({
      id: budgetCategories.id,
      categoryId: budgetCategories.categoryId,
      categoryName: budgetCategories.categoryName,
    })
    .from(budgetCategories)
    .orderBy(asc(budgetCategories.categoryId));
  return rows;
}
export async function countBudgetMoneyReturns(budgetYear: number, q = "") {
  const conds = [eq(budgetMoneyReturn.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetMoneyReturn.item, `%${q}%`));

  const [res] = await db
    .select({ count: count() })
    .from(budgetMoneyReturn)
    .where(and(...conds));
  return res?.count ?? 0;
}

export async function sumBudgetMoneyReturns(budgetYear: number, q = "") {
  const conds = [eq(budgetMoneyReturn.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetMoneyReturn.item, `%${q}%`));

  const [res] = await db
    .select({ total: sum(budgetMoneyReturn.money) })
    .from(budgetMoneyReturn)
    .where(and(...conds));
  return Number(res?.total) || 0;
}

export async function listBudgetMoneyReturnsPage(
  budgetYear: number,
  page: number,
  q = "",
  pageSize = PAGE_SIZE,
) {
  const conds = [eq(budgetMoneyReturn.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetMoneyReturn.item, `%${q}%`));

  const offset = (page - 1) * pageSize;
  const rows = await db
    .select()
    .from(budgetMoneyReturn)
    .where(and(...conds))
    .orderBy(asc(budgetMoneyReturn.recDate), asc(budgetMoneyReturn.id))
    .limit(pageSize)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    budgetYear: r.budgetYear,
    document: r.document,
    item: r.item,
    pjActivity: r.pjActivity,
    money: r.money,
    payType: r.payType,
    pRequest: r.pRequest,
    officer: r.officer,
    recDate: r.recDate,
  }));
}

export async function listBudgetMoneyReturns(budgetYear: number): Promise<any[]> {
  return listBudgetMoneyReturnsPage(budgetYear, 1, "", 1000);
}
export async function listBudgetPayTypes() {
  const rows = await db
    .select({
      id: budgetPayTypes.id,
      payTypeId: budgetPayTypes.payTypeId,
      payGroupId: budgetPayTypes.payGroupId,
      payTypeName: budgetPayTypes.payTypeName,
    })
    .from(budgetPayTypes)
    .orderBy(asc(budgetPayTypes.payTypeId));
  return rows;
}
export const listBudgetPos = async (_budgetYear: number): Promise<any[]> => [];
export const listBudgetReserveMoney = async (_budgetYear: number): Promise<any[]> => [];
export async function listBudgetStaffPermissions() {
  const rows = await db
    .select({
      id: budgetPermissions.id,
      personId: budgetPermissions.personId,
      p1: budgetPermissions.p1,
      p2: budgetPermissions.p2,
      p3: budgetPermissions.p3,
      p4: budgetPermissions.p4,
      p5: budgetPermissions.p5,
      p6: budgetPermissions.p6,
      p7: budgetPermissions.p7,
      p8: budgetPermissions.p8,
      p9: budgetPermissions.p9,
      p10: budgetPermissions.p10,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(budgetPermissions)
    .leftJoin(people, eq(people.personId, budgetPermissions.personId))
    .orderBy(asc(budgetPermissions.id));

  return rows.map((r) => ({
    ...r,
    displayName: [r.prefix, r.firstName, r.lastName].filter(Boolean).join(" ") || r.personId,
  }));
}
export const listBudgetTypeOptions = async (_budgetYear?: number, _kind?: string): Promise<any[]> => [];
export const listBudgetTypes = async (_budgetYear: number): Promise<any[]> => [];
export async function countBudgetWithdraws(budgetYear: number, q = "") {
  const conds = [eq(budgetWithdraw.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetWithdraw.item, `%${q}%`));

  const [res] = await db
    .select({ count: count() })
    .from(budgetWithdraw)
    .where(and(...conds));
  return res?.count ?? 0;
}

export async function sumBudgetWithdraws(budgetYear: number, q = "") {
  const conds = [eq(budgetWithdraw.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetWithdraw.item, `%${q}%`));

  const [res] = await db
    .select({ total: sum(budgetWithdraw.money) })
    .from(budgetWithdraw)
    .where(and(...conds));
  return Number(res?.total) || 0;
}

export async function listBudgetWithdrawsPage(
  budgetYear: number,
  page: number,
  q = "",
  pageSize = PAGE_SIZE,
) {
  const conds = [eq(budgetWithdraw.budgetYear, budgetYear)];
  if (q) conds.push(like(budgetWithdraw.item, `%${q}%`));

  const offset = (page - 1) * pageSize;
  const rows = await db
    .select()
    .from(budgetWithdraw)
    .where(and(...conds))
    .orderBy(desc(budgetWithdraw.id))
    .limit(pageSize)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    budgetYear: r.budgetYear,
    document: r.document,
    item: r.item,
    pjActivity: r.pjActivity,
    money: r.money,
    borrowStatus: r.borrowStatus,
    deega: r.deega,
    officer: r.officer,
    recDate: r.recDate,
  }));
}

export async function listProjectOptions(budgetYear: number) {
  const rows = await db
    .select({
      id: budgetProject.id,
      code: budgetProject.code,
      name: budgetProject.name,
    })
    .from(budgetProject)
    .where(eq(budgetProject.budgetYear, budgetYear))
    .orderBy(asc(budgetProject.code));
  return rows;
}

export async function listActivityOptions(budgetYear: number) {
  const rows = await db
    .select({
      id: budgetKeyActivity.id,
      code: budgetKeyActivity.code,
      name: budgetKeyActivity.name,
    })
    .from(budgetKeyActivity)
    .where(eq(budgetKeyActivity.budgetYear, budgetYear))
    .orderBy(asc(budgetKeyActivity.code));
  return rows;
}

export async function listBudgetWithdraws(budgetYear: number): Promise<any[]> {
  return listBudgetWithdrawsPage(budgetYear, 1, "", 1000);
}
export const listLegacyBudgetReceive = async (_budgetYear: number): Promise<any[]> => [];
export async function listPersonOptions() {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(and(eq(people.organizationType, "district"), eq(people.status, 0)))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((r) => ({
    personId: r.personId,
    displayName: [r.prefix, r.firstName, r.lastName].filter(Boolean).join(" "),
  }));
}

export async function listPlanOptions(budgetYear: number) {
  return db
    .select({
      id: budgetPlans.id,
      code: budgetPlans.code,
      name: budgetPlans.name,
    })
    .from(budgetPlans)
    .where(eq(budgetPlans.budgetYear, budgetYear))
    .orderBy(asc(budgetPlans.code));
}

export async function listReceiveOptions(budgetYear: number) {
  return db
    .select({
      num: budgetReceives.num,
      bookNumber: budgetReceives.bookNumber,
      item: budgetReceives.item,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .groupBy(budgetReceives.num, budgetReceives.bookNumber, budgetReceives.item)
    .orderBy(desc(budgetReceives.num));
}

export type BudgetReceiveRow = {
  id: number;
  budgetYear: number;
  num: number;
  bookNumber: string | null;
  outDate: string | null;
  item: string;
  detail: string | null;
  money: number;
  file: string | null;
  recDate: string | null;
};

export type BudgetReceiveDetail = BudgetReceiveRow & {
  bookRef: string | null;
  plan: string | null;
  project: string | null;
  activity: string | null;
  activity2: string | null;
  mSource: string | null;
  account: string | null;
  mPay: string | null;
};

export async function countBudgetReceives(budgetYear: number, q: string = "") {
  const conditions = [eq(budgetReceives.budgetYear, budgetYear)];
  if (q.trim()) {
    conditions.push(
      or(
        like(budgetReceives.item, `%${q.trim()}%`),
        like(budgetReceives.bookNumber, `%${q.trim()}%`),
      )!,
    );
  }
  const [row] = await db
    .select({ count: count() })
    .from(budgetReceives)
    .where(and(...conditions));
  return Number(row?.count ?? 0);
}

export async function sumBudgetReceives(budgetYear: number, q: string = "") {
  const conditions = [eq(budgetReceives.budgetYear, budgetYear)];
  if (q.trim()) {
    conditions.push(
      or(
        like(budgetReceives.item, `%${q.trim()}%`),
        like(budgetReceives.bookNumber, `%${q.trim()}%`),
      )!,
    );
  }
  const [row] = await db
    .select({ totalMoney: sum(budgetReceives.money) })
    .from(budgetReceives)
    .where(and(...conditions));
  return Number(row?.totalMoney ?? 0);
}

export async function listBudgetReceivesPage(options: {
  budgetYear: number;
  page: number;
  q: string;
}): Promise<BudgetReceiveRow[]> {
  const offset = (options.page - 1) * PAGE_SIZE;
  const conditions = [eq(budgetReceives.budgetYear, options.budgetYear)];
  if (options.q.trim()) {
    conditions.push(
      or(
        like(budgetReceives.item, `%${options.q.trim()}%`),
        like(budgetReceives.bookNumber, `%${options.q.trim()}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: budgetReceives.id,
      budgetYear: budgetReceives.budgetYear,
      num: budgetReceives.num,
      bookNumber: budgetReceives.bookNumber,
      outDate: budgetReceives.outDate,
      item: budgetReceives.item,
      detail: budgetReceives.detail,
      money: budgetReceives.money,
      file: budgetReceives.file,
      recDate: budgetReceives.recDate,
    })
    .from(budgetReceives)
    .where(and(...conditions))
    .orderBy(asc(budgetReceives.num), asc(budgetReceives.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows;
}

export async function getBudgetReceive(id: number): Promise<BudgetReceiveDetail | null> {
  const [row] = await db
    .select({
      id: budgetReceives.id,
      budgetYear: budgetReceives.budgetYear,
      num: budgetReceives.num,
      bookNumber: budgetReceives.bookNumber,
      outDate: budgetReceives.outDate,
      bookRef: budgetReceives.bookRef,
      plan: budgetReceives.plan,
      project: budgetReceives.project,
      activity: budgetReceives.activity,
      activity2: budgetReceives.activity2,
      mSource: budgetReceives.mSource,
      account: budgetReceives.account,
      mPay: budgetReceives.mPay,
      item: budgetReceives.item,
      detail: budgetReceives.detail,
      money: budgetReceives.money,
      file: budgetReceives.file,
      recDate: budgetReceives.recDate,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.id, id));
  return row ?? null;
}

