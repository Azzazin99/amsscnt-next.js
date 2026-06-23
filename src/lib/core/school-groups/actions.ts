"use server";

import { and, eq, ilike, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { schoolGroups } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import {
  countSchoolsInGroup,
  getSchoolGroupById,
} from "@/lib/core/school-groups/queries";
import { schoolGroupSchema } from "@/lib/core/school-groups/schemas";

const SCHOOL_GROUPS_PATH = "/admin/school-groups";

function parseForm(formData: FormData) {
  return schoolGroupSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });
}

async function nameTaken(name: string, excludeId?: number): Promise<boolean> {
  const trimmed = name.trim();
  const [row] = await db
    .select({ id: schoolGroups.id })
    .from(schoolGroups)
    .where(
      excludeId != null
        ? and(ilike(schoolGroups.name, trimmed), ne(schoolGroups.id, excludeId))
        : ilike(schoolGroups.name, trimmed),
    )
    .limit(1);

  return row != null;
}

export async function createSchoolGroup(formData: FormData) {
  await requireSystemAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name)) {
    return { ok: false as const, message: "ชื่อกลุ่มนี้มีในระบบแล้ว" };
  }

  let insertedId: number;
  try {
    const [inserted] = await db
      .insert(schoolGroups)
      .values({
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
      })
      .returning({ id: schoolGroups.id });

    if (!inserted) {
      return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
    }
    insertedId = inserted.id;
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(SCHOOL_GROUPS_PATH);
  revalidatePath("/admin/schools");
  return { ok: true as const, id: insertedId };
}

export async function updateSchoolGroup(id: number, formData: FormData) {
  await requireSystemAdmin();

  const existing = await getSchoolGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มสถานศึกษา" };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name, id)) {
    return { ok: false as const, message: "ชื่อกลุ่มนี้มีในระบบแล้ว" };
  }

  try {
    await db
      .update(schoolGroups)
      .set({
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
      })
      .where(eq(schoolGroups.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(SCHOOL_GROUPS_PATH);
  revalidatePath(`${SCHOOL_GROUPS_PATH}/${id}/edit`);
  revalidatePath("/admin/schools");
  return { ok: true as const };
}

export async function deleteSchoolGroup(id: number) {
  await requireSystemAdmin();

  const existing = await getSchoolGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มสถานศึกษา" };
  }

  const schoolCount = await countSchoolsInGroup(id);
  if (schoolCount > 0) {
    return {
      ok: false as const,
      message: `ลบไม่ได้ — มีสถานศึกษา ${schoolCount} แห่งอยู่ในกลุ่มนี้`,
    };
  }

  try {
    await db.delete(schoolGroups).where(eq(schoolGroups.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถลบได้" };
  }

  revalidatePath(SCHOOL_GROUPS_PATH);
  revalidatePath("/admin/schools");
  return { ok: true as const };
}
