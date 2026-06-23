"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertRetentionSetting } from "@/lib/book/retention/queries";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { requireBookScope } from "@/lib/book/scope";

const RETENTION_PATH = "/modules/book/retention";

const settingSchema = z.object({
  bookType: z.coerce.number().int().min(1).max(99),
  retentionYears: z.coerce.number().int().min(1).max(99),
});

export async function updateRetentionSetting(formData: FormData) {
  const { user, scope } = await requireBookScope();
  if (scope.kind !== "district" || !isBookModuleAdmin(user)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ตั้งค่า" };
  }

  const parsed = settingSchema.safeParse({
    bookType: formData.get("bookType"),
    retentionYears: formData.get("retentionYears"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await upsertRetentionSetting(
    parsed.data.bookType,
    parsed.data.retentionYears,
  );

  revalidatePath(RETENTION_PATH);
  return { ok: true as const };
}
