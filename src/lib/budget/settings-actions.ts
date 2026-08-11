"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  budgetPayTypes,
  budgetPermissions,
  budgetType,
} from "@/lib/db/schema";
import {
  codeCategoryTable,
  getActiveBudgetYear,
  getBudgetStaffPermission,
  type BudgetCodeCategory,
} from "@/lib/budget/queries";
import {
  budgetCodeFormSchema,
  budgetPayTypeFormSchema,
  budgetPermissionFormSchema,
  budgetTypeFormSchema,
} from "@/lib/budget/schemas";
import {
  requireBudgetSettingsData,
  requireBudgetStaffAccess,
} from "@/lib/budget/scope";

const PERMISSIONS_PATH = "/modules/budget/permissions";
const PAY_TYPES_PATH = "/modules/budget/pay-types";
const TYPES_PATH = "/modules/budget/types";

const CODE_PATHS: Record<string, string> = {
  plans: "/modules/budget/plans",
  "project-products": "/modules/budget/project-products",
  "key-activities": "/modules/budget/key-activities",
  "money-sources": "/modules/budget/money-sources",
};

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}

// ---------------------------------------------------------------------------
// Staff permissions (p1–p10)
// ---------------------------------------------------------------------------

function parsePermissionForm(formData: FormData, personId?: string) {
  return budgetPermissionFormSchema.safeParse({
    personId: personId ?? formData.get("personId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
    p3: formData.get("p3"),
    p4: formData.get("p4"),
    p5: formData.get("p5"),
    p6: formData.get("p6"),
    p7: formData.get("p7"),
    p8: formData.get("p8"),
    p9: formData.get("p9"),
    p10: formData.get("p10"),
  });
}

function permissionValues(data: Record<string, any>) {
  return {
    p1: Number(data.p1) === 1 ? 1 : 0,
    p2: Number(data.p2) === 1 ? 1 : 0,
    p3: Number(data.p3) === 1 ? 1 : 0,
    p4: Number(data.p4) === 1 ? 1 : 0,
    p5: Number(data.p5) === 1 ? 1 : 0,
    p6: Number(data.p6) === 1 ? 1 : 0,
    p7: Number(data.p7) === 1 ? 1 : 0,
    p8: Number(data.p8) === 1 ? 1 : 0,
    p9: Number(data.p9) === 1 ? 1 : 0,
    p10: Number(data.p10) === 1 ? 1 : 0,
  };
}

export async function createBudgetStaffPermission(formData: FormData) {
  const { user } = await requireBudgetStaffAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    await db.insert(budgetPermissions).values({
      personId: (parsed.data as any).personId,
      ...permissionValues(parsed.data as any),
      officer: user.personId,
      recDate: today,
    } as any);
  } catch {
    return { ok: false as const, message: "มีสิทธิ์ของบุคลากรนี้อยู่แล้ว" };
  }

  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}

export async function updateBudgetStaffPermission(
  id: number,
  formData: FormData,
) {
  const { user } = await requireBudgetStaffAccess();
  const existing = await getBudgetStaffPermission(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData, existing.personId);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  await db
    .update(budgetPermissions)
    .set({ ...permissionValues(parsed.data as any), officer: user.personId } as any)
    .where(eq(budgetPermissions.id, id));

  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}

export async function deleteBudgetStaffPermission(id: number) {
  await requireBudgetStaffAccess();
  await db.delete(budgetPermissions).where(eq(budgetPermissions.id, id));
  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}

// ---------------------------------------------------------------------------
// Code + name categories (plan / project-product / key-activity / money-source)
// ---------------------------------------------------------------------------

