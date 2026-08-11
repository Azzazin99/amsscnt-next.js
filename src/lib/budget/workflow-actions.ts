"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  budgetCancelDeega,
  budgetDeega,
  budgetMain,
  budgetMoneyReturn,
  budgetPo,
  budgetReceive,
  budgetReserveMoney,
  budgetWithdraw,
} from "@/lib/db/schema";
import { BUDGET_TYPE_MAIN, type BudgetMoneyKind } from "@/lib/budget/constants";
import {
  buildBudgetReceiveStoredFileName,
  isAllowedBudgetReceiveFileName,
  saveBudgetReceiveFile,
} from "@/lib/budget/files";
import {
  getActiveBudgetYear,
  getBudgetDeega,
  getBudgetMain,
} from "@/lib/budget/queries";
import {
  budgetAllocationFormSchema,
  budgetCancelDeegaFormSchema,
  budgetDeegaFormSchema,
  budgetMoneyReturnFormSchema,
  budgetPayKindFormSchema,
  budgetPoFormSchema,
  budgetReceiveKindFormSchema,
  budgetReserveMoneyFormSchema,
  budgetStatusChangeFormSchema,
  budgetWithdrawFormSchema,
} from "@/lib/budget/schemas";
import {
  requireBudgetAllocationAccess,
  requireBudgetDeegaAccess,
  requireBudgetPayAccess,
  requireBudgetPayCheckAccess,
  requireBudgetReceiveAccess,
  requireBudgetStatusChangeAccess,
  requireBudgetWithdrawAccess,
} from "@/lib/budget/scope";

const ALLOCATION_PATH = "/modules/budget/allocation";
const WITHDRAW_PATH = "/modules/budget/withdraw";
const RETURNS_PATH = "/modules/budget/withdraw/returns";
const DEEGA_PATH = "/modules/budget/deega";
const DEEGA_CANCEL_PATH = "/modules/budget/deega/cancel";
const DEEGA_CARRYOVER_PATH = "/modules/budget/deega/carryover";
const RESERVE_PATH = "/modules/budget/pay/reserve";
const PAY_CHECK_PATH = "/modules/budget/pay-check/main";

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}

