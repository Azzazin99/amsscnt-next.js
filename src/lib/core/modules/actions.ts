"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { modules } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { getModuleById } from "@/lib/core/modules/queries";
import { moduleUpdateSchema } from "@/lib/core/modules/schemas";

const MODULES_PATH = "/admin/modules";

export async function updateModule(id: number, formData: FormData) {
  await requireSystemAdmin();

  const existing = await getModuleById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบโมดูล" };
  }

  const parsed = moduleUpdateSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db
      .update(modules)
      .set({
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active,
      })
      .where(eq(modules.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(MODULES_PATH);
  revalidatePath(`${MODULES_PATH}/${id}/edit`);
  revalidatePath("/home");
  return { ok: true as const };
}

export async function setModuleActive(id: number, active: boolean) {
  await requireSystemAdmin();

  const existing = await getModuleById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบโมดูล" };
  }

  await db.update(modules).set({ active }).where(eq(modules.id, id));

  revalidatePath(MODULES_PATH);
  revalidatePath("/home");
  return { ok: true as const };
}
