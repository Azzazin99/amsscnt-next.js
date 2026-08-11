import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  max,
  ne,
  notInArray,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetDeega,
  budgetKeyActivity,
  budgetMain,
  budgetMoneyReturn,
  budgetMoneySources,
  budgetPayTypes,
  budgetPlans,
  budgetProject,
  budgetReceives,
  budgetReserveMoneyTable,
  budgetReturnDeega,
  budgetType,
  budgetWithdraw,
  people,
  planActivities,
  planProjects,
  systemWorkgroups,
} from "@/lib/db/schema";
import {
  BUDGET_KIND_CATEGORY,
  BUDGET_TYPE_MAIN,
  payGroupLabel,
  type BudgetMoneyKind,
} from "@/lib/budget/constants";

export type ReportColumn = {
  key: string;
  label: string;
  align?: "right" | "center";
};

export type ReportRow = Record<string, string | number | null>;

export type ReportTable = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

const EMPTY: ReportTable = { columns: [], rows: [] };

async function typeIdsForKind(
  budgetYear: number,
  kind: BudgetMoneyKind,
): Promise<number[]> {
  if (kind === "budget") return [BUDGET_TYPE_MAIN];
  const rows = await db
    .select({ typeId: budgetType.typeId })
    .from(budgetType)
    .where(
      and(
        eq(budgetType.budgetYear, budgetYear),
        eq(budgetType.categoryId, BUDGET_KIND_CATEGORY[kind] as any),
      ),
    );
  const ids = rows.map((r) => r.typeId);
  return ids.length ? ids : [-1];
}

// ---------------------------------------------------------------------------
// รายงานการจัดสรรงบประมาณ — สรุปตามแผนงาน (budget_receive)
// ---------------------------------------------------------------------------

export async function reportAllocationByPlan(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({ plan: budgetReceives.plan, money: budgetReceives.money })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear));

  const map = new Map<string, number>();
  for (const r of rows) {
    const planKey = r.plan ?? "—";
    map.set(planKey, (map.get(planKey) ?? 0) + (r.money ?? 0));
  }

  return {
    columns: [
      { key: "plan", label: "แผนงาน" },
      { key: "money", label: "รับจัดสรร (บาท)", align: "right" },
    ],
    rows: [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([plan, money]) => ({ plan, money })),
  };
}

export async function reportSpendingByProject(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({ project: budgetReceives.project, money: budgetReceives.money })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear));

  const map = new Map<string, number>();
  for (const r of rows) {
    const projectKey = r.project || "—";
    map.set(projectKey, (map.get(projectKey) ?? 0) + (r.money ?? 0));
  }

  return {
    columns: [
      { key: "project", label: "ผลผลิต/โครงการ" },
      { key: "money", label: "จำนวนเงิน (บาท)", align: "right" },
    ],
    rows: [...map.entries()].map(([project, money]) => ({ project, money })),
  };
}

export async function reportInstallmentRegister(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({
      num: budgetReceives.num,
      bookNumber: budgetReceives.bookNumber,
      plan: budgetReceives.plan,
      activity2: budgetReceives.activity2,
      money: budgetReceives.money,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(asc(budgetReceives.num), asc(budgetReceives.id));

  return {
    columns: [
      { key: "num", label: "งวดที่" },
      { key: "bookNumber", label: "เลขที่หนังสือ" },
      { key: "plan", label: "แผนงาน" },
      { key: "activity2", label: "กิจกรรม" },
      { key: "money", label: "จำนวนเงิน (บาท)", align: "right" },
    ],
    rows: rows.map((r) => ({
      num: r.num,
      bookNumber: r.bookNumber,
      plan: r.plan,
      activity2: r.activity2,
      money: r.money,
    })),
  };
}

export async function reportRemainingByInstallment(
  budgetYear: number,
): Promise<ReportTable> {
  const receives = await db
    .select({
      id: budgetReceives.id,
      num: budgetReceives.num,
      item: budgetReceives.item,
      money: budgetReceives.money,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(asc(budgetReceives.num));

  const deegaRows = await db
    .select({
      receiveNum: budgetDeega.receiveNum,
      withdraw: budgetDeega.withdraw,
    })
    .from(budgetDeega)
    .where(eq(budgetDeega.budgetYear, budgetYear))
    .catch(() => []);

  const returnRows = await db
    .select({
      receiveNum: budgetReturnDeega.receiveNum,
      money: budgetReturnDeega.money,
    })
    .from(budgetReturnDeega)
    .where(eq(budgetReturnDeega.budgetYear, budgetYear))
    .catch(() => []);

  const withdrawMap = new Map<string, number>();
  for (const d of deegaRows) {
    if (!d.receiveNum) continue;
    const key = String(d.receiveNum);
    withdrawMap.set(key, (withdrawMap.get(key) ?? 0) + (d.withdraw ?? 0));
  }

  const returnMap = new Map<string, number>();
  for (const r of returnRows) {
    if (!r.receiveNum) continue;
    const key = String(r.receiveNum);
    returnMap.set(key, (returnMap.get(key) ?? 0) + (r.money ?? 0));
  }

  const rows = receives.map((r) => {
    const numKey = String(r.num ?? "");
    const money = r.money ?? 0;
    const withdraw = withdrawMap.get(numKey) ?? 0;
    const moneyReturn = returnMap.get(numKey) ?? 0;
    const remaining = money + moneyReturn - withdraw;
    const percent = money > 0 ? ((withdraw - moneyReturn) / money) * 100 : 0;

    return {
      num: r.num,
      item: r.item,
      money,
      withdraw,
      moneyReturn,
      remaining,
      percent: Number(percent.toFixed(2)),
    };
  });

  return {
    columns: [
      { key: "num", label: "เลขที่ใบงวด" },
      { key: "item", label: "รายการ" },
      { key: "money", label: "จำนวนเงิน", align: "right" },
      { key: "withdraw", label: "ฎีกาเบิก", align: "right" },
      { key: "moneyReturn", label: "คืนคลัง", align: "right" },
      { key: "remaining", label: "คงเหลือ", align: "right" },
      { key: "percent", label: "%จ่าย", align: "right" },
    ],
    rows,
  };
}

// ---------------------------------------------------------------------------
// การใช้จ่าย — จำแนกตามรหัสงบประมาณ / ประเภทรายการจ่าย (budget_main)
// ---------------------------------------------------------------------------

export async function reportPayByBudgetCode(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({ typeId: budgetMain.typeId, payAmount: budgetMain.payAmount })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.payAmount),
      ),
    );

  const map = new Map<number, number>();
  for (const r of rows)
    map.set(r.typeId, (map.get(r.typeId) ?? 0) + (r.payAmount ?? 0));

  return {
    columns: [
      { key: "typeId", label: "รหัสประเภทเงิน" },
      { key: "total", label: "ยอดจ่าย (บาท)", align: "right" },
    ],
    rows: [...map.entries()].map(([typeId, total]) => ({ typeId, total })),
  };
}

export async function reportPayByPayType(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({ payGroup: budgetMain.payGroup, payAmount: budgetMain.payAmount })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.payAmount),
      ),
    );

  const map = new Map<number, number>();
  for (const r of rows) {
    const key = r.payGroup ?? 0;
    map.set(key, (map.get(key) ?? 0) + (r.payAmount ?? 0));
  }

  return {
    columns: [
      { key: "payType", label: "งบรายจ่าย" },
      { key: "total", label: "ยอดจ่าย (บาท)", align: "right" },
    ],
    rows: [...map.entries()].map(([g, total]) => ({
      payType: payGroupLabel(g || null),
      total,
    })),
  };
}

// ---------------------------------------------------------------------------
// สมุดเงินสด / เงินคงเหลือรายวัน / รายวันการจ่าย (budget_main ledger)
// ---------------------------------------------------------------------------

async function mainLedger(budgetYear: number) {
  return db
    .select({
      recDate: budgetMain.recDate,
      doc: budgetMain.doc,
      item: budgetMain.item,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
      typeId: budgetMain.typeId,
    })
    .from(budgetMain)
    .where(eq(budgetMain.budgetYear, budgetYear))
    .orderBy(asc(budgetMain.recDate), asc(budgetMain.id));
}

export async function reportCashBook(budgetYear: number): Promise<ReportTable> {
  const rows = await mainLedger(budgetYear);
  let balance = 0;
  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "doc", label: "ที่เอกสาร" },
      { key: "item", label: "รายการ" },
      { key: "receive", label: "รับ", align: "right" },
      { key: "pay", label: "จ่าย", align: "right" },
      { key: "balance", label: "คงเหลือ", align: "right" },
    ],
    rows: rows.map((r) => {
      balance += (r.receiveAmount ?? 0) - (r.payAmount ?? 0);
      return {
        recDate: r.recDate,
        doc: r.doc,
        item: r.item,
        receive: r.receiveAmount ?? 0,
        pay: r.payAmount ?? 0,
        balance,
      };
    }),
  };
}

export async function reportDailyBalance(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await mainLedger(budgetYear);
  const map = new Map<string, { receive: number; pay: number }>();
  for (const r of rows) {
    const key = r.recDate ?? "—";
    const cur = map.get(key) ?? { receive: 0, pay: 0 };
    cur.receive += r.receiveAmount ?? 0;
    cur.pay += r.payAmount ?? 0;
    map.set(key, cur);
  }
  let balance = 0;
  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "receive", label: "รับรวม", align: "right" },
      { key: "pay", label: "จ่ายรวม", align: "right" },
      { key: "balance", label: "คงเหลือ", align: "right" },
    ],
    rows: [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([recDate, v]) => {
        balance += v.receive - v.pay;
        return { recDate, receive: v.receive, pay: v.pay, balance };
      }),
  };
}

export async function reportDailyPayments(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({
      recDate: budgetMain.recDate,
      doc: budgetMain.doc,
      item: budgetMain.item,
      payAmount: budgetMain.payAmount,
      payedPerson: budgetMain.payedPerson,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.payAmount),
      ),
    )
    .orderBy(desc(budgetMain.recDate), desc(budgetMain.id));

  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "doc", label: "ที่เอกสาร" },
      { key: "item", label: "รายการ" },
      { key: "payedPerson", label: "ผู้รับเงิน" },
      { key: "payAmount", label: "จำนวนเงิน", align: "right" },
    ],
    rows: rows.map((r) => ({
      recDate: r.recDate,
      doc: r.doc,
      item: r.item,
      payedPerson: r.payedPerson ?? "—",
      payAmount: r.payAmount ?? 0,
    })),
  };
}

