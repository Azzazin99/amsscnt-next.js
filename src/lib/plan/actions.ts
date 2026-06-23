"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { planActivities, planProjects, planYears } from "@/lib/db/schema";
import { canManagePlanSettings } from "@/lib/plan/permissions";
import {
  countActivitiesForProject,
  getActivePlanYear,
  getPlanActivity,
  getPlanProject,
  getPlanYear,
} from "@/lib/plan/queries";
import {
  planActivityFormSchema,
  planProjectFormSchema,
  planYearFormSchema,
} from "@/lib/plan/schemas";
import { requirePlanAccess, requirePlanWriteAccess } from "@/lib/plan/scope";

const PROJECTS_PATH = "/modules/plan/projects";
const ACTIVITIES_PATH = "/modules/plan/activities";
const YEARS_PATH = "/modules/plan/years";

async function requirePlanSettingsAccess() {
  const { user } = await requirePlanAccess();
  if (!canManagePlanSettings(user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบแผนงาน");
  }
  return user;
}

async function requireActivePlanYear() {
  const active = await getActivePlanYear();
  if (!active) {
    return {
      ok: false as const,
      message:
        "ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน",
    };
  }
  return { ok: true as const, budgetYear: active.budgetYear };
}

async function deactivateOtherPlanYears(exceptId?: number) {
  const rows = await db.select({ id: planYears.id }).from(planYears);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(planYears)
      .set({ yearActive: false })
      .where(eq(planYears.id, row.id));
  }
}

