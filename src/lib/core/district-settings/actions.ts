"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { districtSettings } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import { districtSettingsFormSchema } from "@/lib/core/district-settings/schemas";

const ADMIN_DISTRICT_PATH = "/admin/district-settings";

export async function updateDistrictSettings(formData: FormData) {
  await requireSystemAdmin();

  const parsed = districtSettingsFormSchema.safeParse({
    officeName: formData.get("officeName"),
    officeCode: formData.get("officeCode"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { officeName, officeCode } = parsed.data;
  const existing = await getDistrictSettingsRow();

  try {
    if (existing) {
      await db
        .update(districtSettings)
        .set({
          officeName,
          officeCode,
          updatedAt: new Date(),
        })
        .where(eq(districtSettings.id, existing.id));
    } else {
      await db.insert(districtSettings).values({
        officeName,
        officeCode,
      });
    }
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(ADMIN_DISTRICT_PATH);
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/", "layout");

  return { ok: true as const };
}