/** สมุดเงินตามประเภท (budget/extra/income) */
export async function reportMoneyBook(
  budgetYear: number,
  kind: BudgetMoneyKind,
): Promise<ReportTable> {
  const typeIds = await typeIdsForKind(budgetYear, kind);
  const rows = await db
    .select({
      recDate: budgetMain.recDate,
      doc: budgetMain.doc,
      item: budgetMain.item,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        inArray(budgetMain.typeId, typeIds),
      ),
    )
    .orderBy(asc(budgetMain.recDate), asc(budgetMain.id));

  let balance = 0;
  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "doc", label: "ที่เอกสาร" },
      { key: "item", label: "รายการ" },
      { key: "receive", label: "รับ", align: "right" },
      { key: "pay", label: "จ่าย", align: "right" },
      { key: "balance", label: "คงเหลือ", align: "right" },
    ],
    rows: rows.map((r) => {
      balance += (r.receiveAmount ?? 0) - (r.payAmount ?? 0);
      return {
        recDate: r.recDate,
        doc: r.doc,
        item: r.item,
        receive: r.receiveAmount ?? 0,
        pay: r.payAmount ?? 0,
        balance,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// ลูกหนี้เงินยืม / โครงการเงินเหลือจ่าย
// ---------------------------------------------------------------------------

export async function reportDebtors(budgetYear: number): Promise<ReportTable> {
  const rows = await db
    .select({
      recDate: (budgetWithdraw as any).recDate,
      document: (budgetWithdraw as any).document,
      item: (budgetWithdraw as any).item,
      pRequest: (budgetWithdraw as any).pRequest,
      money: (budgetWithdraw as any).money,
      borrowStatus: (budgetWithdraw as any).borrowStatus,
    })
    .from(budgetWithdraw as any)
    .where(
      and(
        eq((budgetWithdraw as any).budgetYear, budgetYear),
        eq((budgetWithdraw as any).borrowStatus, 1),
      ),
    )
    .orderBy(desc((budgetWithdraw as any).recDate));

  return {
    columns: [
      { key: "recDate", label: "วันที่ยืม" },
      { key: "document", label: "เลขที่" },
      { key: "item", label: "รายการ" },
      { key: "pRequest", label: "ผู้ยืม" },
      { key: "money", label: "จำนวนเงิน", align: "right" },
    ],
    rows: rows.map((r) => ({
      recDate: r.recDate,
      document: r.document,
      item: r.item,
      pRequest: r.pRequest || "—",
      money: r.money,
    })),
  };
}

export async function reportSurplusProjects(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({
      recDate: budgetReceives.recDate,
      plan: budgetReceives.plan,
      project: budgetReceives.project,
      activity2: budgetReceives.activity2,
      money: budgetReceives.money,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(desc(budgetReceives.id));

  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "plan", label: "แผนงาน" },
      { key: "project", label: "โครงการ" },
      { key: "activity2", label: "กิจกรรม" },
      { key: "money", label: "จำนวนเงิน", align: "right" },
    ],
    rows: rows.map((r: any) => ({
      recDate: r.recDate,
      plan: r.plan,
      project: r.project || "—",
      activity2: r.activity2,
      money: r.money,
    })),
  };
}

// ---------------------------------------------------------------------------
// ตรวจสอบ (checks)
// ---------------------------------------------------------------------------

export async function checkSpendingByInstallment(
  budgetYear: number,
): Promise<ReportTable> {
  return reportInstallmentRegister(budgetYear);
}

export type PayCheckItem = {
  id: number;
  recDate: string;
  item: string;
  payAmount: number;
  typeId: number | null;
  approve: number | null;
  checkNumber: string | null;
};

export async function reportPayCheckMain(
  budgetYear: number,
): Promise<PayCheckItem[]> {
  const rows = await db
    .select({
      id: budgetMain.id,
      recDate: budgetMain.recDate,
      item: budgetMain.item,
      payAmount: budgetMain.payAmount,
      typeId: budgetMain.typeId,
      approve: budgetMain.approve,
      checkNumber: budgetMain.checkNumber,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.payAmount),
      ),
    )
    .orderBy(asc(budgetMain.recDate), asc(budgetMain.id));

  return rows.map((r) => ({
    id: r.id,
    recDate: r.recDate,
    item: r.item,
    payAmount: r.payAmount ?? 0,
    typeId: r.typeId,
    approve: r.approve,
    checkNumber: r.checkNumber,
  }));
}

export type PayCheckDetail = {
  id: number;
  budgetYear: number;
  recDate: string;
  doc: string;
  referWdId: number | null;
  referWdItem: string | null;
  typeId: number | null;
  item: string;
  payGroup: number | null;
  payGroupName: string | null;
  payAmount: number;
  payedPerson: string | null;
  officer: string | null;
  officerFullName: string;
  approve: number | null;
  approveName: string | null;
  approveFullName: string;
  approveDate: string | null;
  status: number | null;
  checkNumber: string | null;
  payee: string | null;
  payer: string | null;
  payerFullName: string;
  payDate: string | null;
};

export async function getReportPayCheckDetail(
  id: number,
): Promise<PayCheckDetail | null> {
  const [row] = await db
    .select({
      id: budgetMain.id,
      budgetYear: budgetMain.budgetYear,
      recDate: budgetMain.recDate,
      doc: budgetMain.doc,
      referWdId: budgetMain.referWdId,
      typeId: budgetMain.typeId,
      item: budgetMain.item,
      payGroup: budgetMain.payGroup,
      payGroupName: budgetPayTypes.payTypeName,
      payAmount: budgetMain.payAmount,
      payedPerson: budgetMain.payedPerson,
      officer: budgetMain.officer,
      approve: budgetMain.approve,
      approveName: budgetMain.approveName,
      approveDate: budgetMain.approveDate,
      status: budgetMain.status,
      checkNumber: budgetMain.checkNumber,
      payee: budgetMain.payee,
      payer: budgetMain.payer,
      payDate: budgetMain.payDate,
    })
    .from(budgetMain)
    .leftJoin(
      budgetPayTypes,
      eq(budgetPayTypes.payTypeId, budgetMain.payGroup),
    )
    .where(eq(budgetMain.id, id))
    .limit(1);

  if (!row) return null;

  let referWdItem: string | null = null;
  if (row.referWdId) {
    const [wd] = await db
      .select({ item: budgetWithdraw.item })
      .from(budgetWithdraw)
      .where(eq(budgetWithdraw.id, row.referWdId))
      .limit(1);
    if (wd) referWdItem = wd.item;
  }

  let officerFullName = row.officer || "—";
  if (row.officer) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, row.officer))
      .limit(1);
    if (p) {
      officerFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  let approveFullName = row.approveName || "—";
  if (row.approveName) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, row.approveName))
      .limit(1);
    if (p) {
      approveFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  let payerFullName = row.payer || "—";
  if (row.payer) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, row.payer))
      .limit(1);
    if (p) {
      payerFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    recDate: row.recDate,
    doc: row.doc ?? "",
    referWdId: row.referWdId,
    referWdItem,
    typeId: row.typeId,
    item: row.item,
    payGroup: row.payGroup,
    payGroupName: row.payGroupName ?? null,
    payAmount: row.payAmount ?? 0,
    payedPerson: row.payedPerson,
    officer: row.officer,
    officerFullName,
    approve: row.approve,
    approveName: row.approveName,
    approveFullName,
    approveDate: row.approveDate,
    status: row.status,
    checkNumber: row.checkNumber,
    payee: row.payee,
    payer: row.payer,
    payerFullName,
    payDate: row.payDate,
  };
}

export async function checkPayMain(budgetYear: number): Promise<ReportTable> {
  return reportDailyPayments(budgetYear);
}

/** ฎีกากับการอ้างอิงการขอเบิก */
export async function checkDeegaByWithdraw(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({
      recDate: (budgetDeega as any).recDate,
      doc: (budgetDeega as any).doc,
      receiveNum: (budgetDeega as any).receiveNum,
      item: (budgetDeega as any).item,
      pay: (budgetDeega as any).pay,
    })
    .from(budgetDeega as any)
    .where(eq((budgetDeega as any).budgetYear, budgetYear))
    .orderBy(desc((budgetDeega as any).recDate));

  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "doc", label: "เลขที่ฎีกา" },
      { key: "receiveNum", label: "อ้างอิงขอเบิก" },
      { key: "item", label: "รายการ" },
      { key: "pay", label: "จำนวนเงิน", align: "right" },
    ],
    rows: rows.map((r: any) => ({
      recDate: r.recDate,
      doc: r.doc,
      receiveNum: r.receiveNum || "—",
      item: r.item,
      pay: r.pay,
    })),
  };
}

/** รายการขอเบิกฯที่ยังไม่ได้วางฎีกา (withdraw_status = 0) */
export async function checkUnpostedWithdraw(
  budgetYear: number,
): Promise<ReportTable> {
  const rows = await db
    .select({
      recDate: (budgetWithdraw as any).recDate,
      document: (budgetWithdraw as any).document,
      item: (budgetWithdraw as any).item,
      pjActivity: (budgetWithdraw as any).pjActivity,
      money: (budgetWithdraw as any).money,
    })
    .from(budgetWithdraw as any)
    .where(
      and(
        eq((budgetWithdraw as any).budgetYear, budgetYear),
        eq((budgetWithdraw as any).withdrawStatus, 0),
      ),
    )
    .orderBy(desc(budgetWithdraw.recDate));

  return {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "document", label: "เลขที่" },
      { key: "item", label: "รายการ" },
      { key: "pjActivity", label: "กิจกรรม" },
      { key: "money", label: "จำนวนเงิน", align: "right" },
    ],
    rows: rows.map((r) => ({
      recDate: r.recDate,
      document: r.document,
      item: r.item,
      pjActivity: r.pjActivity,
      money: r.money,
    })),
  };
}

export type DeegaCutItem = {
  num: number;
  withdrawDeega: number;
  withdrawProject: number;
  diff: number;
};

export async function reportDeegaCutByInstallment(
  budgetYear: number,
): Promise<DeegaCutItem[]> {
  // 1. Get max num from budgetReceives
  const [maxRec] = await db
    .select({ maxNum: max(budgetReceives.num) })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear));

  const maxNum = maxRec?.maxNum ?? 0;
  if (maxNum === 0) return [];

  // 2. Aggregate withdraw from budgetDeega by receiveNum
  const deegaSumRows = await db
    .select({
      receiveNum: budgetDeega.receiveNum,
      totalWithdraw: sum(budgetDeega.withdraw),
    })
    .from(budgetDeega)
    .where(eq(budgetDeega.budgetYear, budgetYear))
    .groupBy(budgetDeega.receiveNum)
    .catch(() => []);

  const deegaMap = new Map<number, number>();
  for (const r of deegaSumRows) {
    if (r.receiveNum) {
      deegaMap.set(Number(r.receiveNum), Number(r.totalWithdraw) || 0);
    }
  }

  // 3. Aggregate money from budgetWithdraw joined with planActivities by codeApprove ('2_1', '2_2', ...)
  const projectSumRows = await db
    .select({
      codeApprove: planActivities.codeApprove,
      totalMoney: sum(budgetWithdraw.money),
    })
    .from(budgetWithdraw)
    .leftJoin(
      planActivities,
      and(
        eq(budgetWithdraw.pjActivity, planActivities.codeActi),
        eq(budgetWithdraw.budgetYear, planActivities.budgetYear),
      ),
    )
    .where(eq(budgetWithdraw.budgetYear, budgetYear))
    .groupBy(planActivities.codeApprove)
    .catch(() => []);

  const projectMap = new Map<number, number>();
  for (const r of projectSumRows) {
    if (r.codeApprove && r.codeApprove.startsWith("2_")) {
      const numPart = Number(r.codeApprove.replace("2_", ""));
      if (!isNaN(numPart)) {
        projectMap.set(
          numPart,
          (projectMap.get(numPart) || 0) + (Number(r.totalMoney) || 0),
        );
      }
    }
  }

  // 4. Build items for num = 1..maxNum
  const items: DeegaCutItem[] = [];
  for (let i = 1; i <= maxNum; i++) {
    const deegaVal = deegaMap.get(i) || 0;
    const projVal = projectMap.get(i) || 0;
    const diffVal = deegaVal - projVal;

    items.push({
      num: i,
      withdrawDeega: deegaVal,
      withdrawProject: projVal,
      diff: diffVal,
    });
  }

  return items;
}

export type DeegaWithdrawRefItem = {
  id: number;
  deegaNum: string;
  withdrawDeega: number;
  withdrawMoney: number;
  diff: number;
};

export async function reportDeegaByWithdrawRef(
  budgetYear: number,
): Promise<DeegaWithdrawRefItem[]> {
  // 1. Fetch deega rows where receive_num not in ('oth', 'sly', 'ctr', 'etr')
  const deegaRows = await db
    .select({
      id: budgetDeega.id,
      deegaNum: budgetDeega.deegaNum,
      withdraw: budgetDeega.withdraw,
    })
    .from(budgetDeega)
    .where(
      and(
        eq(budgetDeega.budgetYear, budgetYear),
        notInArray(budgetDeega.receiveNum, ["oth", "sly", "ctr", "etr"]),
      ),
    )
    .orderBy(asc(budgetDeega.id))
    .catch(() => []);

  // 2. Fetch sum(money) grouped by deega from budgetWithdraw
  const withdrawSumRows = await db
    .select({
      deega: budgetWithdraw.deega,
      totalMoney: sum(budgetWithdraw.money),
    })
    .from(budgetWithdraw)
    .where(eq(budgetWithdraw.budgetYear, budgetYear))
    .groupBy(budgetWithdraw.deega)
    .catch(() => []);

  const withdrawMap = new Map<string, number>();
  for (const r of withdrawSumRows) {
    if (r.deega) {
      withdrawMap.set(String(r.deega), Number(r.totalMoney) || 0);
    }
  }

  // 3. Map items
  return deegaRows.map((r) => {
    const deegaVal = Number(r.withdraw) || 0;
    const strNum = r.deegaNum != null ? String(r.deegaNum) : "—";
    const withdrawVal = withdrawMap.get(strNum) || 0;
    return {
      id: r.id,
      deegaNum: strNum,
      withdrawDeega: deegaVal,
      withdrawMoney: withdrawVal,
      diff: deegaVal - withdrawVal,
    };
  });
}