function parseYearForm(formData: FormData) {
  const parsed = planYearFormSchema.safeParse({
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

export async function createPlanYear(formData: FormData) {
  await requirePlanSettingsAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherPlanYears();

  try {
    await db.insert(planYears).values({
      budgetYear: data.budgetYear,
      yearActive: data.yearActive,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function togglePlanYearActive(id: number) {
  await requirePlanSettingsAccess();
  const existing = await getPlanYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) await deactivateOtherPlanYears(id);

  await db
    .update(planYears)
    .set({ yearActive: nextActive })
    .where(eq(planYears.id, id));

  revalidatePath(YEARS_PATH);
  revalidatePath(PROJECTS_PATH);
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function deletePlanYear(id: number) {
  await requirePlanSettingsAccess();
  await db.delete(planYears).where(eq(planYears.id, id));
  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function createPlanProject(formData: FormData) {
  await requirePlanWriteAccess();
  const yearCheck = await requireActivePlanYear();
  if (!yearCheck.ok) return yearCheck;

  const parsed = planProjectFormSchema.safeParse({
    codeClus: formData.get("codeClus"),
    codeTegy: formData.get("codeTegy") ?? "1",
    codeProj: formData.get("codeProj"),
    nameProj: formData.get("nameProj"),
    budgetProj: formData.get("budgetProj"),
    ownerProj: formData.get("ownerProj"),
    beginDate: formData.get("beginDate"),
    finishDate: formData.get("finishDate"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  try {
    const [inserted] = await db
      .insert(planProjects)
      .values({
        budgetYear: yearCheck.budgetYear,
        codeClus: data.codeClus,
        codeTegy: data.codeTegy || "1",
        codeProj: data.codeProj.padStart(3, "0").slice(-3),
        budgetProj: data.budgetProj,
        nameProj: data.nameProj,
        ownerProj: data.ownerProj ?? "",
        beginDate: data.beginDate,
        finishDate: data.finishDate,
      })
      .returning({ id: planProjects.id });

    revalidatePath(PROJECTS_PATH);
    redirect(`${PROJECTS_PATH}/${inserted.id}`);
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — รหัสโครงการอาจซ้ำในปีนี้",
    };
  }
}

export async function updatePlanProject(id: number, formData: FormData) {
  await requirePlanWriteAccess();
  const existing = await getPlanProject(id);
  if (!existing) return { ok: false as const, message: "ไม่พบโครงการ" };

  const parsed = planProjectFormSchema.safeParse({
    codeClus: formData.get("codeClus"),
    codeTegy: formData.get("codeTegy") ?? existing.codeTegy,
    codeProj: formData.get("codeProj"),
    nameProj: formData.get("nameProj"),
    budgetProj: formData.get("budgetProj"),
    ownerProj: formData.get("ownerProj"),
    beginDate: formData.get("beginDate"),
    finishDate: formData.get("finishDate"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const codeProj = data.codeProj.padStart(3, "0").slice(-3);

  try {
    await db
      .update(planProjects)
      .set({
        codeClus: data.codeClus,
        codeTegy: data.codeTegy || "1",
        codeProj,
        budgetProj: data.budgetProj,
        nameProj: data.nameProj,
        ownerProj: data.ownerProj ?? "",
        beginDate: data.beginDate,
        finishDate: data.finishDate,
      })
      .where(eq(planProjects.id, id));
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — รหัสโครงการอาจซ้ำ",
    };
  }

  revalidatePath(PROJECTS_PATH);
  redirect(`${PROJECTS_PATH}/${id}`);
}

export async function deletePlanProject(id: number) {
  await requirePlanWriteAccess();
  const existing = await getPlanProject(id);
  if (!existing) return { ok: false as const, message: "ไม่พบโครงการ" };

  const actCount = await countActivitiesForProject(
    existing.budgetYear,
    existing.codeProj,
  );
  if (actCount > 0) {
    return {
      ok: false as const,
      message: "มีกิจกรรมในโครงการ — ไม่อนุญาตให้ลบ",
    };
  }

  await db.delete(planProjects).where(eq(planProjects.id, id));
  revalidatePath(PROJECTS_PATH);
  redirect(PROJECTS_PATH);
}

export async function createPlanActivity(formData: FormData) {
  await requirePlanWriteAccess();
  const yearCheck = await requireActivePlanYear();
  if (!yearCheck.ok) return yearCheck;

  const parsed = planActivityFormSchema.safeParse({
    codeClus: formData.get("codeClus"),
    codeProj: formData.get("codeProj"),
    codeActi: formData.get("codeActi"),
    nameActi: formData.get("nameActi"),
    budgetActi: formData.get("budgetActi"),
    ownerActi: formData.get("ownerActi"),
    beginDate: formData.get("beginDate"),
    finishDate: formData.get("finishDate"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const [project] = await db
    .select({ id: planProjects.id })
    .from(planProjects)
    .where(
      and(
        eq(planProjects.budgetYear, yearCheck.budgetYear),
        eq(planProjects.codeProj, data.codeProj),
      ),
    )
    .limit(1);

  if (!project) {
    return { ok: false as const, message: "ไม่พบโครงการที่เลือก" };
  }

  try {
    const [inserted] = await db
      .insert(planActivities)
      .values({
        budgetYear: yearCheck.budgetYear,
        codeClus: data.codeClus,
        codeProj: data.codeProj,
        codeActi: data.codeActi.padStart(6, "0").slice(-6),
        nameActi: data.nameActi,
        budgetActi: data.budgetActi,
        ownerActi: data.ownerActi ?? "",
        beginDate: data.beginDate,
        finishDate: data.finishDate,
      })
      .returning({ id: planActivities.id });

    revalidatePath(ACTIVITIES_PATH);
    redirect(`${ACTIVITIES_PATH}/${inserted.id}`);
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — รหัสกิจกรรมอาจซ้ำในปีนี้",
    };
  }
}

export async function updatePlanActivity(id: number, formData: FormData) {
  await requirePlanWriteAccess();
  const existing = await getPlanActivity(id);
  if (!existing) return { ok: false as const, message: "ไม่พบกิจกรรม" };

  const parsed = planActivityFormSchema.safeParse({
    codeClus: formData.get("codeClus"),
    codeProj: formData.get("codeProj"),
    codeActi: formData.get("codeActi"),
    nameActi: formData.get("nameActi"),
    budgetActi: formData.get("budgetActi"),
    ownerActi: formData.get("ownerActi"),
    beginDate: formData.get("beginDate"),
    finishDate: formData.get("finishDate"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;

  try {
    await db
      .update(planActivities)
      .set({
        codeClus: data.codeClus,
        codeProj: data.codeProj,
        codeActi: data.codeActi.padStart(6, "0").slice(-6),
        nameActi: data.nameActi,
        budgetActi: data.budgetActi,
        ownerActi: data.ownerActi ?? "",
        beginDate: data.beginDate,
        finishDate: data.finishDate,
      })
      .where(eq(planActivities.id, id));
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — รหัสกิจกรรมอาจซ้ำ",
    };
  }

  revalidatePath(ACTIVITIES_PATH);
  redirect(`${ACTIVITIES_PATH}/${id}`);
}

export async function deletePlanActivity(id: number) {
  await requirePlanWriteAccess();
  await db.delete(planActivities).where(eq(planActivities.id, id));
  revalidatePath(ACTIVITIES_PATH);
  redirect(ACTIVITIES_PATH);
}
