"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { moduleAdmins, modules, users } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { getModuleAdminById } from "@/lib/core/module-admins/queries";
import { moduleAdminCreateSchema } from "@/lib/core/module-admins/schemas";

const PATH = "/admin/module-admins";

export async function createModuleAdmin(formData: FormData) {
  await requireSystemAdmin();

  const parsed = moduleAdminCreateSchema.safeParse({
    userId: formData.get("userId"),
    moduleSlug: formData.get("moduleSlug"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.data.userId), eq(users.status, 1)))
    .limit(1);

  if (!user) {
    return { ok: false as const, message: "ไม่พบผู้ใช้หรือบัญชีถูกปิด" };
  }

  const [mod] = await db
    .select({ slug: modules.slug })
    .from(modules)
    .where(eq(modules.slug, parsed.data.moduleSlug))
    .limit(1);

  if (!mod) {
    return { ok: false as const, message: "ไม่พบโมดูล" };
  }

  try {
    const [inserted] = await db
      .insert(moduleAdmins)
      .values({
        userId: parsed.data.userId,
        moduleSlug: parsed.data.moduleSlug,
      })
      .returning({ id: moduleAdmins.id });

    if (!inserted) {
      return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
    }

    revalidatePath(PATH);
    return { ok: true as const, id: inserted.id };
  } catch {
    return {
      ok: false as const,
      message: "ผู้ใช้นี้เป็นผู้ดูแลโมดูลนี้อยู่แล้ว",
    };
  }
}

export async function deleteModuleAdmin(id: number) {
  await requireSystemAdmin();

  const existing = await getModuleAdminById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบรายการ" };
  }

  await db.delete(moduleAdmins).where(eq(moduleAdmins.id, id));

  revalidatePath(PATH);
  return { ok: true as const };
}