export type DailyPaymentItem = {
  id: number;
  item: string;
  payAmount: number;
  payee: string | null;
  checkNumber: string | null;
  status: number | null;
  payerFullName: string;
};

export type DailyPaymentReport = {
  items: DailyPaymentItem[];
  totalPayAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  overdue15Count: number;
  overdue15Amount: number;
};

export async function reportDailyPaymentsList(
  budgetYear: number,
  payDate: string,
): Promise<DailyPaymentReport> {
  // 1. Fetch payments for specified payDate
  const rows = await db
    .select({
      id: budgetMain.id,
      item: budgetMain.item,
      payAmount: budgetMain.payAmount,
      payee: budgetMain.payee,
      checkNumber: budgetMain.checkNumber,
      status: budgetMain.status,
      payer: budgetMain.payer,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        eq(budgetMain.payDate, payDate),
      ),
    )
    .orderBy(budgetMain.payDate, budgetMain.checkNumber)
    .catch(() => []);

  // Fetch payer officer full names
  const items: DailyPaymentItem[] = [];
  for (const r of rows) {
    let payerFullName = r.payer || "—";
    if (r.payer) {
      const [p] = await db
        .select({
          prefix: people.prefix,
          firstName: people.firstName,
          lastName: people.lastName,
        })
        .from(people)
        .where(eq(people.personId, r.payer))
        .limit(1);
      if (p) {
        payerFullName = [p.prefix, p.firstName, p.lastName]
          .filter(Boolean)
          .join(" ");
      }
    }
    items.push({
      id: r.id,
      item: r.item,
      payAmount: Number(r.payAmount) || 0,
      payee: r.payee,
      checkNumber: r.checkNumber,
      status: r.status,
      payerFullName,
    });
  }

  const totalPayAmount = items.reduce((acc, r) => acc + r.payAmount, 0);

  // 2. Fetch unpaid stats in this budgetYear
  const unpaidRows = await db
    .select({
      payAmount: budgetMain.payAmount,
      recDate: budgetMain.recDate,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.payAmount),
        sql`(${budgetMain.checkNumber} IS NULL OR ${budgetMain.checkNumber} = '')`,
      ),
    )
    .catch(() => []);

  const unpaidCount = unpaidRows.length;
  const unpaidAmount = unpaidRows.reduce(
    (acc, r) => acc + (Number(r.payAmount) || 0),
    0,
  );

  // Calculate overdue 15 days
  const today = new Date();
  const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
  const cutoffStr = fifteenDaysAgo.toISOString().split("T")[0];

  const overdue15Rows = unpaidRows.filter(
    (r) => r.recDate && r.recDate <= cutoffStr,
  );
  const overdue15Count = overdue15Rows.length;
  const overdue15Amount = overdue15Rows.reduce(
    (acc, r) => acc + (Number(r.payAmount) || 0),
    0,
  );

  return {
    items,
    totalPayAmount,
    unpaidCount,
    unpaidAmount,
    overdue15Count,
    overdue15Amount,
  };
}

export type AllocationActivity = {
  id: number;
  codeActi: string;
  nameActi: string;
  budgetActi: number;
  codeApproveText: string;
  stop: number | null;
};

export type AllocationProject = {
  id: number;
  codeProj: string;
  nameProj: string;
  budgetProj: number;
  ownerProjName: string;
  fileDetail: string | null;
  activities: AllocationActivity[];
};

export type SystemWorkgroupItem = {
  workgroup: number;
  workgroupDesc: string;
};

export async function listSystemWorkgroups(): Promise<SystemWorkgroupItem[]> {
  return await db
    .select({
      workgroup: systemWorkgroups.workgroup,
      workgroupDesc: systemWorkgroups.workgroupDesc,
    })
    .from(systemWorkgroups)
    .orderBy(asc(systemWorkgroups.workgroup))
    .catch(() => []);
}

export async function reportAllocationByProject(
  budgetYear: number,
  workgroup?: number,
): Promise<{ projects: AllocationProject[]; totalBudget: number }> {
  const conditions = [eq(planProjects.budgetYear, budgetYear)];
  if (workgroup != null && !isNaN(workgroup) && workgroup > 0) {
    conditions.push(eq(planProjects.codeClus, workgroup));
  }

  // 1. Fetch projects from planProjects
  const projs = await db
    .select({
      id: planProjects.id,
      codeClus: planProjects.codeClus,
      codeProj: planProjects.codeProj,
      nameProj: planProjects.nameProj,
      budgetProj: planProjects.budgetProj,
      ownerProj: planProjects.ownerProj,
      fileDetail: planProjects.fileDetail,
    })
    .from(planProjects)
    .where(and(...conditions))
    .orderBy(planProjects.codeProj)
    .catch(() => []);

  // 2. Fetch activities from planActivities
  const activities = await db
    .select({
      id: planActivities.id,
      codeProj: planActivities.codeProj,
      codeActi: planActivities.codeActi,
      nameActi: planActivities.nameActi,
      budgetActi: planActivities.budgetActi,
      codeApprove: planActivities.codeApprove,
      stop: planActivities.stop,
    })
    .from(planActivities)
    .where(eq(planActivities.budgetYear, budgetYear))
    .orderBy(planActivities.codeActi)
    .catch(() => []);

  // 3. Fetch people map for ownerProj
  const peopleRows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .catch(() => []);

  const peopleMap = new Map<string, string>();
  for (const p of peopleRows) {
    peopleMap.set(
      p.personId,
      [p.prefix, p.firstName, p.lastName].filter(Boolean).join(" "),
    );
  }

  // Group activities by codeProj
  const actiMap = new Map<string, AllocationActivity[]>();
  for (const a of activities) {
    let typeText = "";
    if (
      a.codeApprove &&
      a.codeApprove !== "0" &&
      a.codeApprove !== "No" &&
      a.codeApprove !== "_"
    ) {
      const parts = a.codeApprove.split("_");
      if (parts.length >= 2) {
        const category = parts[0];
        const type = parts[1];
        if (category === "2") {
          typeText = `งบประมาณงวด ${type}`;
        } else if (category === "1") {
          typeText = `นอกงบประมาณ(${type})`;
        }
      }
    }

    const list = actiMap.get(a.codeProj) || [];
    list.push({
      id: a.id,
      codeActi: a.codeActi,
      nameActi: a.nameActi,
      budgetActi: Number(a.budgetActi) || 0,
      codeApproveText: typeText,
      stop: a.stop,
    });
    actiMap.set(a.codeProj, list);
  }

  let totalBudget = 0;
  const projects: AllocationProject[] = projs.map((p) => {
    const projBudget = Number(p.budgetProj) || 0;
    totalBudget += projBudget;
    return {
      id: p.id,
      codeProj: p.codeProj,
      nameProj: p.nameProj,
      budgetProj: projBudget,
      ownerProjName: peopleMap.get(p.ownerProj) || p.ownerProj || "—",
      fileDetail: p.fileDetail,
      activities: actiMap.get(p.codeProj) || [],
    };
  });

  return { projects, totalBudget };
}

export type SpendingActivity = {
  id: number;
  codeActi: string;
  nameActi: string;
  budgetActi: number;
  spentActi: number;
  remainingActi: number;
  percentActi: number;
  stop: number | null;
};

export type SpendingProject = {
  id: number;
  codeProj: string;
  nameProj: string;
  budgetProj: number;
  spentProj: number;
  remainingProj: number;
  percentProj: number;
  activities: SpendingActivity[];
};

export type SpendingByProjectReport = {
  projects: SpendingProject[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalPercent: number;
  todayFormatted: string;
};

export async function reportSpendingByProjectList(
  budgetYear: number,
  workgroup?: number,
): Promise<SpendingByProjectReport> {
  const conditions = [eq(planProjects.budgetYear, budgetYear)];
  if (workgroup != null && !isNaN(workgroup) && workgroup > 0) {
    conditions.push(eq(planProjects.codeClus, workgroup));
  }

  // 1. Fetch projects
  const projs = await db
    .select({
      id: planProjects.id,
      codeClus: planProjects.codeClus,
      codeProj: planProjects.codeProj,
      nameProj: planProjects.nameProj,
      budgetProj: planProjects.budgetProj,
    })
    .from(planProjects)
    .where(and(...conditions))
    .orderBy(planProjects.codeProj)
    .catch(() => []);

  // 2. Fetch activities
  const activities = await db
    .select({
      id: planActivities.id,
      codeProj: planActivities.codeProj,
      codeActi: planActivities.codeActi,
      nameActi: planActivities.nameActi,
      budgetActi: planActivities.budgetActi,
      stop: planActivities.stop,
    })
    .from(planActivities)
    .where(eq(planActivities.budgetYear, budgetYear))
    .orderBy(planActivities.codeActi)
    .catch(() => []);

  // 3. Fetch sum(money) from budgetWithdraw by pjActivity
  const withdrawRows = await db
    .select({
      pjActivity: budgetWithdraw.pjActivity,
      totalMoney: sum(budgetWithdraw.money),
    })
    .from(budgetWithdraw)
    .where(eq(budgetWithdraw.budgetYear, budgetYear))
    .groupBy(budgetWithdraw.pjActivity)
    .catch(() => []);

  const withdrawMap = new Map<string, number>();
  for (const r of withdrawRows) {
    if (r.pjActivity) {
      withdrawMap.set(String(r.pjActivity), Number(r.totalMoney) || 0);
    }
  }

  // 4. Fetch sum(money) from budgetMoneyReturn by pjActivity
  const returnRows = await db
    .select({
      pjActivity: budgetMoneyReturn.pjActivity,
      totalMoney: sum(budgetMoneyReturn.money),
    })
    .from(budgetMoneyReturn)
    .where(eq(budgetMoneyReturn.budgetYear, budgetYear))
    .groupBy(budgetMoneyReturn.pjActivity)
    .catch(() => []);

  const returnMap = new Map<string, number>();
  for (const r of returnRows) {
    if (r.pjActivity) {
      returnMap.set(String(r.pjActivity), Number(r.totalMoney) || 0);
    }
  }

  // 5. Group activities and calculate spending per project & activity
  const actiMap = new Map<string, SpendingActivity[]>();
  for (const a of activities) {
    const allocated = Number(a.budgetActi) || 0;
    const grossSpent = withdrawMap.get(a.codeActi) || 0;
    const returned = returnMap.get(a.codeActi) || 0;
    const netSpent = grossSpent - returned;
    const remaining = allocated - netSpent;
    const percent = allocated > 0 ? (netSpent / allocated) * 100 : 0;

    const item: SpendingActivity = {
      id: a.id,
      codeActi: a.codeActi,
      nameActi: a.nameActi,
      budgetActi: allocated,
      spentActi: netSpent,
      remainingActi: remaining,
      percentActi: percent,
      stop: a.stop,
    };

    const list = actiMap.get(a.codeProj) || [];
    list.push(item);
    actiMap.set(a.codeProj, list);
  }

  let totalBudget = 0;
  let totalSpent = 0;

  const projects: SpendingProject[] = projs.map((p) => {
    const allocated = Number(p.budgetProj) || 0;
    const projActis = actiMap.get(p.codeProj) || [];
    const projSpent = projActis.reduce((acc, r) => acc + r.spentActi, 0);
    const projRemaining = allocated - projSpent;
    const projPercent = allocated > 0 ? (projSpent / allocated) * 100 : 0;

    totalBudget += allocated;
    totalSpent += projSpent;

    return {
      id: p.id,
      codeProj: p.codeProj,
      nameProj: p.nameProj,
      budgetProj: allocated,
      spentProj: projSpent,
      remainingProj: projRemaining,
      percentProj: projPercent,
      activities: projActis,
    };
  });

  const totalRemaining = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const monthNames = [
    "",
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthStr = monthNames[now.getMonth() + 1] || "";
  const yearStr = String(now.getFullYear() + 543);
  const todayFormatted = `วันที่ ${dayStr} เดือน${monthStr} พ.ศ.${yearStr}`;

  return {
    projects,
    totalBudget,
    totalSpent,
    totalRemaining,
    totalPercent,
    todayFormatted,
  };
}

export type ActivityWithdrawItem = {
  id: number;
  dateShort: string;
  item: string;
  money: number;
};

export type ActivityReturnItem = {
  id: number;
  dateShort: string;
  item: string;
  money: number;
};

export type ActivityDetailReport = {
  projectName: string;
  activityName: string;
  activityCode: string;
  withdrawItems: ActivityWithdrawItem[];
  totalWithdraw: number;
  returnItems: ActivityReturnItem[];
  totalReturn: number;
};

const shortThaiMonths: Record<string, string> = {
  "01": "มค",
  "02": "กพ",
  "03": "มีค",
  "04": "เมย",
  "05": "พค",
  "06": "มิย",
  "07": "กค",
  "08": "สค",
  "09": "กย",
  "10": "ตค",
  "11": "พย",
  "12": "ธค",
};

function formatShortThaiDate(dateVal: string | Date | null) {
  if (!dateVal) return "—";
  let dateStr = "";
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, "0");
    const d = String(dateVal.getDate()).padStart(2, "0");
    dateStr = `${y}-${m}-${d}`;
  } else {
    dateStr = String(dateVal);
  }
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  const shortYear = (parseInt(y, 10) + 543) % 100;
  const monthName = shortThaiMonths[m] || m;
  const dayNum = parseInt(d, 10);
  return `${dayNum} ${monthName} ${shortYear}`;
}

