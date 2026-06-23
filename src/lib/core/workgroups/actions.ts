"use server";

import { and, eq, ilike, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { workgroups } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import {
  countPeopleInWorkgroup,
  countRegisterRefsForWorkgroup,
  getWorkgroupById,
} from "@/lib/core/workgroups/queries";
import { workgroupSchema } from "@/lib/core/workgroups/schemas";

const WORKGROUPS_PATH = "/admin/workgroups";

function parseForm(formData: FormData) {
  return workgroupSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    active: formData.get("active"),
  });
}

async function nameTaken(name: string, excludeId?: number): Promise<boolean> {
  const trimmed = name.trim();
  const [row] = await db
    .select({ id: workgroups.id })
    .from(workgroups)
    .where(
      excludeId != null
        ? and(ilike(workgroups.name, trimmed), ne(workgroups.id, excludeId))
        : ilike(workgroups.name, trimmed),
    )
    .limit(1);

  return row != null;
}

export async function createWorkgroup(formData: FormData) {
  await requireSystemAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name)) {
    return { ok: false as const, message: "ชื่อกลุ่มงานนี้มีในระบบแล้ว" };
  }

  let insertedId: number;
  try {
    const [inserted] = await db
      .insert(workgroups)
      .values({
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active,
        legacyCode: null,
      })
      .returning({ id: workgroups.id });

    if (!inserted) {
      return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
    }
    insertedId = inserted.id;
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(WORKGROUPS_PATH);
  revalidatePath("/modules/bookregister/receive");
  revalidatePath("/modules/bookregister/send");
  return { ok: true as const, id: insertedId };
}

export async function updateWorkgroup(id: number, formData: FormData) {
  await requireSystemAdmin();

  const existing = await getWorkgroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มงาน" };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name, id)) {
    return { ok: false as const, message: "ชื่อกลุ่มงานนี้มีในระบบแล้ว" };
  }

  try {
    await db
      .update(workgroups)
      .set({
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active,
      })
      .where(eq(workgroups.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(WORKGROUPS_PATH);
  revalidatePath(`${WORKGROUPS_PATH}/${id}/edit`);
  revalidatePath("/modules/bookregister/receive");
  revalidatePath("/modules/bookregister/send");
  return { ok: true as const };
}

export async function deleteWorkgroup(id: number) {
  await requireSystemAdmin();

  const existing = await getWorkgroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มงาน" };
  }

  const peopleCount = await countPeopleInWorkgroup(id);
  if (peopleCount > 0) {
    return {
      ok: false as const,
      message: `ลบไม่ได้ — มีบุคลากร ${peopleCount} คนอยู่ในกลุ่มนี้`,
    };
  }

  const registerCount = await countRegisterRefsForWorkgroup(id);
  if (registerCount > 0) {
    return {
      ok: false as const,
      message: `ลบไม่ได้ — มีทะเบียนรับ/ส่ง ${registerCount} รายการอ้างอิงกลุ่มนี้`,
    };
  }

  try {
    await db.delete(workgroups).where(eq(workgroups.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถลบได้" };
  }

  revalidatePath(WORKGROUPS_PATH);
  return { ok: true as const };
}

export async function setWorkgroupActive(id: number, active: boolean) {
  await requireSystemAdmin();

  const existing = await getWorkgroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มงาน" };
  }

  await db.update(workgroups).set({ active }).where(eq(workgroups.id, id));

  revalidatePath(WORKGROUPS_PATH);
  revalidatePath("/modules/bookregister/receive");
  revalidatePath("/modules/bookregister/send");
  return { ok: true as const };
}
