"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { planPermissions, planStrategies } from "@/lib/db/schema";
import { canManagePlanStaffPermissions } from "@/lib/plan/permissions";
import {
  getActivePlanYear,
  getPlanStaffPermission,
  getPlanStrategy,
} from "@/lib/plan/queries";
import {
  planPermissionFormSchema,
  planStrategyFormSchema,
} from "@/lib/plan/schemas";
import { requirePlanAccess } from "@/lib/plan/scope";

const STRATEGIES_PATH = "/modules/plan/strategies";
const PERMISSIONS_PATH = "/modules/plan/permissions";

async function requirePlanSettingsStaff() {
  const { user } = await requirePlanAccess();
  if (!canManagePlanStaffPermissions(user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบแผนงาน");
  }
  return user;
}

export async function createPlanStrategy(formData: FormData) {
  await requirePlanSettingsStaff();
  const active = await getActivePlanYear();
  if (!active) {
    return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };
  }

  const parsed = planStrategyFormSchema.safeParse({
    idTegic: formData.get("idTegic"),
    strategic: formData.get("strategic"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db.insert(planStrategies).values({
      codeTegy: parsed.data.codeTegy || parsed.data.idTegic || "1",
      nameTegy: parsed.data.nameTegy || parsed.data.strategic || "",
      idTegic: parsed.data.idTegic,
      budgetYear: active.budgetYear,
      strategic: parsed.data.strategic,
    });
  } catch {
    return { ok: false as const, message: "รหัสยุทธศาสตร์ซ้ำในปีนี้" };
  }

  revalidatePath(STRATEGIES_PATH);
  redirect(STRATEGIES_PATH);
}

export async function updatePlanStrategy(id: number, formData: FormData) {
  await requirePlanSettingsStaff();
  const existing = await getPlanStrategy(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = planStrategyFormSchema.safeParse({
    idTegic: formData.get("idTegic"),
    strategic: formData.get("strategic"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db
      .update(planStrategies)
      .set({
        idTegic: parsed.data.idTegic,
        strategic: parsed.data.strategic,
      })
      .where(eq(planStrategies.id, id));
  } catch {
    return { ok: false as const, message: "รหัสยุทธศาสตร์ซ้ำในปีนี้" };
  }

  revalidatePath(STRATEGIES_PATH);
  redirect(STRATEGIES_PATH);
}

export async function deletePlanStrategy(id: number) {
  await requirePlanSettingsStaff();
  await db.delete(planStrategies).where(eq(planStrategies.id, id));
  revalidatePath(STRATEGIES_PATH);
  redirect(STRATEGIES_PATH);
}

export async function createPlanStaffPermission(formData: FormData) {
  const user = await requirePlanSettingsStaff();
  const parsed = planPermissionFormSchema.safeParse({
    personId: formData.get("personId"),
    permAdd: formData.get("permAdd"),
    permEdit: formData.get("permEdit"),
    permDele: formData.get("permDele"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    await db.insert(planPermissions).values({
      personId: parsed.data.personId,
      permAdd: parsed.data.permAdd ? 1 : 0,
      permEdit: parsed.data.permEdit ? 1 : 0,
      permDele: parsed.data.permDele ? 1 : 0,
      officer: user.personId,
      recDate: today,
    });
  } catch {
    return { ok: false as const, message: "มีสิทธิ์ของบุคลากรนี้อยู่แล้ว" };
  }

  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}

export async function updatePlanStaffPermission(id: number, formData: FormData) {
  const user = await requirePlanSettingsStaff();
  const existing = await getPlanStaffPermission(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = planPermissionFormSchema.safeParse({
    personId: existing.personId,
    permAdd: formData.get("permAdd"),
    permEdit: formData.get("permEdit"),
    permDele: formData.get("permDele"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(planPermissions)
    .set({
      permAdd: parsed.data.permAdd ? 1 : 0,
      permEdit: parsed.data.permEdit ? 1 : 0,
      permDele: parsed.data.permDele ? 1 : 0,
      officer: user.personId,
    })
    .where(eq(planPermissions.id, id));

  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}

export async function deletePlanStaffPermission(id: number) {
  await requirePlanSettingsStaff();
  await db.delete(planPermissions).where(eq(planPermissions.id, id));
  revalidatePath(PERMISSIONS_PATH);
  redirect(PERMISSIONS_PATH);
}