async function requireYear() {
  const active = await getActiveBudgetYear();
  if (!active) {
    return {
      ok: false as const,
      message: "ยังไม่ได้กำหนดปีงบประมาณ — ตั้งค่าปีงบประมาณก่อน",
    };
  }
  return { ok: true as const, budgetYear: active.budgetYear };
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// รับการจัดสรรงบประมาณ (budget_receive) + แนบไฟล์
// ---------------------------------------------------------------------------

function parseAllocation(formData: FormData) {
  return budgetAllocationFormSchema.safeParse({
    recDate: formData.get("recDate"),
    num: formData.get("num"),
    bookNumber: formData.get("bookNumber") ?? "",
    bookRef: formData.get("bookRef") ?? "",
    plan: formData.get("plan"),
    project: formData.get("project") ?? "",
    activity: formData.get("activity") ?? "",
    activity2: formData.get("activity2"),
    mSource: formData.get("mSource") ?? "",
    mPay: formData.get("mPay") ?? "",
    item: formData.get("item") ?? "",
    detail: formData.get("detail") ?? "",
    money: formData.get("money"),
  });
}

export async function createBudgetAllocation(formData: FormData) {
  const { user } = await requireBudgetAllocationAccess();
  const year = await requireYear();
  if (!year.ok) return year;

  const parsed = parseAllocation(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  const file = formData.get("file");
  let storedFileName = "";
  if (file instanceof File && file.size > 0) {
    if (!isAllowedBudgetReceiveFileName(file.name)) {
      return { ok: false as const, message: "ชนิดไฟล์แนบไม่ได้รับอนุญาต" };
    }
  }

  const [res_inserted] = await db
    .insert(budgetReceive)
    .values({
      budgetYear: year.budgetYear,
      num: d.num,
      bookNumber: d.bookNumber,
      outDate: "",
      bookRef: d.bookRef,
      plan: d.plan,
      project: d.project,
      activity: d.activity,
      activity2: d.activity2,
      mSource: d.mSource,
      account: "",
      mPay: d.mPay,
      item: d.item,
      detail: d.detail,
      money: d.money,
      file: "",
      recDate: d.recDate,
      officer: user.personId,
    } as any);
  const inserted = { id: res_inserted.insertId };

  if (file instanceof File && file.size > 0) {
    storedFileName = buildBudgetReceiveStoredFileName(
      year.budgetYear,
      inserted.id,
      file.name,
    );
    await saveBudgetReceiveFile(storedFileName, file);
    await db
      .update(budgetReceive)
      .set({ file: storedFileName } as any)
      .where(eq(budgetReceive.id, inserted.id));
  }

  revalidatePath(ALLOCATION_PATH);
  redirect(ALLOCATION_PATH);
}

export async function updateBudgetAllocation(id: number, formData: FormData) {
  await requireBudgetAllocationAccess();
  const parsed = parseAllocation(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;
  await db
    .update(budgetReceive)
    .set({
      num: d.num,
      bookNumber: d.bookNumber,
      bookRef: d.bookRef,
      plan: d.plan,
      project: d.project,
      activity: d.activity,
      activity2: d.activity2,
      mSource: d.mSource,
      mPay: d.mPay,
      item: d.item,
      detail: d.detail,
      money: d.money,
      recDate: d.recDate,
    } as any)
    .where(eq(budgetReceive.id, id));

  revalidatePath(ALLOCATION_PATH);
  redirect(ALLOCATION_PATH);
}

export async function deleteBudgetAllocation(id: number) {
  await requireBudgetAllocationAccess();
  await db.delete(budgetReceive).where(eq(budgetReceive.id, id));
  revalidatePath(ALLOCATION_PATH);
  redirect(ALLOCATION_PATH);
}

// ---------------------------------------------------------------------------
// รับเงินตามประเภท (budget/extra/income) → budget_main
// ---------------------------------------------------------------------------

const receivePath = (kind: BudgetMoneyKind) =>
  `/modules/budget/receive/${kind}`;

export async function createBudgetKindReceive(
  kind: BudgetMoneyKind,
  formData: FormData,
) {
  const { user } = await requireBudgetReceiveAccess(kind);
  const year = await requireYear();
  if (!year.ok) return year;

  const parsed = budgetReceiveKindFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    typeId: kind === "budget" ? BUDGET_TYPE_MAIN : formData.get("typeId"),
    status: formData.get("status"),
    receiveAmount: formData.get("receiveAmount"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetMain).values({
    budgetYear: year.budgetYear,
    doc: d.doc,
    typeId: d.typeId as any,
    item: d.item,
    receiveAmount: d.receiveAmount,
    status: d.status as any,
    recDate: d.recDate,
    officer: user.personId,
  } as any);

  revalidatePath(receivePath(kind));
  redirect(receivePath(kind));
}

export async function updateBudgetKindReceive(
  kind: BudgetMoneyKind,
  id: number,
  formData: FormData,
) {
  await requireBudgetReceiveAccess(kind);
  const existing = await getBudgetMain(id);
  if (!existing || existing.receiveAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการรับ" };
  }

  const parsed = budgetReceiveKindFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    typeId: kind === "budget" ? BUDGET_TYPE_MAIN : formData.get("typeId"),
    status: formData.get("status"),
    receiveAmount: formData.get("receiveAmount"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db
    .update(budgetMain)
    .set({
      doc: d.doc,
      typeId: d.typeId as any,
      item: d.item,
      receiveAmount: d.receiveAmount,
      status: d.status as any,
      recDate: d.recDate,
    } as any)
    .where(eq(budgetMain.id, id));

  revalidatePath(receivePath(kind));
  redirect(`${receivePath(kind)}/${id}`);
}

export async function deleteBudgetKindReceive(
  kind: BudgetMoneyKind,
  id: number,
) {
  await requireBudgetReceiveAccess(kind);
  await db.delete(budgetMain).where(eq(budgetMain.id, id));
  revalidatePath(receivePath(kind));
  redirect(receivePath(kind));
}

// ---------------------------------------------------------------------------
// สั่งจ่ายเงินตามประเภท (budget/extra/income) → budget_main
// ---------------------------------------------------------------------------

const payPath = (kind: BudgetMoneyKind) => `/modules/budget/pay/${kind}`;

export async function createBudgetKindPay(
  kind: BudgetMoneyKind,
  formData: FormData,
) {
  const { user } = await requireBudgetPayAccess(kind);
  const year = await requireYear();
  if (!year.ok) return year;

  const parsed = budgetPayKindFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    typeId: kind === "budget" ? BUDGET_TYPE_MAIN : formData.get("typeId"),
    payGroup: formData.get("payGroup"),
    payAmount: formData.get("payAmount"),
    payedPerson: formData.get("payedPerson"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetMain).values({
    budgetYear: year.budgetYear,
    doc: d.doc,
    typeId: d.typeId as any,
    item: d.item,
    payAmount: d.payAmount,
    payGroup: d.payGroup as any,
    payedPerson: d.payedPerson,
    recDate: d.recDate,
    officer: user.personId,
  } as any);

  revalidatePath(payPath(kind));
  redirect(payPath(kind));
}

export async function updateBudgetKindPay(
  kind: BudgetMoneyKind,
  id: number,
  formData: FormData,
) {
  await requireBudgetPayAccess(kind);
  const existing = await getBudgetMain(id);
  if (!existing || existing.payAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการจ่าย" };
  }
  const parsed = budgetPayKindFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    typeId: kind === "budget" ? BUDGET_TYPE_MAIN : formData.get("typeId"),
    payGroup: formData.get("payGroup"),
    payAmount: formData.get("payAmount"),
    payedPerson: formData.get("payedPerson"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db
    .update(budgetMain)
    .set({
      doc: d.doc,
      typeId: d.typeId as any,
      item: d.item,
      payAmount: d.payAmount,
      payGroup: d.payGroup as any,
      payedPerson: d.payedPerson,
      recDate: d.recDate,
    } as any)
    .where(eq(budgetMain.id, id));

  revalidatePath(payPath(kind));
  redirect(payPath(kind));
}

export async function deleteBudgetKindPay(kind: BudgetMoneyKind, id: number) {
  await requireBudgetPayAccess(kind);
  await db.delete(budgetMain).where(eq(budgetMain.id, id));
  revalidatePath(payPath(kind));
  redirect(payPath(kind));
}

// ---------------------------------------------------------------------------
// เปลี่ยนแปลงสถานะเงิน (change status 3–10)
// ---------------------------------------------------------------------------

const statusPath = (kind: BudgetMoneyKind) =>
  `/modules/budget/status-change/${kind}`;

export async function createBudgetStatusChange(
  kind: BudgetMoneyKind,
  formData: FormData,
) {
  const { user } = await requireBudgetStatusChangeAccess(kind);
  const year = await requireYear();
  if (!year.ok) return year;

  const parsed = budgetStatusChangeFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    typeId: kind === "budget" ? BUDGET_TYPE_MAIN : formData.get("typeId"),
    status: formData.get("status"),
    changeAmount: formData.get("changeAmount"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetMain).values({
    budgetYear: year.budgetYear,
    doc: d.doc,
    typeId: d.typeId as any,
    item: d.item,
    changeAmount: d.changeAmount,
    status: d.status as any,
    recDate: d.recDate,
    officer: user.personId,
  } as any);

  revalidatePath(statusPath(kind));
  redirect(statusPath(kind));
}

export async function deleteBudgetStatusChange(
  kind: BudgetMoneyKind,
  id: number,
) {
  await requireBudgetStatusChangeAccess(kind);
  await db.delete(budgetMain).where(eq(budgetMain.id, id));
  revalidatePath(statusPath(kind));
  redirect(statusPath(kind));
}

// ---------------------------------------------------------------------------
// ทะเบียนขอเบิก/ยืม (budget_withdraw)
// ---------------------------------------------------------------------------

function parseWithdraw(formData: FormData) {
  return budgetWithdrawFormSchema.safeParse({
    recDate: formData.get("recDate"),
    document: formData.get("document"),
    item: formData.get("item"),
    pjActivity: formData.get("pjActivity"),
    money: formData.get("money"),
    payType: formData.get("payType") ?? 0,
    pRequest: formData.get("pRequest") ?? "",
    borrowStatus: formData.get("borrowStatus") ?? 0,
  });
}

export async function createBudgetWithdraw(formData: FormData) {
  const { user } = await requireBudgetWithdrawAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = parseWithdraw(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetWithdraw).values({
    budgetYear: year.budgetYear,
    doc: d.document,
    item: d.item,
    pjActivity: d.pjActivity,
    money: d.money,
    pRequest: d.pRequest,
    borrowStatus: d.borrowStatus,
    officer: user.personId,
    recDate: d.recDate,
  } as any);

  revalidatePath(WITHDRAW_PATH);
  redirect(WITHDRAW_PATH);
}

export async function updateBudgetWithdraw(id: number, formData: FormData) {
  await requireBudgetWithdrawAccess();
  const parsed = parseWithdraw(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;
  await db
    .update(budgetWithdraw)
    .set({
      doc: d.document,
      item: d.item,
      pjActivity: d.pjActivity,
      money: d.money,
      payType: d.payType,
      pRequest: d.pRequest,
      borrowStatus: d.borrowStatus,
      recDate: d.recDate,
    } as any)
    .where(eq(budgetWithdraw.id, id));

  revalidatePath(WITHDRAW_PATH);
  redirect(`${WITHDRAW_PATH}/${id}`);
}

export async function deleteBudgetWithdraw(id: number) {
  await requireBudgetWithdrawAccess();
  await db.delete(budgetWithdraw).where(eq(budgetWithdraw.id, id));
  revalidatePath(WITHDRAW_PATH);
  redirect(WITHDRAW_PATH);
}

// ---------------------------------------------------------------------------
// ทะเบียนคืนเงินโครงการ (budget_money_return)
// ---------------------------------------------------------------------------

export async function createBudgetMoneyReturn(formData: FormData) {
  const { user } = await requireBudgetWithdrawAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = budgetMoneyReturnFormSchema.safeParse({
    recDate: formData.get("recDate"),
    document: formData.get("document"),
    item: formData.get("item"),
    pjActivity: formData.get("pjActivity"),
    money: formData.get("money"),
    payType: formData.get("payType") ?? 0,
    pRequest: formData.get("pRequest") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetMoneyReturn).values({
    budgetYear: year.budgetYear,
    doc: d.document,
    item: d.item,
    pjActivity: d.pjActivity,
    money: d.money,
    payType: d.payType,
    pRequest: d.pRequest,
    officer: user.personId,
    recDate: d.recDate,
  } as any);

  revalidatePath(RETURNS_PATH);
  redirect(RETURNS_PATH);
}

export async function deleteBudgetMoneyReturn(id: number) {
  await requireBudgetWithdrawAccess();
  await db.delete(budgetMoneyReturn).where(eq(budgetMoneyReturn.id, id));
  revalidatePath(RETURNS_PATH);
  redirect(RETURNS_PATH);
}

// ---------------------------------------------------------------------------
// ทะเบียนฎีกา (budget_deega)
// ---------------------------------------------------------------------------

function parseDeega(formData: FormData) {
  return budgetDeegaFormSchema.safeParse({
    recDate: formData.get("recDate"),
    deegaNum: formData.get("deegaNum") ?? undefined,
    doc: formData.get("doc"),
    receiveNum: formData.get("receiveNum") ?? "",
    plan: formData.get("plan") ?? "",
    project: formData.get("project") ?? "",
    activity: formData.get("activity") ?? "",
    payGroup: formData.get("payGroup") ?? undefined,
    item: formData.get("item"),
    withdraw: formData.get("withdraw") ?? 0,
    tax: formData.get("tax") ?? 0,
    pay: formData.get("pay") ?? 0,
    directPay: formData.get("directPay") ?? 0,
    directPayName: formData.get("directPayName") ?? "",
  });
}

export async function createBudgetDeega(formData: FormData) {
  const { user } = await requireBudgetDeegaAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = parseDeega(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetDeega).values({
    budgetYear: year.budgetYear,
    deegaNum: d.deegaNum ?? null,
    doc: d.doc,
    receiveNum: d.receiveNum,
    plan: d.plan,
    project: d.project,
    activity: d.activity,
    payGroup: d.payGroup ?? null,
    item: d.item,
    withdraw: d.withdraw,
    tax: d.tax,
    pay: d.pay,
    directPay: d.directPay,
    directPayName: d.directPayName,
    officer: user.personId,
    recDate: d.recDate,
  } as any);

  revalidatePath(DEEGA_PATH);
  redirect(DEEGA_PATH);
}

export async function updateBudgetDeega(id: number, formData: FormData) {
  await requireBudgetDeegaAccess();
  const parsed = parseDeega(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;
  await db
    .update(budgetDeega)
    .set({
      deegaNum: d.deegaNum ?? null,
      doc: d.doc,
      receiveNum: d.receiveNum,
      plan: d.plan,
      project: d.project,
      activity: d.activity,
      payGroup: d.payGroup ?? null,
      item: d.item,
      withdraw: d.withdraw,
      tax: d.tax,
      pay: d.pay,
      directPay: d.directPay,
      directPayName: d.directPayName,
      recDate: d.recDate,
    } as any)
    .where(eq(budgetDeega.id, id));

  revalidatePath(DEEGA_PATH);
  redirect(DEEGA_PATH);
}

export async function deleteBudgetDeega(id: number) {
  await requireBudgetDeegaAccess();
  await db.delete(budgetDeega).where(eq(budgetDeega.id, id));
  revalidatePath(DEEGA_PATH);
  redirect(DEEGA_PATH);
}

/** คืนเงินคงคลัง — สร้างรายการจ่ายใน budget_main อ้างอิงฎีกา */
export async function returnBudgetDeega(id: number) {
  const { user } = await requireBudgetDeegaAccess();
  const deega = await getBudgetDeega(id);
  if (!deega) return { ok: false as const, message: "ไม่พบฎีกา" };

  await db.insert(budgetMain).values({
    budgetYear: deega.budgetYear,
    doc: deega.doc,
    typeId: BUDGET_TYPE_MAIN,
    referDeegaId: deega.id,
    item: `คืนเงินคงคลังฎีกา ${deega.doc}`,
    payAmount: (deega as any).pay ?? 0,
    payGroup: deega.payGroup,
    recDate: today(),
    officer: user.personId,
  } as any);

  await db
    .update(budgetDeega)
    .set({ status: 1 })
    .where(eq(budgetDeega.id, id));

  revalidatePath(DEEGA_PATH);
  redirect(DEEGA_PATH);
}

// ---------------------------------------------------------------------------
// ยกเลิกฎีกา (budget_cancel_deega)
// ---------------------------------------------------------------------------

export async function createBudgetCancelDeega(formData: FormData) {
  const { user } = await requireBudgetDeegaAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = budgetCancelDeegaFormSchema.safeParse({
    recDate: formData.get("recDate"),
    deega: formData.get("deega"),
    ref: formData.get("ref") ?? "",
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetCancelDeega).values({
    budgetYear: year.budgetYear,
    deega: d.deega,
    ref: d.ref,
    comment: d.comment,
    officer: user.personId,
    recDate: d.recDate,
  } as any);

  revalidatePath(DEEGA_CANCEL_PATH);
  redirect(DEEGA_CANCEL_PATH);
}

export async function deleteBudgetCancelDeega(id: number) {
  await requireBudgetDeegaAccess();
  await db.delete(budgetCancelDeega).where(eq(budgetCancelDeega.id, id));
  revalidatePath(DEEGA_CANCEL_PATH);
  redirect(DEEGA_CANCEL_PATH);
}

// ---------------------------------------------------------------------------
// เงินกันเหลื่อมปี (budget_po)
// ---------------------------------------------------------------------------

export async function createBudgetPo(formData: FormData) {
  const { user } = await requireBudgetDeegaAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = budgetPoFormSchema.safeParse({
    recDate: formData.get("recDate"),
    deegaNum: formData.get("deegaNum") ?? undefined,
    doc: formData.get("doc"),
    plan: formData.get("plan") ?? "",
    project: formData.get("project") ?? "",
    activity: formData.get("activity") ?? "",
    payGroup: formData.get("payGroup") ?? undefined,
    item: formData.get("item") ?? "",
    withdraw: formData.get("withdraw") ?? 0,
    tax: formData.get("tax") ?? 0,
    pay: formData.get("pay") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetPo).values({
    budgetYear: year.budgetYear,
    deegaNum: d.deegaNum ?? null,
    doc: d.doc,
    plan: d.plan,
    project: d.project,
    activity: d.activity,
    payGroup: d.payGroup ?? null,
    item: d.item,
    withdraw: d.withdraw,
    tax: d.tax,
    pay: d.pay,
    officer: user.personId,
    recDate: d.recDate,
  } as any);

  revalidatePath(DEEGA_CARRYOVER_PATH);
  redirect(DEEGA_CARRYOVER_PATH);
}

export async function deleteBudgetPo(id: number) {
  await requireBudgetDeegaAccess();
  await db.delete(budgetPo).where(eq(budgetPo.id, id));
  revalidatePath(DEEGA_CARRYOVER_PATH);
  redirect(DEEGA_CARRYOVER_PATH);
}

// ---------------------------------------------------------------------------
// เงินทดรองราชการ (budget_reserve_money)
// ---------------------------------------------------------------------------

export async function createBudgetReserveMoney(formData: FormData) {
  const { user } = await requireBudgetPayAccess();
  const year = await requireYear();
  if (!year.ok) return year;
  const parsed = budgetReserveMoneyFormSchema.safeParse({
    recDate: formData.get("recDate"),
    document: formData.get("document"),
    item: formData.get("item"),
    payAmount: formData.get("payAmount"),
    borrowedPerson: formData.get("borrowedPerson"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const d = parsed.data;

  await db.insert(budgetReserveMoney).values({
    budgetYear: year.budgetYear,
    doc: d.document,
    item: d.item,
    payAmount: d.payAmount,
    borrowedPerson: d.borrowedPerson,
    recDate: d.recDate,
    officer: user.personId,
  } as any);

  revalidatePath(RESERVE_PATH);
  redirect(RESERVE_PATH);
}

export async function deleteBudgetReserveMoney(id: number) {
  await requireBudgetPayAccess();
  await db.delete(budgetReserveMoney).where(eq(budgetReserveMoney.id, id));
  revalidatePath(RESERVE_PATH);
  redirect(RESERVE_PATH);
}

// ---------------------------------------------------------------------------
// จ่ายเงิน (budget_main)
// ---------------------------------------------------------------------------

export async function payCheckBudget(id: number, formData: FormData) {
  const { user } = await requireBudgetPayCheckAccess();
  const checkNumber = String(formData.get("checkNumber") ?? "").trim();
  const payee = String(formData.get("payee") ?? "").trim();
  await db
    .update(budgetMain)
    .set({
      payDate: today(),
      checkNumber: checkNumber || null,
      payee: payee || null,
      payer: user.personId,
    })
    .where(eq(budgetMain.id, id));
  revalidatePath(PAY_CHECK_PATH);
  redirect(PAY_CHECK_PATH);
}
