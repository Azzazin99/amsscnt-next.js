"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerOfficeNumbers } from "@/lib/db/schema";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import { getDistrictOfficeNumberRow } from "@/lib/bookregister/office-no/queries";
import { z } from "zod";

const OFFICE_NO_PATH = "/modules/bookregister/office-no";
const SEND_PATH = "/modules/bookregister/send";

const officeNoSchema = z.object({
  officeNo: z
    .string()
    .min(1, "กรุณากรอกเลขที่สำนักงาน")
    .max(200, "เลขที่สำนักงานยาวเกินไป"),
});

async function requireOfficeNoAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  return session.user;
}

export async function upsertDistrictOfficeNo(formData: FormData) {
  await requireOfficeNoAccess();

  const parsed = officeNoSchema.safeParse({
    officeNo: formData.get("officeNo"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const officeNo = parsed.data.officeNo.trim();
  const existing = await getDistrictOfficeNumberRow();
  const recDate = todayBangkokDateString();

  try {
    if (existing) {
      await db
        .update(registerOfficeNumbers)
        .set({
          officeNo,
          recDate,
        })
        .where(
          eq(registerOfficeNumbers.id, existing.id),
        );
    } else {
      await db.insert(registerOfficeNumbers).values({
        officeNo,
        schoolCode: null,
        recDate,
      });
    }
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(OFFICE_NO_PATH);
  revalidatePath(SEND_PATH);
  revalidatePath(`${SEND_PATH}/new`);
  return { ok: true as const };
}
