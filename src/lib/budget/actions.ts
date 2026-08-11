"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { budgetMain, budgetYears } from "@/lib/db/schema";
import { BUDGET_TYPE_MAIN } from "@/lib/budget/constants";
import {
  canManageBudgetSettings,
  canWriteBudgetDisburse,
  canWriteBudgetReceive,
} from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  getBudgetMain,
  getBudgetYear,
} from "@/lib/budget/queries";
import {
  budgetDisburseFormSchema,
  budgetReceiveFormSchema,
  budgetYearFormSchema,
} from "@/lib/budget/schemas";
import { requireBudgetAccess } from "@/lib/budget/scope";

const RECEIVE_PATH = "/modules/budget/receive";
const DISBURSE_PATH = "/modules/budget/disburse";
const YEARS_PATH = "/modules/budget/years";

async function requireBudgetSettingsAccess() {
  const ctx = await requireBudgetAccess();
  if (!canManageBudgetSettings(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบการเงิน");
  }
  return ctx;
}

async function requireBudgetReceiveWrite() {
  const ctx = await requireBudgetAccess();
  if (!canWriteBudgetReceive(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกทะเบียนรับ");
  }
  return ctx;
}

async function requireBudgetDisburseWrite() {
  const ctx = await requireBudgetAccess();
  if (!canWriteBudgetDisburse(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกทะเบียนจ่าย");
  }
  return ctx;
}

async function requireActiveBudgetYear() {
  const active = await getActiveBudgetYear();
  if (!active) {
    return {
      ok: false as const,
      message:
        "ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน",
    };
  }
  return { ok: true as const, budgetYear: active.budgetYear };
}

async function deactivateOtherBudgetYears(exceptId?: number) {
  const rows = await db.select({ id: budgetYears.id }).from(budgetYears);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(budgetYears)
      .set({ yearActive: false })
      .where(eq(budgetYears.id, row.id));
  }
}

function parseYearForm(formData: FormData) {
  const parsed = budgetYearFormSchema.safeParse({
    budgetYear: formData.get("budgetYear"),
    yearActive: formData.get("yearActive"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }
  return { ok: true as const, data: parsed.data };
}

export async function createBudgetYear(formData: FormData) {
  await requireBudgetSettingsAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherBudgetYears();

  try {
    await db.insert(budgetYears).values({
      budgetYear: data.budgetYear,
      yearActive: data.yearActive,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function toggleBudgetYearActive(id: number) {
  await requireBudgetSettingsAccess();
  const existing = await getBudgetYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) await deactivateOtherBudgetYears(id);

  await db
    .update(budgetYears)
    .set({ yearActive: nextActive })
    .where(eq(budgetYears.id, id));

  revalidatePath(YEARS_PATH);
  revalidatePath(RECEIVE_PATH);
  revalidatePath(DISBURSE_PATH);
  return { ok: true };
}

export async function deleteBudgetYear(id: number) {
  await requireBudgetSettingsAccess();
  await db.delete(budgetYears).where(eq(budgetYears.id, id));
  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function createBudgetReceive(formData: FormData) {
  const { user } = await requireBudgetReceiveWrite();
  const yearCheck = await requireActiveBudgetYear();
  if (!yearCheck.ok) return yearCheck;

  const parsed = budgetReceiveFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    status: formData.get("status"),
    receiveAmount: formData.get("receiveAmount"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const insertedId = await insertAndGetId(budgetMain, {
      budgetYear: yearCheck.budgetYear,
      doc: data.doc,
      typeId: BUDGET_TYPE_MAIN,
      item: data.item,
      receiveAmount: data.receiveAmount,
      status: data.status,
      recDate: data.recDate,
      officer: user.personId,
    });
  const inserted = { id: insertedId };

  revalidatePath(RECEIVE_PATH);
  redirect(`${RECEIVE_PATH}/${inserted.id}`);
}

export async function updateBudgetReceive(id: number, formData: FormData) {
  await requireBudgetReceiveWrite();
  const existing = await getBudgetMain(id);
  if (!existing || existing.receiveAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการรับ" };
  }

  const parsed = budgetReceiveFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    status: formData.get("status"),
    receiveAmount: formData.get("receiveAmount"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  await db
    .update(budgetMain)
    .set({
      doc: data.doc,
      item: data.item,
      receiveAmount: data.receiveAmount,
      status: data.status,
      recDate: data.recDate,
    })
    .where(eq(budgetMain.id, id));

  revalidatePath(RECEIVE_PATH);
  redirect(`${RECEIVE_PATH}/${id}`);
}

export async function deleteBudgetReceive(id: number) {
  await requireBudgetReceiveWrite();
  const existing = await getBudgetMain(id);
  if (!existing || existing.receiveAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการรับ" };
  }

  await db.delete(budgetMain).where(eq(budgetMain.id, id));
  revalidatePath(RECEIVE_PATH);
  redirect(RECEIVE_PATH);
}

export async function createBudgetDisburse(formData: FormData) {
  const { user } = await requireBudgetDisburseWrite();
  const yearCheck = await requireActiveBudgetYear();
  if (!yearCheck.ok) return yearCheck;

  const parsed = budgetDisburseFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    payGroup: formData.get("payGroup"),
    payAmount: formData.get("payAmount"),
    payedPerson: formData.get("payedPerson"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const insertedId = await insertAndGetId(budgetMain, {
      budgetYear: yearCheck.budgetYear,
      doc: data.doc,
      typeId: BUDGET_TYPE_MAIN,
      item: data.item,
      payAmount: data.payAmount,
      payGroup: data.payGroup,
      payedPerson: data.payedPerson,
      recDate: data.recDate,
      officer: user.personId,
    });
  const inserted = { id: insertedId };

  revalidatePath(DISBURSE_PATH);
  redirect(`${DISBURSE_PATH}/${inserted.id}`);
}

export async function updateBudgetDisburse(id: number, formData: FormData) {
  await requireBudgetDisburseWrite();
  const existing = await getBudgetMain(id);
  if (!existing || existing.payAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการจ่าย" };
  }

  const parsed = budgetDisburseFormSchema.safeParse({
    recDate: formData.get("recDate"),
    doc: formData.get("doc"),
    item: formData.get("item"),
    payGroup: formData.get("payGroup"),
    payAmount: formData.get("payAmount"),
    payedPerson: formData.get("payedPerson"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  await db
    .update(budgetMain)
    .set({
      doc: data.doc,
      item: data.item,
      payAmount: data.payAmount,
      payGroup: data.payGroup,
      payedPerson: data.payedPerson,
      recDate: data.recDate,
    })
    .where(eq(budgetMain.id, id));

  revalidatePath(DISBURSE_PATH);
  redirect(`${DISBURSE_PATH}/${id}`);
}

export async function deleteBudgetDisburse(id: number) {
  await requireBudgetDisburseWrite();
  const existing = await getBudgetMain(id);
  if (!existing || existing.payAmount == null) {
    return { ok: false as const, message: "ไม่พบรายการจ่าย" };
  }

  await db.delete(budgetMain).where(eq(budgetMain.id, id));
  revalidatePath(DISBURSE_PATH);
  redirect(DISBURSE_PATH);
}
