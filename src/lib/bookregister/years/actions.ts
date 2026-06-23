"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerYears } from "@/lib/db/schema";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { yearFormSchema } from "@/lib/bookregister/years/schemas";
import {
  deactivateOtherDistrictYears,
  getDistrictYear,
} from "@/lib/bookregister/years/queries";

async function requireDistrictYearAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการปีทะเบียน");
  }

  return session.user;
}

function parseYearForm(formData: FormData) {
  const parsed = yearFormSchema.safeParse({
    year: formData.get("year"),
    yearActive: formData.get("yearActive"),
    startReceiveNum: formData.get("startReceiveNum"),
    startSendNum: formData.get("startSendNum"),
    startCommandNum: formData.get("startCommandNum"),
    startCertificateNum: formData.get("startCertificateNum"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  return { ok: true as const, data: parsed.data };
}

export async function createDistrictYear(formData: FormData) {
  await requireDistrictYearAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;

  if (data.yearActive) {
    await deactivateOtherDistrictYears();
  }

  try {
    await db.insert(registerYears).values({
      year: data.year,
      schoolId: null,
      yearActive: data.yearActive,
      startReceiveNum: data.startReceiveNum,
      startSendNum: data.startSendNum,
      startCommandNum: data.startCommandNum,
      startCertificateNum: data.startCertificateNum,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath("/modules/bookregister/years");
  redirect("/modules/bookregister/years");
}

export async function updateDistrictYear(id: number, formData: FormData) {
  await requireDistrictYearAccess();
  const existing = await getDistrictYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูลปีทะเบียน" };

  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;

  if (data.yearActive) {
    await deactivateOtherDistrictYears(id);
  }

  try {
    await db
      .update(registerYears)
      .set({
        year: data.year,
        yearActive: data.yearActive,
        startReceiveNum: data.startReceiveNum,
        startSendNum: data.startSendNum,
        startCommandNum: data.startCommandNum,
        startCertificateNum: data.startCertificateNum,
      })
      .where(eq(registerYears.id, id));
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจซ้ำกับรายการอื่น" };
  }

  revalidatePath("/modules/bookregister/years");
  redirect("/modules/bookregister/years");
}

export async function toggleDistrictYearActive(id: number) {
  await requireDistrictYearAccess();
  const existing = await getDistrictYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) {
    await deactivateOtherDistrictYears(id);
  }

  await db
    .update(registerYears)
    .set({ yearActive: nextActive })
    .where(eq(registerYears.id, id));

  revalidatePath("/modules/bookregister/years");
  return { ok: true };
}

export async function deleteDistrictYear(id: number) {
  await requireDistrictYearAccess();
  await db
    .delete(registerYears)
    .where(and(eq(registerYears.id, id), isNull(registerYears.schoolId)));

  revalidatePath("/modules/bookregister/years");
  redirect("/modules/bookregister/years");
}