export async function createBudgetCodeItem(
  category: BudgetCodeCategory,
  formData: FormData,
) {
  await requireBudgetSettingsData();
  const active = await getActiveBudgetYear();
  if (!active) return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };

  const parsed = budgetCodeFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  const t = codeCategoryTable(category) as any;
  try {
    await db.insert(t).values({
      budgetYear: active.budgetYear,
      code: parsed.data.code,
      name: parsed.data.name,
    });
  } catch {
    return { ok: false as const, message: "รหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  revalidatePath(CODE_PATHS[category]);
  redirect(CODE_PATHS[category]);
}

export async function updateBudgetCodeItem(
  category: BudgetCodeCategory,
  id: number,
  formData: FormData,
) {
  await requireBudgetSettingsData();
  const parsed = budgetCodeFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  const t = codeCategoryTable(category) as any;
  try {
    await db
      .update(t)
      .set({ code: parsed.data.code, name: parsed.data.name })
      .where(eq(t.id, id));
  } catch {
    return { ok: false as const, message: "รหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  revalidatePath(CODE_PATHS[category]);
  redirect(CODE_PATHS[category]);
}

export async function deleteBudgetCodeItem(
  category: BudgetCodeCategory,
  id: number,
) {
  await requireBudgetSettingsData();
  const t = codeCategoryTable(category) as any;
  await db.delete(t).where(eq(t.id, id));
  revalidatePath(CODE_PATHS[category]);
  redirect(CODE_PATHS[category]);
}

/** คัดลอกข้อมูลจากปีก่อนหน้า */
export async function copyBudgetCodeFromPrevYear(category: BudgetCodeCategory) {
  await requireBudgetSettingsData();
  const active = await getActiveBudgetYear();
  if (!active) return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };

  const t = codeCategoryTable(category) as any;
  const prev = await db
    .select({ code: t.code, name: t.name })
    .from(t)
    .where(eq(t.budgetYear, active.budgetYear - 1));

  if (prev.length === 0) {
    return { ok: false as const, message: "ไม่มีข้อมูลปีเก่า" };
  }

  await db.insert(t).values(
    prev.map((r: any) => ({
      budgetYear: active.budgetYear,
      code: r.code,
      name: r.name,
    })),
  );

  revalidatePath(CODE_PATHS[category]);
  redirect(CODE_PATHS[category]);
}

// ---------------------------------------------------------------------------
// Pay types (budget_pay_types)
// ---------------------------------------------------------------------------

export async function createBudgetPayType(formData: FormData) {
  await requireBudgetSettingsData();
  const parsed = budgetPayTypeFormSchema.safeParse({
    payGroupId: formData.get("payGroupId"),
    payTypeId: formData.get("payTypeId"),
    payTypeName: formData.get("payTypeName"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  await db.insert(budgetPayTypes).values({
    payTypeId: parsed.data.payTypeId,
    payGroupId: parsed.data.payGroupId,
    payTypeName: parsed.data.payTypeName,
  });

  revalidatePath(PAY_TYPES_PATH);
  redirect(PAY_TYPES_PATH);
}

export async function updateBudgetPayType(id: number, formData: FormData) {
  await requireBudgetSettingsData();
  const parsed = budgetPayTypeFormSchema.safeParse({
    payGroupId: formData.get("payGroupId"),
    payTypeId: formData.get("payTypeId"),
    payTypeName: formData.get("payTypeName"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  await db
    .update(budgetPayTypes)
    .set({
      payTypeId: parsed.data.payTypeId,
      payGroupId: parsed.data.payGroupId,
      payTypeName: parsed.data.payTypeName,
    })
    .where(eq(budgetPayTypes.id, id));

  revalidatePath(PAY_TYPES_PATH);
  redirect(PAY_TYPES_PATH);
}

export async function deleteBudgetPayType(id: number) {
  await requireBudgetSettingsData();
  await db.delete(budgetPayTypes).where(eq(budgetPayTypes.id, id));
  revalidatePath(PAY_TYPES_PATH);
  redirect(PAY_TYPES_PATH);
}

// ---------------------------------------------------------------------------
// Sub-types (budget_type)
// ---------------------------------------------------------------------------

export async function createBudgetType(formData: FormData) {
  await requireBudgetSettingsData();
  const active = await getActiveBudgetYear();
  if (!active) return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };

  const parsed = budgetTypeFormSchema.safeParse({
    categoryId: formData.get("categoryId"),
    typeId: formData.get("typeId"),
    typeName: formData.get("typeName"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  const dup = await db
    .select({ id: (budgetType as any).id })
    .from(budgetType as any)
    .where(
      and(
        eq((budgetType as any).budgetYear, active.budgetYear),
        eq((budgetType as any).typeId, parsed.data.typeId),
      ),
    )
    .limit(1);
  if (dup.length) {
    return { ok: false as const, message: "รหัสประเภทย่อยของเงินมีอยู่แล้ว" };
  }

  await db.insert(budgetType as any).values({
    budgetYear: active.budgetYear,
    typeId: parsed.data.typeId,
    typeName: parsed.data.typeName,
  } as any);

  revalidatePath(TYPES_PATH);
  redirect(TYPES_PATH);
}

export async function updateBudgetType(id: number, formData: FormData) {
  await requireBudgetSettingsData();
  const parsed = budgetTypeFormSchema.safeParse({
    categoryId: formData.get("categoryId"),
    typeId: formData.get("typeId"),
    typeName: formData.get("typeName"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }

  await db
    .update(budgetType as any)
    .set({
      typeId: parsed.data.typeId,
      typeName: parsed.data.typeName,
    } as any)
    .where(eq((budgetType as any).id, id));

  revalidatePath(TYPES_PATH);
  redirect(TYPES_PATH);
}

export async function deleteBudgetType(id: number) {
  await requireBudgetSettingsData();
  await db.delete(budgetType as any).where(eq((budgetType as any).id, id));
  revalidatePath(TYPES_PATH);
  redirect(TYPES_PATH);
}

export async function copyBudgetTypeFromPrevYear() {
  await requireBudgetSettingsData();
  const active = await getActiveBudgetYear();
  if (!active) return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };

  const prev = await db
    .select({
      typeId: (budgetType as any).typeId,
      categoryId: (budgetType as any).categoryId,
      typeName: (budgetType as any).typeName,
    })
    .from(budgetType as any)
    .where(eq((budgetType as any).budgetYear, active.budgetYear - 1));

  if (prev.length === 0) {
    return { ok: false as const, message: "ไม่มีข้อมูลปีเก่า" };
  }

  await db.insert(budgetType as any).values(
    prev.map((r: any) => ({
      budgetYear: active.budgetYear,
      typeId: r.typeId,
      categoryId: r.categoryId,
      typeName: r.typeName,
    })),
  );

  revalidatePath(TYPES_PATH);
  redirect(TYPES_PATH);
}
