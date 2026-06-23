"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { getSchoolByCode, getSchoolById } from "@/lib/core/schools/queries";
import {
  schoolCreateSchema,
  schoolUpdateSchema,
} from "@/lib/core/schools/schemas";

const SCHOOLS_PATH = "/admin/schools";

function parseCreate(formData: FormData) {
  return schoolCreateSchema.safeParse({
    schoolCode: formData.get("schoolCode"),
    name: formData.get("name"),
    schoolType: formData.get("schoolType"),
    schoolGroupId: formData.get("schoolGroupId") || null,
    active: formData.get("active"),
  });
}

function parseUpdate(formData: FormData) {
  return schoolUpdateSchema.safeParse({
    name: formData.get("name"),
    schoolType: formData.get("schoolType"),
    schoolGroupId: formData.get("schoolGroupId") || null,
    active: formData.get("active"),
  });
}

export async function createSchool(formData: FormData) {
  await requireSystemAdmin();

  const parsed = parseCreate(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const existing = await getSchoolByCode(parsed.data.schoolCode);
  if (existing) {
    return { ok: false as const, message: "รหัสสถานศึกษานี้มีในระบบแล้ว" };
  }

  let insertedId: number;
  try {
    const [inserted] = await db
      .insert(schools)
      .values({
        schoolCode: parsed.data.schoolCode,
        name: parsed.data.name,
        schoolType: parsed.data.schoolType,
        schoolGroupId: parsed.data.schoolGroupId,
        active: parsed.data.active,
      })
      .returning({ id: schools.id });

    if (!inserted) {
      return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
    }
    insertedId = inserted.id;
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(SCHOOLS_PATH);
  return { ok: true as const, id: insertedId };
}

export async function updateSchool(id: number, formData: FormData) {
  await requireSystemAdmin();

  const existing = await getSchoolById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบสถานศึกษา" };
  }

  const parsed = parseUpdate(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db
      .update(schools)
      .set({
        name: parsed.data.name,
        schoolType: parsed.data.schoolType,
        schoolGroupId: parsed.data.schoolGroupId,
        active: parsed.data.active,
      })
      .where(eq(schools.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(SCHOOLS_PATH);
  revalidatePath(`${SCHOOLS_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function setSchoolActive(id: number, active: boolean) {
  await requireSystemAdmin();

  const existing = await getSchoolById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบสถานศึกษา" };
  }

  await db.update(schools).set({ active }).where(eq(schools.id, id));

  revalidatePath(SCHOOLS_PATH);
  return { ok: true as const };
}
