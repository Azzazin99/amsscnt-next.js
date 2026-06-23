import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  or,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetMain,
  budgetPayTypes,
  budgetYears,
  people,
} from "@/lib/db/schema";
import { BUDGET_TYPE_MAIN } from "@/lib/budget/constants";

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
  status: number | null;
  payGroup: number | null;
  payGroupName: string | null;
  payedPerson: string | null;
  officer: string | null;
  officerName: string | null;
};

export type BudgetMainDetail = BudgetMainRow & {
  typeId: number;
  referWdId: number | null;
  referDeegaId: number | null;
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
  return db.select().from(budgetYears).orderBy(asc(budgetYears.budgetYear));
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

function searchWhere(
  budgetYear: number,
  q: string,
  kind: "receive" | "disburse",
) {
  const parts = [
    eq(budgetMain.budgetYear, budgetYear),
    eq(budgetMain.typeId, BUDGET_TYPE_MAIN),
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
        ilike(budgetMain.doc, pattern),
        ilike(budgetMain.item, pattern),
        ilike(budgetMain.payedPerson, pattern),
      )!,
    );
  }

  return and(...parts);
}

export async function countBudgetMain(
  budgetYear: number,
  q: string,
  kind: "receive" | "disburse",
) {
  const [row] = await db
    .select({ total: count() })
    .from(budgetMain)
    .where(searchWhere(budgetYear, q, kind));
  return row?.total ?? 0;
}

export async function listBudgetMainPage(options: {
  budgetYear: number;
  page: number;
  q: string;
  kind: "receive" | "disburse";
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
      status: budgetMain.status,
      payGroup: budgetMain.payGroup,
      payGroupName: budgetPayTypes.payTypeName,
      payedPerson: budgetMain.payedPerson,
      officer: budgetMain.officer,
      officerPrefix: people.prefix,
      officerFirstName: people.firstName,
      officerLastName: people.lastName,
    })
    .from(budgetMain)
    .leftJoin(
      budgetPayTypes,
      eq(budgetPayTypes.payTypeId, budgetMain.payGroup),
    )
    .leftJoin(people, eq(people.personId, budgetMain.officer))
    .where(searchWhere(options.budgetYear, options.q, options.kind))
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
    status: r.status,
    payGroup: r.payGroup,
    payGroupName: r.payGroupName,
    payedPerson: r.payedPerson,
    officer: r.officer,
    officerName: [r.officerPrefix, r.officerFirstName, r.officerLastName]
      .filter(Boolean)
      .join(" "),
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
  };
}