export async function reportActivityDetail(
  budgetYear: number,
  pjActivity: string,
): Promise<ActivityDetailReport> {
  // 1. Fetch activity name and codeProj
  const [acti] = await db
    .select({
      codeProj: planActivities.codeProj,
      nameActi: planActivities.nameActi,
      codeActi: planActivities.codeActi,
    })
    .from(planActivities)
    .where(
      and(
        eq(planActivities.budgetYear, budgetYear),
        eq(planActivities.codeActi, pjActivity),
      ),
    )
    .limit(1)
    .catch(() => []);

  let projectName = "—";
  let activityName = pjActivity;

  if (acti) {
    activityName = `${acti.codeActi} ${acti.nameActi}`;
    const [proj] = await db
      .select({ nameProj: planProjects.nameProj })
      .from(planProjects)
      .where(
        and(
          eq(planProjects.budgetYear, budgetYear),
          eq(planProjects.codeProj, acti.codeProj),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (proj) {
      projectName = proj.nameProj;
    }
  }

  // 2. Fetch withdraw items
  const withdrawRows = await db
    .select({
      id: budgetWithdraw.id,
      recDate: budgetWithdraw.recDate,
      item: budgetWithdraw.item,
      money: budgetWithdraw.money,
    })
    .from(budgetWithdraw)
    .where(
      and(
        eq(budgetWithdraw.budgetYear, budgetYear),
        eq(budgetWithdraw.pjActivity, pjActivity),
      ),
    )
    .orderBy(asc(budgetWithdraw.id))
    .catch(() => []);

  let totalWithdraw = 0;
  const withdrawItems: ActivityWithdrawItem[] = withdrawRows.map((r) => {
    const val = Number(r.money) || 0;
    totalWithdraw += val;
    return {
      id: r.id,
      dateShort: formatShortThaiDate(r.recDate),
      item: r.item,
      money: val,
    };
  });

  // 3. Fetch return items
  const returnRows = await db
    .select({
      id: budgetMoneyReturn.id,
      recDate: budgetMoneyReturn.recDate,
      item: budgetMoneyReturn.item,
      money: budgetMoneyReturn.money,
    })
    .from(budgetMoneyReturn)
    .where(
      and(
        eq(budgetMoneyReturn.budgetYear, budgetYear),
        eq(budgetMoneyReturn.pjActivity, pjActivity),
      ),
    )
    .orderBy(asc(budgetMoneyReturn.id))
    .catch(() => []);

  let totalReturn = 0;
  const returnItems: ActivityReturnItem[] = returnRows.map((r) => {
    const val = Number(r.money) || 0;
    totalReturn += val;
    return {
      id: r.id,
      dateShort: formatShortThaiDate(r.recDate),
      item: r.item,
      money: val,
    };
  });

  return {
    projectName,
    activityName,
    activityCode: pjActivity,
    withdrawItems,
    totalWithdraw,
    returnItems,
    totalReturn,
  };
}

export type WithdrawRecordDetail = {
  id: number;
  budgetYear: number;
  dateRegShort: string;
  document: string;
  borrowStatus: number | null;
  borrowedRecDate: string | null;
  withdrawStatus: number | null;
  withdrawRecDate: string | null;
  item: string;
  codeProj: string;
  nameProj: string;
  codeActi: string;
  nameActi: string;
  money: number;
  moneySource: string;
  payTypeId: number | null;
  payTypeName: string;
  pRequest: string;
  officerFullName: string;
};

export async function getWithdrawRecordDetail(
  id: number,
): Promise<WithdrawRecordDetail | null> {
  const [row] = await db
    .select({
      id: budgetWithdraw.id,
      budgetYear: budgetWithdraw.budgetYear,
      document: budgetWithdraw.document,
      item: budgetWithdraw.item,
      pjActivity: budgetWithdraw.pjActivity,
      money: budgetWithdraw.money,
      payType: budgetWithdraw.payType,
      pRequest: budgetWithdraw.pRequest,
      borrowStatus: budgetWithdraw.borrowStatus,
      withdrawStatus: budgetWithdraw.withdrawStatus,
      officer: budgetWithdraw.officer,
      recDate: budgetWithdraw.recDate,
      borrowedRecDate: budgetWithdraw.borrowedRecDate,
      withdrawRecDate: budgetWithdraw.withdrawRecDate,
    })
    .from(budgetWithdraw)
    .where(eq(budgetWithdraw.id, id))
    .limit(1)
    .catch(() => []);

  if (!row || !row.budgetYear) return null;

  // 1. Fetch activity & project
  const [acti] = await db
    .select({
      codeProj: planActivities.codeProj,
      nameActi: planActivities.nameActi,
      codeApprove: planActivities.codeApprove,
    })
    .from(planActivities)
    .where(
      and(
        eq(planActivities.budgetYear, row.budgetYear),
        eq(planActivities.codeActi, row.pjActivity),
      ),
    )
    .limit(1)
    .catch(() => []);

  let codeProj = "";
  let nameProj = "";
  let nameActi = row.pjActivity;
  let moneySource = "";

  if (acti) {
    codeProj = acti.codeProj;
    nameActi = acti.nameActi;

    const [proj] = await db
      .select({ nameProj: planProjects.nameProj })
      .from(planProjects)
      .where(
        and(
          eq(planProjects.budgetYear, row.budgetYear),
          eq(planProjects.codeProj, acti.codeProj),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (proj) {
      nameProj = proj.nameProj;
    }

    // Money source calculation
    if (
      acti.codeApprove &&
      acti.codeApprove !== "0" &&
      acti.codeApprove !== "No" &&
      acti.codeApprove !== "_"
    ) {
      const parts = acti.codeApprove.split("_");
      if (parts.length >= 2) {
        const type = parts[0];
        const index = parts[1];
        if (type === "1") {
          const [bType] = await db
            .select({ typeName: budgetType.typeName })
            .from(budgetType)
            .where(
              and(
                eq(budgetType.budgetYear, row.budgetYear),
                eq(budgetType.typeId, Number(index)),
              ),
            )
            .limit(1)
            .catch(() => []);
          moneySource = `เงินนอกงบประมาณ ${index} ${bType?.typeName || ""}`;
        } else if (type === "2") {
          const [rec] = await db
            .select({ item: budgetReceives.item })
            .from(budgetReceives)
            .where(
              and(
                eq(budgetReceives.budgetYear, row.budgetYear),
                eq(budgetReceives.num, Number(index)),
              ),
            )
            .limit(1)
            .catch(() => []);
          moneySource = `เงินงบประมาณงวดที่ ${index} ${rec?.item || ""}`;
        }
      }
    }
  }

  // 2. Fetch payType name
  let payTypeName = "";
  if (row.payType) {
    const [pType] = await db
      .select({ payTypeName: budgetPayTypes.payTypeName })
      .from(budgetPayTypes)
      .where(eq(budgetPayTypes.payTypeId, Number(row.payType)))
      .limit(1)
      .catch(() => []);
    if (pType) {
      payTypeName = pType.payTypeName;
    }
  }

  // 3. Fetch officer full name
  let officerFullName = row.officer || "";
  if (row.officer) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, row.officer))
      .limit(1)
      .catch(() => []);
    if (p) {
      officerFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  // Format reg date short Thai
  let dateRegShort = "—";
  if (row.recDate) {
    const [y, m, d] = row.recDate.split("-");
    const monthNames: Record<string, string> = {
      "01": "มค",
      "02": "กพ",
      "03": "มีค",
      "04": "เมย",
      "05": "พค",
      "06": "มิย",
      "07": "กค",
      "08": "สค",
      "09": "กย",
      "10": "ตค",
      "11": "พย",
      "12": "ธค",
    };
    if (y && m && d) {
      const yearBE = parseInt(y, 10) + 543;
      dateRegShort = `${parseInt(d, 10)}${monthNames[m] || m}${yearBE}`;
    }
  }

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    dateRegShort,
    document: row.document,
    borrowStatus: row.borrowStatus,
    borrowedRecDate: row.borrowedRecDate,
    withdrawStatus: row.withdrawStatus,
    withdrawRecDate: row.withdrawRecDate,
    item: row.item,
    codeProj,
    nameProj,
    codeActi: row.pjActivity,
    nameActi,
    money: Number(row.money) || 0,
    moneySource,
    payTypeId: row.payType ? Number(row.payType) : null,
    payTypeName,
    pRequest: row.pRequest,
    officerFullName,
  };
}

export type ReturnRecordDetail = {
  id: number;
  budgetYear: number;
  dateRegShort: string;
  document: string;
  item: string;
  codeProj: string;
  nameProj: string;
  codeActi: string;
  nameActi: string;
  money: number;
  payTypeId: number | null;
  payTypeName: string;
  pRequest: string;
  officerFullName: string;
};

export async function getReturnRecordDetail(
  id: number,
): Promise<ReturnRecordDetail | null> {
  const [row] = await db
    .select({
      id: budgetMoneyReturn.id,
      budgetYear: budgetMoneyReturn.budgetYear,
      document: budgetMoneyReturn.document,
      item: budgetMoneyReturn.item,
      pjActivity: budgetMoneyReturn.pjActivity,
      money: budgetMoneyReturn.money,
      payType: budgetMoneyReturn.payType,
      pRequest: budgetMoneyReturn.pRequest,
      officer: budgetMoneyReturn.officer,
      recDate: budgetMoneyReturn.recDate,
    })
    .from(budgetMoneyReturn)
    .where(eq(budgetMoneyReturn.id, id))
    .limit(1)
    .catch(() => []);

  if (!row || !row.budgetYear) return null;

  // 1. Fetch activity & project
  const [acti] = await db
    .select({
      codeProj: planActivities.codeProj,
      nameActi: planActivities.nameActi,
    })
    .from(planActivities)
    .where(
      and(
        eq(planActivities.budgetYear, row.budgetYear),
        eq(planActivities.codeActi, row.pjActivity),
      ),
    )
    .limit(1)
    .catch(() => []);

  let codeProj = "";
  let nameProj = "";
  let nameActi = row.pjActivity;

  if (acti) {
    codeProj = acti.codeProj;
    nameActi = acti.nameActi;

    const [proj] = await db
      .select({ nameProj: planProjects.nameProj })
      .from(planProjects)
      .where(
        and(
          eq(planProjects.budgetYear, row.budgetYear),
          eq(planProjects.codeProj, acti.codeProj),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (proj) {
      nameProj = proj.nameProj;
    }
  }

  // 2. Fetch payType name
  let payTypeName = "";
  if (row.payType) {
    const [pType] = await db
      .select({ payTypeName: budgetPayTypes.payTypeName })
      .from(budgetPayTypes)
      .where(eq(budgetPayTypes.payTypeId, Number(row.payType)))
      .limit(1)
      .catch(() => []);
    if (pType) {
      payTypeName = pType.payTypeName;
    }
  }

  // 3. Fetch officer full name
  let officerFullName = row.officer || "";
  if (row.officer) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, row.officer))
      .limit(1)
      .catch(() => []);
    if (p) {
      officerFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  // Format reg date short Thai
  let dateRegShort = "—";
  if (row.recDate) {
    const [y, m, d] = row.recDate.split("-");
    const monthNames: Record<string, string> = {
      "01": "มค",
      "02": "กพ",
      "03": "มีค",
      "04": "เมย",
      "05": "พค",
      "06": "มิย",
      "07": "กค",
      "08": "สค",
      "09": "กย",
      "10": "ตค",
      "11": "พย",
      "12": "ธค",
    };
    if (y && m && d) {
      const yearBE = parseInt(y, 10) + 543;
      dateRegShort = `${parseInt(d, 10)}${monthNames[m] || m}${yearBE}`;
    }
  }

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    dateRegShort,
    document: row.document,
    item: row.item,
    codeProj,
    nameProj,
    codeActi: row.pjActivity,
    nameActi,
    money: Number(row.money) || 0,
    payTypeId: row.payType ? Number(row.payType) : null,
    payTypeName,
    pRequest: row.pRequest,
    officerFullName,
  };
}

export type InstallmentRegisterRow = {
  id: number;
  num: number;
  dateShort: string;
  item: string;
  money: number;
  cumTotal: number;
};

export type InstallmentRegisterResult = {
  rows: InstallmentRegisterRow[];
  total: number;
  totalSum: number;
  calSum?: number;
};

export async function reportInstallmentRegisterList({
  budgetYear,
  page = 1,
  pageSize = 20,
  calId,
}: {
  budgetYear: number;
  page?: number;
  pageSize?: number;
  calId?: number;
}): Promise<InstallmentRegisterResult> {
  const allRows = await db
    .select({
      id: budgetReceives.id,
      num: budgetReceives.num,
      item: budgetReceives.item,
      money: budgetReceives.money,
      recDate: budgetReceives.recDate,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(asc(budgetReceives.num))
    .catch(() => []);

  let totalSum = 0;
  let runningTotal = 0;
  let calSum: number | undefined = undefined;

  const formattedAll: InstallmentRegisterRow[] = allRows.map((r) => {
    const val = Number(r.money) || 0;
    runningTotal += val;
    totalSum += val;

    if (calId && r.id === calId) {
      calSum = runningTotal;
    }

    return {
      id: r.id,
      num: r.num,
      dateShort: formatShortThaiDate(r.recDate),
      item: r.item,
      money: val,
      cumTotal: runningTotal,
    };
  });

  const total = formattedAll.length;
  const start = (page - 1) * pageSize;
  const rows = formattedAll.slice(start, start + pageSize);

  return {
    rows,
    total,
    totalSum,
    calSum,
  };
}

export type InstallmentReceiveDetail = {
  id: number;
  budgetYear: number;
  num: number;
  bookNumber: string;
  outDate: string;
  bookRef: string;
  planName: string;
  projectName: string;
  activityName: string;
  activity2: string;
  moneySourceName: string;
  account: string;
  payTypeName: string;
  item: string;
  detail: string;
  money: number;
  recDate: string;
  file: string | null;
};

export async function getInstallmentReceiveDetail(
  id: number,
): Promise<InstallmentReceiveDetail | null> {
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
      recDate: budgetReceives.recDate,
      file: budgetReceives.file,
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.id, id))
    .limit(1)
    .catch(() => []);

  if (!row || !row.budgetYear) return null;

  // 1. Plan name
  let planName = row.plan || "";
  if (row.plan) {
    const [p] = await db
      .select({ name: budgetPlans.name })
      .from(budgetPlans)
      .where(
        and(
          eq(budgetPlans.budgetYear, row.budgetYear),
          eq(budgetPlans.code, row.plan),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (p) {
      planName = `${row.plan} ${p.name}`;
    }
  }

  // 2. Project name
  let projectName = row.project || "";
  if (row.project) {
    const [proj] = await db
      .select({ name: budgetProject.name })
      .from(budgetProject)
      .where(
        and(
          eq(budgetProject.budgetYear, row.budgetYear),
          eq(budgetProject.code, row.project),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (proj) {
      projectName = `${row.project} ${proj.name}`;
    }
  }

  // 3. Key Activity name
  let activityName = row.activity || "";
  if (row.activity) {
    const [acti] = await db
      .select({ name: budgetKeyActivity.name })
      .from(budgetKeyActivity)
      .where(
        and(
          eq(budgetKeyActivity.budgetYear, row.budgetYear),
          eq(budgetKeyActivity.code, row.activity),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (acti) {
      activityName = `${row.activity} ${acti.name}`;
    }
  }

  // 4. Money Source name
  let moneySourceName = row.mSource || "";
  if (row.mSource) {
    const [ms] = await db
      .select({ name: budgetMoneySources.name })
      .from(budgetMoneySources)
      .where(
        and(
          eq(budgetMoneySources.budgetYear, row.budgetYear),
          eq(budgetMoneySources.code, row.mSource),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (ms) {
      moneySourceName = `${row.mSource} ${ms.name}`;
    }
  }

  // 5. Pay Type name
  let payTypeName = "";
  if (row.mPay) {
    const [pt] = await db
      .select({
        payTypeId: budgetPayTypes.payTypeId,
        payTypeName: budgetPayTypes.payTypeName,
      })
      .from(budgetPayTypes)
      .where(eq(budgetPayTypes.payTypeId, Number(row.mPay)))
      .limit(1)
      .catch(() => []);
    if (pt) {
      payTypeName = `${pt.payTypeId} ${pt.payTypeName}`;
    }
  }

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    num: row.num,
    bookNumber: row.bookNumber || "",
    outDate: row.outDate || "",
    bookRef: row.bookRef || "",
    planName,
    projectName,
    activityName,
    activity2: row.activity2 || "",
    moneySourceName,
    account: row.account || "",
    payTypeName,
    item: row.item || "",
    detail: row.detail || "",
    money: Number(row.money) || 0,
    recDate: row.recDate || "",
    file: row.file || null,
  };
}

export type BudgetCodePayTypeGroup = {
  payGroup: string;
  payTypeName: string;
  spent: number;
};

export type BudgetCodeSpendingItem = {
  code: string;
  receiveMoney: number;
  totalSpent: number;
  totalReturn: number;
  remaining: number;
  percentSpent: number;
  payTypeGroups: BudgetCodePayTypeGroup[];
};

export type PayTypeSummaryRow = {
  id: number;
  payGroup: string;
  payTypeName: string;
  spent: number;
  returnMoney: number;
};

export type BudgetCodeReportResult = {
  items: BudgetCodeSpendingItem[];
  totalReceive: number;
  totalSpent: number;
  totalReturn: number;
  payTypeSummaries: PayTypeSummaryRow[];
};

export async function reportSpendingByBudgetCodeList(
  budgetYear: number,
): Promise<BudgetCodeReportResult> {
  // 1. Pay types map
  const payTypeRows = await db
    .select({
      payTypeId: budgetPayTypes.payTypeId,
      payTypeName: budgetPayTypes.payTypeName,
    })
    .from(budgetPayTypes)
    .orderBy(budgetPayTypes.payTypeId)
    .catch(() => []);

  const payTypeMap = new Map<string, string>();
  for (const pt of payTypeRows) {
    payTypeMap.set(String(pt.payTypeId), pt.payTypeName);
  }

  // 2. Fetch deega rows
  const deegaRows = await db
    .select({
      project: budgetDeega.project,
      payGroup: budgetDeega.payGroup,
      withdraw: sum(budgetDeega.withdraw),
    })
    .from(budgetDeega)
    .where(eq(budgetDeega.budgetYear, budgetYear))
    .groupBy(budgetDeega.project, budgetDeega.payGroup)
    .catch(() => []);

  const projSpentMap = new Map<string, number>();
  const projPayGroupMap = new Map<string, Map<string, number>>();
  const payGroupSpentMap = new Map<string, number>();
  const projectSet = new Set<string>();
  const payGroupSet = new Set<string>();

  for (const d of deegaRows) {
    if (!d.project) continue;
    const proj = String(d.project);
    const pg = String(d.payGroup || "");
    const val = Number(d.withdraw) || 0;

    projectSet.add(proj);
    if (pg) payGroupSet.add(pg);

    projSpentMap.set(proj, (projSpentMap.get(proj) || 0) + val);
    if (pg) {
      payGroupSpentMap.set(pg, (payGroupSpentMap.get(pg) || 0) + val);
      let innerMap = projPayGroupMap.get(proj);
      if (!innerMap) {
        innerMap = new Map<string, number>();
        projPayGroupMap.set(proj, innerMap);
      }
      innerMap.set(pg, (innerMap.get(pg) || 0) + val);
    }
  }

  // 3. Fetch return deega rows
  const returnRows = await db
    .select({
      project: budgetReturnDeega.project,
      payGroup: budgetReturnDeega.payGroup,
      money: sum(budgetReturnDeega.money),
    })
    .from(budgetReturnDeega)
    .where(eq(budgetReturnDeega.budgetYear, budgetYear))
    .groupBy(budgetReturnDeega.project, budgetReturnDeega.payGroup)
    .catch(() => []);

  const projReturnMap = new Map<string, number>();
  const payGroupReturnMap = new Map<string, number>();

  for (const r of returnRows) {
    if (!r.project) continue;
    const proj = String(r.project);
    const pg = String(r.payGroup || "");
    const val = Number(r.money) || 0;

    projReturnMap.set(proj, (projReturnMap.get(proj) || 0) + val);
    if (pg) {
      payGroupReturnMap.set(pg, (payGroupReturnMap.get(pg) || 0) + val);
    }
  }

  // 4. Fetch receive rows
  const receiveRows = await db
    .select({
      project: budgetReceives.project,
      money: sum(budgetReceives.money),
    })
    .from(budgetReceives)
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .groupBy(budgetReceives.project)
    .catch(() => []);

  const projReceiveMap = new Map<string, number>();
  for (const r of receiveRows) {
    if (!r.project) continue;
    const proj = String(r.project);
    const val = Number(r.money) || 0;
    projectSet.add(proj);
    projReceiveMap.set(proj, (projReceiveMap.get(proj) || 0) + val);
  }

  // 5. Sorted project codes
  const projects = Array.from(projectSet).sort();
  const sortedPayGroups = Array.from(payGroupSet).sort(
    (a, b) => Number(a) - Number(b),
  );

  let totalReceive = 0;
  let totalSpent = 0;
  let totalReturn = 0;

  const items: BudgetCodeSpendingItem[] = projects.map((projCode) => {
    const recMoney = projReceiveMap.get(projCode) || 0;
    const spentMoney = projSpentMap.get(projCode) || 0;
    const retMoney = projReturnMap.get(projCode) || 0;
    const remaining = recMoney - spentMoney + retMoney;
    const percent = recMoney > 0 ? (spentMoney / recMoney) * 100 : 0;

    totalReceive += recMoney;
    totalSpent += spentMoney;
    totalReturn += retMoney;

    const innerMap = projPayGroupMap.get(projCode);
    const payTypeGroups: BudgetCodePayTypeGroup[] = [];

    if (innerMap) {
      for (const pg of sortedPayGroups) {
        const spent = innerMap.get(pg) || 0;
        if (spent > 0) {
          payTypeGroups.push({
            payGroup: pg,
            payTypeName: payTypeMap.get(pg) || "",
            spent,
          });
        }
      }
    }

    return {
      code: projCode,
      receiveMoney: recMoney,
      totalSpent: spentMoney,
      totalReturn: retMoney,
      remaining,
      percentSpent: percent,
      payTypeGroups,
    };
  });

  // 6. Pay Type summary table
  const payTypeSummaries: PayTypeSummaryRow[] = sortedPayGroups.map(
    (pg, idx) => ({
      id: idx + 1,
      payGroup: pg,
      payTypeName: payTypeMap.get(pg) || "",
      spent: payGroupSpentMap.get(pg) || 0,
      returnMoney: payGroupReturnMap.get(pg) || 0,
    }),
  );

  return {
    items,
    totalReceive,
    totalSpent,
    totalReturn,
    payTypeSummaries,
  };
}

export type BudgetCodeDeegaRow = {
  id: number;
  dateShort: string;
  deegaNum: string;
  doc: string;
  item: string;
  withdraw: number;
  tax: number;
  pay: number;
};

export type BudgetCodeDeegaDetailResult = {
  projectCode: string;
  payGroup?: string;
  payTypeName?: string;
  rows: BudgetCodeDeegaRow[];
  total: number;
  totalWithdraw: number;
  totalTax: number;
  totalPay: number;
};

export async function reportBudgetCodeDeegaDetail({
  budgetYear,
  project,
  payGroup,
  page = 1,
  pageSize = 20,
}: {
  budgetYear: number;
  project: string;
  payGroup?: string;
  page?: number;
  pageSize?: number;
}): Promise<BudgetCodeDeegaDetailResult> {
  const conditions = [
    eq(budgetDeega.budgetYear, budgetYear),
    eq(budgetDeega.project, project),
  ];

  if (payGroup) {
    conditions.push(eq(budgetDeega.payGroup, Number(payGroup)));
  }

  const allRows = await db
    .select({
      id: budgetDeega.id,
      recDate: budgetDeega.recDate,
      deegaNum: budgetDeega.deegaNum,
      doc: budgetDeega.doc,
      item: budgetDeega.item,
      withdraw: budgetDeega.withdraw,
      tax: budgetDeega.tax,
      pay: budgetDeega.pay,
    })
    .from(budgetDeega)
    .where(and(...conditions))
    .orderBy(asc(budgetDeega.deegaNum), asc(budgetDeega.id))
    .catch(() => []);

  let totalWithdraw = 0;
  let totalTax = 0;
  let totalPay = 0;

  const formattedAll: BudgetCodeDeegaRow[] = allRows.map((r) => {
    const w = Number(r.withdraw) || 0;
    const t = Number(r.tax) || 0;
    const p = Number(r.pay) || (w - t);

    totalWithdraw += w;
    totalTax += t;
    totalPay += p;

    return {
      id: r.id,
      dateShort: formatShortThaiDate(r.recDate),
      deegaNum: String(r.deegaNum ?? "—"),
      doc: String(r.doc ?? "—"),
      item: String(r.item ?? "—"),
      withdraw: w,
      tax: t,
      pay: p,
    };
  });

  const total = formattedAll.length;
  const start = (page - 1) * pageSize;
  const rows = formattedAll.slice(start, start + pageSize);

  let payTypeName: string | undefined = undefined;
  if (payGroup) {
    const [pt] = await db
      .select({ payTypeName: budgetPayTypes.payTypeName })
      .from(budgetPayTypes)
      .where(eq(budgetPayTypes.payTypeId, Number(payGroup)))
      .limit(1)
      .catch(() => []);
    if (pt) payTypeName = pt.payTypeName;
  }

  return {
    projectCode: project,
    payGroup,
    payTypeName,
    rows,
    total,
    totalWithdraw,
    totalTax,
    totalPay,
  };
}

export type DeegaRecordDetail = {
  id: number;
  budgetYear: number;
  dateRegShort: string;
  deegaNum: string;
  doc: string;
  receiveNumLabel: string;
  planName: string;
  projectName: string;
  activityName: string;
  payTypeName: string;
  item: string;
  withdraw: number;
  tax: number;
  pay: number;
  officerFullName: string;
};

export async function getDeegaRecordDetail(
  id: number,
): Promise<DeegaRecordDetail | null> {
  const [row] = await db
    .select({
      id: budgetDeega.id,
      budgetYear: budgetDeega.budgetYear,
      deegaNum: budgetDeega.deegaNum,
      doc: budgetDeega.doc,
      receiveNum: budgetDeega.receiveNum,
      plan: budgetDeega.plan,
      project: budgetDeega.project,
      activity: budgetDeega.activity,
      payGroup: budgetDeega.payGroup,
      item: budgetDeega.item,
      withdraw: budgetDeega.withdraw,
      tax: budgetDeega.tax,
      pay: budgetDeega.pay,
      officer: budgetDeega.officer,
      recDate: budgetDeega.recDate,
    })
    .from(budgetDeega)
    .where(eq(budgetDeega.id, id))
    .limit(1)
    .catch(() => []);

  if (!row || !row.budgetYear) return null;

  // 1. Receive num label
  let receiveNumLabel = row.receiveNum ? String(row.receiveNum) : "—";
  if (row.receiveNum) {
    if (row.receiveNum === "oth") receiveNumLabel = "อื่นๆ";
    else if (row.receiveNum === "sly") receiveNumLabel = "เงินเดือน";
    else if (row.receiveNum === "ctr")
      receiveNumLabel = "งบกลางค่ารักษาพยาบาล";
    else if (row.receiveNum === "etr")
      receiveNumLabel = "งบกลางค่าการศึกษาบุตร";
    else {
      const [rec] = await db
        .select({ item: budgetReceives.item })
        .from(budgetReceives)
        .where(
          and(
            eq(budgetReceives.budgetYear, row.budgetYear),
            eq(budgetReceives.num, Number(row.receiveNum)),
          ),
        )
        .limit(1)
        .catch(() => []);
      if (rec && rec.item) {
        receiveNumLabel = `${row.receiveNum} ${rec.item}`;
      }
    }
  }

  // 2. Plan name
  let planName = row.plan ? String(row.plan) : "";
  if (row.plan) {
    const [p] = await db
      .select({ name: budgetPlans.name })
      .from(budgetPlans)
      .where(
        and(
          eq(budgetPlans.budgetYear, row.budgetYear),
          eq(budgetPlans.code, String(row.plan)),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (p) {
      planName = `${row.plan} ${p.name}`;
    }
  }

  // 3. Project name
  let projectName = row.project ? String(row.project) : "";
  if (row.project) {
    const [proj] = await db
      .select({ name: budgetProject.name })
      .from(budgetProject)
      .where(
        and(
          eq(budgetProject.budgetYear, row.budgetYear),
          eq(budgetProject.code, String(row.project)),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (proj) {
      projectName = `${row.project} ${proj.name}`;
    }
  }

  // 4. Activity name
  let activityName = row.activity ? String(row.activity) : "";
  if (row.activity) {
    const [acti] = await db
      .select({ name: budgetKeyActivity.name })
      .from(budgetKeyActivity)
      .where(
        and(
          eq(budgetKeyActivity.budgetYear, row.budgetYear),
          eq(budgetKeyActivity.code, String(row.activity)),
        ),
      )
      .limit(1)
      .catch(() => []);
    if (acti) {
      activityName = `${row.activity} ${acti.name}`;
    }
  }

  // 5. Pay type name
  let payTypeName = row.payGroup ? String(row.payGroup) : "";
  if (row.payGroup) {
    const [pt] = await db
      .select({ payTypeName: budgetPayTypes.payTypeName })
      .from(budgetPayTypes)
      .where(eq(budgetPayTypes.payTypeId, Number(row.payGroup)))
      .limit(1)
      .catch(() => []);
    if (pt) {
      payTypeName = `${row.payGroup} ${pt.payTypeName}`;
    }
  }

  // 6. Officer name
  let officerFullName = row.officer ? String(row.officer) : "";
  if (row.officer) {
    const [p] = await db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, String(row.officer)))
      .limit(1)
      .catch(() => []);
    if (p) {
      officerFullName = [p.prefix, p.firstName, p.lastName]
        .filter(Boolean)
        .join(" ");
    }
  }

  const w = Number(row.withdraw) || 0;
  const t = Number(row.tax) || 0;
  const p = Number(row.pay) || (w - t);

  return {
    id: row.id,
    budgetYear: row.budgetYear,
    dateRegShort: formatShortThaiDate(row.recDate),
    deegaNum: String(row.deegaNum ?? "—"),
    doc: String(row.doc ?? "—"),
    receiveNumLabel,
    planName,
    projectName,
    activityName,
    payTypeName,
    item: String(row.item ?? "—"),
    withdraw: w,
    tax: t,
    pay: p,
    officerFullName,
  };
}

export type SpendingByPayTypeItem = {
  id: number;
  payTypeId: number;
  payTypeName: string;
  money: number;
  percent: number;
};

export type SpendingByPayTypeReportResult = {
  items: SpendingByPayTypeItem[];
  totalMoney: number;
  totalPercent: number;
  todayFormatted: string;
};

export async function reportSpendingByPayTypeList(
  budgetYear: number,
): Promise<SpendingByPayTypeReportResult> {
  // 1. Fetch all budgetPayTypes
  const payTypeRows = await db
    .select({
      id: budgetPayTypes.id,
      payTypeId: budgetPayTypes.payTypeId,
      payTypeName: budgetPayTypes.payTypeName,
    })
    .from(budgetPayTypes)
    .orderBy(asc(budgetPayTypes.payTypeId))
    .catch(() => []);

  // 2. Fetch sum(payAmount) from budgetMain by payGroup
  const mainRows = await db
    .select({
      payGroup: budgetMain.payGroup,
      totalPay: sum(budgetMain.payAmount),
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        gt(budgetMain.payGroup, 100),
        isNotNull(budgetMain.status),
      ),
    )
    .groupBy(budgetMain.payGroup)
    .catch(() => []);

  const payMap = new Map<number, number>();
  let totalMoney = 0;
  for (const r of mainRows) {
    if (r.payGroup != null) {
      const val = Number(r.totalPay) || 0;
      payMap.set(Number(r.payGroup), val);
      totalMoney += val;
    }
  }

  let totalPercent = 0;
  const items: SpendingByPayTypeItem[] = payTypeRows.map((pt, idx) => {
    const money = payMap.get(pt.payTypeId) || 0;
    const percent = totalMoney > 0 ? (money / totalMoney) * 100 : 0;
    totalPercent += percent;

    return {
      id: idx + 1,
      payTypeId: pt.payTypeId,
      payTypeName: pt.payTypeName,
      money,
      percent,
    };
  });

  const monthNames = [
    "",
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthStr = monthNames[now.getMonth() + 1] || "";
  const yearStr = String(now.getFullYear() + 543);
  const todayFormatted = `วันที่ ${dayStr} เดือน${monthStr} พ.ศ.${yearStr}`;

  return {
    items,
    totalMoney,
    totalPercent,
    todayFormatted,
  };
}

export type DailyBalanceRow = {
  typeName: string;
  cash: number;
  bank: number;
  office: number;
  total: number;
};

export type DailyBalanceSection = {
  categoryTitle: string;
  rows: DailyBalanceRow[];
};

export type DailyBalanceReportResult = {
  sections: DailyBalanceSection[];
  totalCash: number;
  totalBank: number;
  totalOffice: number;
  grandTotal: number;
  selectedDateStr: string;
  selectedDate: number;
  selectedMonth: number;
  selectedYear: number;
};

export async function reportDailyBalanceList({
  budgetYear,
  selectDate,
  selectMonth,
  selectYear,
}: {
  budgetYear: number;
  selectDate?: number;
  selectMonth?: number;
  selectYear?: number;
}): Promise<DailyBalanceReportResult> {
  const now = new Date();
  const todayDay = selectDate ?? now.getDate();
  const todayMonth = selectMonth ?? (now.getMonth() + 1);
  const todayYear = selectYear ?? (now.getFullYear() + 543);

  const cutoffY = todayYear - 543;
  const cutoffM = String(todayMonth).padStart(2, "0");
  const cutoffD = String(todayDay).padStart(2, "0");
  const cutoffStr = `${cutoffY}-${cutoffM}-${cutoffD}`;

  const mainRows = await db
    .select({
      id: budgetMain.id,
      typeId: budgetMain.typeId,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
      changeAmount: budgetMain.changeAmount,
      status: budgetMain.status,
      recDate: budgetMain.recDate,
    })
    .from(budgetMain)
    .where(
      and(
        eq(budgetMain.budgetYear, budgetYear),
        isNotNull(budgetMain.status),
        lte(budgetMain.recDate, cutoffStr),
      ),
    )
    .orderBy(asc(budgetMain.recDate), asc(budgetMain.id))
    .catch(() => []);

  const cashMap = new Map<number, number>();
  const bankMap = new Map<number, number>();
  const officeMap = new Map<number, number>();

  for (const r of mainRows) {
    if (r.typeId == null) continue;
    const tid = Number(r.typeId);
    const rec = Number(r.receiveAmount) || 0;
    const pay = Number(r.payAmount) || 0;
    const chg = Number(r.changeAmount) || 0;
    const st = Number(r.status);

    let c = cashMap.get(tid) || 0;
    let b = bankMap.get(tid) || 0;
    let o = officeMap.get(tid) || 0;

    if (st === 1) {
      c += rec;
    } else if (st === 2) {
      b += rec;
    } else if (st === 3) {
      c -= pay;
    } else if (st === 4) {
      b -= pay;
    } else if (st === 5) {
      c -= chg;
      b += chg;
    } else if (st === 6) {
      c -= chg;
      o += chg;
    } else if (st === 7) {
      b -= chg;
      c += chg;
    } else if (st === 8) {
      b -= chg;
      o += chg;
    } else if (st === 9) {
      o -= chg;
      c += chg;
    } else if (st === 10) {
      o -= chg;
      b += chg;
    }

    cashMap.set(tid, c);
    bankMap.set(tid, b);
    officeMap.set(tid, o);
  }

  // Section 1: เงินงบประมาณ (typeId = 200)
  const c200 = cashMap.get(200) || 0;
  const b200 = bankMap.get(200) || 0;
  const o200 = officeMap.get(200) || 0;
  const s200 = c200 + b200 + o200;

  const budgetSection: DailyBalanceSection = {
    categoryTitle: "เงินงบประมาณ",
    rows: [
      {
        typeName: "เงินงบประมาณ",
        cash: c200,
        bank: b200,
        office: o200,
        total: s200,
      },
    ],
  };

  // Section 2: เงินนอกงบประมาณ (category_id = 1)
  const nonBudgetTypes = await db
    .select({
      typeId: budgetType.typeId,
      typeName: budgetType.typeName,
    })
    .from(budgetType)
    .where(
      and(
        eq(budgetType.budgetYear, budgetYear),
        eq(budgetType.categoryId, 1),
      ),
    )
    .orderBy(asc(budgetType.typeId))
    .catch(() => []);

  const nonBudgetRows: DailyBalanceRow[] = nonBudgetTypes.map((bt) => {
    const tid = Number(bt.typeId);
    const c = cashMap.get(tid) || 0;
    const b = bankMap.get(tid) || 0;
    const o = officeMap.get(tid) || 0;
    return {
      typeName: bt.typeName,
      cash: c,
      bank: b,
      office: o,
      total: c + b + o,
    };
  });

  const nonBudgetSection: DailyBalanceSection = {
    categoryTitle: "เงินนอกงบประมาณ",
    rows: nonBudgetRows,
  };

  // Section 3: เงินรายได้แผ่นดิน (category_id = 3)
  const incomeTypes = await db
    .select({
      typeId: budgetType.typeId,
      typeName: budgetType.typeName,
    })
    .from(budgetType)
    .where(
      and(
        eq(budgetType.budgetYear, budgetYear),
        eq(budgetType.categoryId, 3),
      ),
    )
    .orderBy(asc(budgetType.typeId))
    .catch(() => []);

  const incomeRows: DailyBalanceRow[] = incomeTypes.map((bt) => {
    const tid = Number(bt.typeId);
    const c = cashMap.get(tid) || 0;
    const b = bankMap.get(tid) || 0;
    const o = officeMap.get(tid) || 0;
    return {
      typeName: bt.typeName,
      cash: c,
      bank: b,
      office: o,
      total: c + b + o,
    };
  });

  const incomeSection: DailyBalanceSection = {
    categoryTitle: "เงินรายได้แผ่นดิน",
    rows: incomeRows,
  };

  let totalCash = c200;
  let totalBank = b200;
  let totalOffice = o200;

  for (const r of nonBudgetRows) {
    totalCash += r.cash;
    totalBank += r.bank;
    totalOffice += r.office;
  }
  for (const r of incomeRows) {
    totalCash += r.cash;
    totalBank += r.bank;
    totalOffice += r.office;
  }

  const grandTotal = totalCash + totalBank + totalOffice;

  return {
    sections: [budgetSection, nonBudgetSection, incomeSection],
    totalCash,
    totalBank,
    totalOffice,
    grandTotal,
    selectedDateStr: `${todayDay}/${todayMonth}/${todayYear}`,
    selectedDate: todayDay,
    selectedMonth: todayMonth,
    selectedYear: todayYear,
  };
}

export type CashBookRow = {
  id: number;
  rowNum: number;
  dateShort: string;
  doc: string;
  item: string;
  statusLabel: string;
  changeAmount: number;
  receiveAmount: number;
  payAmount: number;
  cashBalance: number;
  bankBalance: number;
  officeBalance: number;
  totalBalance: number;
};

export type CashBookReportResult = {
  rows: CashBookRow[];
  totalRows: number;
  totalReceive: number;
  totalPay: number;
  finalCash: number;
  finalBank: number;
  finalOffice: number;
  finalTotal: number;
};

export async function reportCashBookList({
  budgetYear,
  typeIndex,
  page = 1,
  pageSize = 20,
}: {
  budgetYear: number;
  typeIndex?: string;
  page?: number;
  pageSize?: number;
}): Promise<CashBookReportResult> {
  const conditions = [
    eq(budgetMain.budgetYear, budgetYear),
    isNotNull(budgetMain.status),
  ];

  if (typeIndex === "1") {
    conditions.push(lt(budgetMain.typeId, 200));
  } else if (typeIndex === "2") {
    conditions.push(eq(budgetMain.typeId, 200));
  } else if (typeIndex === "3") {
    conditions.push(gte(budgetMain.typeId, 300));
  }

  const allRows = await db
    .select({
      id: budgetMain.id,
      doc: budgetMain.doc,
      item: budgetMain.item,
      receiveAmount: budgetMain.receiveAmount,
      payAmount: budgetMain.payAmount,
      changeAmount: budgetMain.changeAmount,
      status: budgetMain.status,
      recDate: budgetMain.recDate,
    })
    .from(budgetMain)
    .where(and(...conditions))
    .orderBy(asc(budgetMain.recDate), asc(budgetMain.id))
    .catch(() => []);

  const statusLabels: Record<number, string> = {
    1: "รับเงินสด",
    2: "รับเช็ค/เงินฝากธนาคาร",
    3: "จ่ายเงินสด",
    4: "จ่ายเช็ค/เงินฝากธนาคาร",
    5: "นำเงินสดฝากธนาคาร",
    6: "นำเงินสดฝากส่วนราชการผู้เบิก",
    7: "ถอนเงินฝากธนาคารเป็นเงินสด",
    8: "ถอนเงินฝากธนาคารไปฝากส่วนราชการผู้เบิก",
    9: "รับคืนเงินฝากส่วนราชการผู้เบิกมาเป็นเงินสด",
    10: "รับคืนเงินฝากส่วนราชการมาเป็นเงินฝากธนาคาร",
  };

  let cashTank = 0;
  let bankTank = 0;
  let officeTank = 0;
  let totalReceive = 0;
  let totalPay = 0;

  const calculatedRows: CashBookRow[] = allRows.map((r, idx) => {
    const rec = Number(r.receiveAmount) || 0;
    const pay = Number(r.payAmount) || 0;
    const chg = Number(r.changeAmount) || 0;
    const st = Number(r.status);

    if (st === 1) {
      cashTank += rec;
      totalReceive += rec;
    } else if (st === 2) {
      bankTank += rec;
      totalReceive += rec;
    } else if (st === 3) {
      cashTank -= pay;
      totalPay += pay;
    } else if (st === 4) {
      bankTank -= pay;
      totalPay += pay;
    } else if (st === 5) {
      cashTank -= chg;
      bankTank += chg;
    } else if (st === 6) {
      cashTank -= chg;
      officeTank += chg;
    } else if (st === 7) {
      bankTank -= chg;
      cashTank += chg;
    } else if (st === 8) {
      bankTank -= chg;
      officeTank += chg;
    } else if (st === 9) {
      officeTank -= chg;
      cashTank += chg;
    } else if (st === 10) {
      officeTank -= chg;
      bankTank += chg;
    }

    const totalBalance = cashTank + bankTank + officeTank;

    return {
      id: r.id,
      rowNum: idx + 1,
      dateShort: formatShortThaiDate(r.recDate),
      doc: String(r.doc ?? "—"),
      item: String(r.item ?? "—"),
      statusLabel: statusLabels[st] || "—",
      changeAmount: chg,
      receiveAmount: rec,
      payAmount: pay,
      cashBalance: cashTank,
      bankBalance: bankTank,
      officeBalance: officeTank,
      totalBalance,
    };
  });

  const totalRows = calculatedRows.length;
  const start = (page - 1) * pageSize;
  const rows = calculatedRows.slice(start, start + pageSize);

  return {
    rows,
    totalRows,
    totalReceive,
    totalPay,
    finalCash: cashTank,
    finalBank: bankTank,
    finalOffice: officeTank,
    finalTotal: cashTank + bankTank + officeTank,
  };
}

export type InstallmentAllocationRow = {
  id: number;
  num: number;
  item: string;
  receiveMoney: number;
  allocatedMoney: number;
  remainingMoney: number;
  isComplete: boolean;
};

export type CategoryAllocationRow = {
  id: number;
  categoryName: string;
  receivedMoney: number;
  allocatedMoney: number;
  remainingMoney: number;
};

export type Check2AllocationResult = {
  installments: InstallmentAllocationRow[];
  totalReceive: number;
  totalAllocated: number;
  totalRemaining: number;
  categories: CategoryAllocationRow[];
  totalCategoryReceive: number;
  totalCategoryAllocated: number;
  totalCategoryRemaining: number;
};

export async function reportCheckAllocationCheck2(
  budgetYear: number,
): Promise<Check2AllocationResult> {
  // 1. Fetch receives with pay types
  const receives = await db
    .select({
      id: budgetReceives.id,
      num: budgetReceives.num,
      item: budgetReceives.item,
      money: budgetReceives.money,
      mPay: budgetReceives.mPay,
      payGroupId: budgetPayTypes.payGroupId,
    })
    .from(budgetReceives)
    .leftJoin(
      budgetPayTypes,
      eq(budgetReceives.mPay, budgetPayTypes.payTypeId),
    )
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(asc(budgetReceives.num))
    .catch(() => []);

  // 2. Fetch plan_acti sums grouped by codeApprove
  const actiSums = await db
    .select({
      codeApprove: planActivities.codeApprove,
      sumBudget: sum(planActivities.budgetActi),
    })
    .from(planActivities)
    .where(eq(planActivities.budgetYear, budgetYear))
    .groupBy(planActivities.codeApprove)
    .catch(() => []);

  const actiMap = new Map<string, number>();
  for (const a of actiSums) {
    if (a.codeApprove) {
      actiMap.set(a.codeApprove, Number(a.sumBudget) || 0);
    }
  }

  const categoryReceived = [0, 0, 0, 0, 0, 0, 0, 0];
  const categoryAllocated = [0, 0, 0, 0, 0, 0, 0, 0];

  let totalReceive = 0;
  let totalAllocated = 0;
  let totalRemaining = 0;

  const installments: InstallmentAllocationRow[] = receives.map((r) => {
    const num = Number(r.num) || 0;
    const money = Number(r.money) || 0;
    const pg = Number(r.payGroupId) || 0;

    const codeApproveStr = `2_${num}`;
    const allocated = actiMap.get(codeApproveStr) || 0;
    const remaining = money - allocated;

    totalReceive += money;
    totalAllocated += allocated;
    totalRemaining += remaining;

    if (pg >= 1 && pg <= 7) {
      categoryReceived[pg] += money;
      categoryAllocated[pg] += allocated;
    }

    return {
      id: r.id,
      num,
      item: r.item || "—",
      receiveMoney: money,
      allocatedMoney: allocated,
      remainingMoney: remaining,
      isComplete: remaining === 0,
    };
  });

  const categoryNames: Record<number, string> = {
    1: "งบบุคลากร",
    2: "งบดำเนินงาน",
    3: "งบลงทุน",
    4: "งบเงินอุดหนุน",
    5: "งบรายจ่ายอื่น",
    6: "งบกลาง",
    7: "งบอื่น ๆ",
  };

  let totalCategoryReceive = 0;
  let totalCategoryAllocated = 0;
  let totalCategoryRemaining = 0;

  const categories: CategoryAllocationRow[] = [1, 2, 3, 4, 5, 6, 7].map(
    (pg) => {
      const rec = categoryReceived[pg] || 0;
      const alloc = categoryAllocated[pg] || 0;
      const rem = rec - alloc;

      totalCategoryReceive += rec;
      totalCategoryAllocated += alloc;
      totalCategoryRemaining += rem;

      return {
        id: pg,
        categoryName: categoryNames[pg] || `กลุ่มที่ ${pg}`,
        receivedMoney: rec,
        allocatedMoney: alloc,
        remainingMoney: rem,
      };
    },
  );

  return {
    installments,
    totalReceive,
    totalAllocated,
    totalRemaining,
    categories,
    totalCategoryReceive,
    totalCategoryAllocated,
    totalCategoryRemaining,
  };
}

export type InstallmentSpendingRow = {
  id: number;
  num: number;
  item: string;
  money: number;
  withdrawMoney: number;
  returnMoney: number;
  netMoney: number;
  percentSpent: number;
};

export type CategorySpendingRow = {
  id: number;
  categoryName: string;
  money: number;
  spentMoney: number;
  netMoney: number;
  percentSpent: number;
};

export type Check10SpendingResult = {
  installments: InstallmentSpendingRow[];
  totalMoney: number;
  totalWithdraw: number;
  totalReturn: number;
  totalNet: number;
  totalPercent: number;
  categories: CategorySpendingRow[];
  totalCategoryMoney: number;
  totalCategorySpent: number;
  totalCategoryNet: number;
  totalCategoryPercent: number;
};

export async function reportCheckSpendingByInstallmentCheck10(
  budgetYear: number,
): Promise<Check10SpendingResult> {
  // 1. Receives
  const receives = await db
    .select({
      id: budgetReceives.id,
      num: budgetReceives.num,
      item: budgetReceives.item,
      money: budgetReceives.money,
      mPay: budgetReceives.mPay,
      payGroupId: budgetPayTypes.payGroupId,
    })
    .from(budgetReceives)
    .leftJoin(
      budgetPayTypes,
      eq(budgetReceives.mPay, budgetPayTypes.payTypeId),
    )
    .where(eq(budgetReceives.budgetYear, budgetYear))
    .orderBy(asc(budgetReceives.num))
    .catch(() => []);

  // 2. Fetch withdraws joined with plan_acti
  const withdrawRows = await db
    .select({
      codeApprove: planActivities.codeApprove,
      sumWithdraw: sum(budgetWithdraw.money),
    })
    .from(budgetWithdraw)
    .innerJoin(
      planActivities,
      and(
        eq(budgetWithdraw.pjActivity, planActivities.codeActi),
        eq(budgetWithdraw.budgetYear, planActivities.budgetYear),
      ),
    )
    .where(eq(budgetWithdraw.budgetYear, budgetYear))
    .groupBy(planActivities.codeApprove)
    .catch(() => []);

  const withdrawMap = new Map<string, number>();
  for (const w of withdrawRows) {
    if (w.codeApprove) {
      withdrawMap.set(w.codeApprove, Number(w.sumWithdraw) || 0);
    }
  }

  // 3. Fetch returns joined with plan_acti
  const returnRows = await db
    .select({
      codeApprove: planActivities.codeApprove,
      sumReturn: sum(budgetMoneyReturn.money),
    })
    .from(budgetMoneyReturn)
    .innerJoin(
      planActivities,
      and(
        eq(budgetMoneyReturn.pjActivity, planActivities.codeActi),
        eq(budgetMoneyReturn.budgetYear, planActivities.budgetYear),
      ),
    )
    .where(eq(budgetMoneyReturn.budgetYear, budgetYear))
    .groupBy(planActivities.codeApprove)
    .catch(() => []);

  const returnMap = new Map<string, number>();
  for (const r of returnRows) {
    if (r.codeApprove) {
      returnMap.set(r.codeApprove, Number(r.sumReturn) || 0);
    }
  }

  const categoryMoney = [0, 0, 0, 0, 0, 0, 0, 0];
  const categorySpent = [0, 0, 0, 0, 0, 0, 0, 0];
  const categoryNet = [0, 0, 0, 0, 0, 0, 0, 0];

  let totalMoney = 0;
  let totalWithdraw = 0;
  let totalReturn = 0;
  let totalNet = 0;

  const installments: InstallmentSpendingRow[] = receives.map((r) => {
    const num = Number(r.num) || 0;
    const money = Number(r.money) || 0;
    const pg = Number(r.payGroupId) || 0;

    const codeApproveStr = `2_${num}`;
    const withdraw = withdrawMap.get(codeApproveStr) || 0;
    const ret = returnMap.get(codeApproveStr) || 0;
    const pay = withdraw - ret;
    const net = money - withdraw + ret;
    const percent = money > 0 ? ((money - net) / money) * 100 : 0;

    totalMoney += money;
    totalWithdraw += withdraw;
    totalReturn += ret;
    totalNet += net;

    if (pg >= 1 && pg <= 7) {
      categoryMoney[pg] += money;
      categorySpent[pg] += pay;
      categoryNet[pg] += net;
    }

    return {
      id: r.id,
      num,
      item: r.item || "—",
      money,
      withdrawMoney: withdraw,
      returnMoney: ret,
      netMoney: net,
      percentSpent: percent,
    };
  });

  const totalPercent =
    totalMoney > 0 ? ((totalMoney - totalNet) / totalMoney) * 100 : 0;

  const categoryNames: Record<number, string> = {
    1: "งบบุคลากร",
    2: "งบดำเนินงาน",
    3: "งบลงทุน",
    4: "งบเงินอุดหนุน",
    5: "งบรายจ่ายอื่น",
    6: "งบกลาง",
    7: "งบอื่น ๆ",
  };

  let totalCategoryMoney = 0;
  let totalCategorySpent = 0;
  let totalCategoryNet = 0;

  const categories: CategorySpendingRow[] = [1, 2, 3, 4, 5, 6, 7].map(
    (pg) => {
      const money = categoryMoney[pg] || 0;
      const spent = categorySpent[pg] || 0;
      const net = categoryNet[pg] || 0;
      const percent = money > 0 ? (spent / money) * 100 : 0;

      totalCategoryMoney += money;
      totalCategorySpent += spent;
      totalCategoryNet += net;

      return {
        id: pg,
        categoryName: categoryNames[pg] || `กลุ่มที่ ${pg}`,
        money,
        spentMoney: spent,
        netMoney: net,
        percentSpent: percent,
      };
    },
  );

  const totalCategoryPercent =
    totalCategoryMoney > 0
      ? (totalCategorySpent / totalCategoryMoney) * 100
      : 0;

  return {
    installments,
    totalMoney,
    totalWithdraw,
    totalReturn,
    totalNet,
    totalPercent,
    categories,
    totalCategoryMoney,
    totalCategorySpent,
    totalCategoryNet,
    totalCategoryPercent,
  };
}

export type DebtorRow = {
  id: string;
  rowNum: number;
  borrowDateShort: string;
  borrowerName: string;
  item: string;
  amount: number;
  moneyType: string;
  isOverdue: boolean;
  statusText: string;
};

export type DebtorsReportResult = {
  rows: DebtorRow[];
  reserveMoneyTotal: number;
  grandTotal: number;
};

export async function reportDebtorsList(
  budgetYear: number,
): Promise<DebtorsReportResult> {
  const nowMs = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // 1. Fetch reserve money debtors (budget_reserve_money where receive_amount = 0)
  const reserveRows = await db
    .select({
      id: budgetReserveMoneyTable.id,
      item: budgetReserveMoneyTable.item,
      payAmount: budgetReserveMoneyTable.payAmount,
      payRecDate: budgetReserveMoneyTable.payRecDate,
      borrowedPerson: budgetReserveMoneyTable.borrowedPerson,
    })
    .from(budgetReserveMoneyTable)
    .where(
      and(
        eq(budgetReserveMoneyTable.budgetYear, budgetYear),
        eq(budgetReserveMoneyTable.receiveAmount, 0),
      ),
    )
    .orderBy(asc(budgetReserveMoneyTable.payRecDate), asc(budgetReserveMoneyTable.id))
    .catch(() => []);

  // 2. Fetch budget/non-budget withdraw debtors (budget_withdraw where (borrow_status=1 or 2) and withdraw_status=0)
  const withdrawRows = await db
    .select({
      id: budgetWithdraw.id,
      item: budgetWithdraw.item,
      money: budgetWithdraw.money,
      borrowStatus: budgetWithdraw.borrowStatus,
      pRequest: budgetWithdraw.pRequest,
      borrowedRecDate: budgetWithdraw.borrowedRecDate,
    })
    .from(budgetWithdraw)
    .where(
      and(
        eq(budgetWithdraw.budgetYear, budgetYear),
        inArray(budgetWithdraw.borrowStatus, [1, 2]),
        eq(budgetWithdraw.withdrawStatus, 0),
      ),
    )
    .orderBy(asc(budgetWithdraw.borrowedRecDate), asc(budgetWithdraw.id))
    .catch(() => []);

  let rowCounter = 1;
  let reserveMoneyTotal = 0;
  let grandTotal = 0;

  const rows: DebtorRow[] = [];

  for (const r of reserveRows) {
    const amount = Number(r.payAmount) || 0;
    reserveMoneyTotal += amount;
    grandTotal += amount;

    let isOverdue = false;
    if (r.payRecDate) {
      const d = new Date(r.payRecDate).getTime();
      if (!isNaN(d) && nowMs - d > THIRTY_DAYS_MS) {
        isOverdue = true;
      }
    }

    rows.push({
      id: `reserve_${r.id}`,
      rowNum: rowCounter++,
      borrowDateShort: formatShortThaiDate(r.payRecDate),
      borrowerName: r.borrowedPerson || "—",
      item: r.item || "—",
      amount,
      moneyType: "เงินทดรองราชการ",
      isOverdue,
      statusText: isOverdue ? "ครบกำหนด" : "ในเวลา",
    });
  }

  for (const w of withdrawRows) {
    const amount = Number(w.money) || 0;
    grandTotal += amount;

    let isOverdue = false;
    if (w.borrowedRecDate) {
      const d = new Date(w.borrowedRecDate).getTime();
      if (!isNaN(d) && nowMs - d > THIRTY_DAYS_MS) {
        isOverdue = true;
      }
    }

    const moneyType =
      w.borrowStatus === 1
        ? "เงินงบประมาณ"
        : w.borrowStatus === 2
          ? "เงินนอกงบประมาณ"
          : "—";

    rows.push({
      id: `withdraw_${w.id}`,
      rowNum: rowCounter++,
      borrowDateShort: formatShortThaiDate(w.borrowedRecDate),
      borrowerName: w.pRequest || "—",
      item: w.item || "—",
      amount,
      moneyType,
      isOverdue,
      statusText: isOverdue ? "ครบกำหนด" : "ในเวลา",
    });
  }

  return {
    rows,
    reserveMoneyTotal,
    grandTotal,
  };
}

export { EMPTY as EMPTY_REPORT_TABLE };
