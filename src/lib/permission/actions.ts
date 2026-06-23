"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  computeTravelDays,
  generatePermissionRefId,
} from "@/lib/permission/constants";
import {
  canApprovePermission,
  canManagePermissionSettings,
  getPermissionModuleFlags,
} from "@/lib/permission/permissions";
import {
  canViewPermissionRequest,
  getPermissionModulePermission,
  getPermissionModulePermissionByUserId,
  getPermissionRequest,
  getPermissionYear,
  getPersonSchoolId,
} from "@/lib/permission/queries";
import {
  permissionApproveSchema,
  permissionModulePermissionFormSchema,
  permissionRequestCreateSchema,
  permissionYearFormSchema,
} from "@/lib/permission/schemas";
import {
  requirePermissionScope,
  requirePermissionWriteAccess,
} from "@/lib/permission/scope";
import { db } from "@/lib/db";
import {
  permissionPermissions,
  permissionRequests,
  permissionYears,
  users,
} from "@/lib/db/schema";

const REQUESTS_PATH = "/modules/permission/requests";
const YEARS_PATH = "/modules/permission/years";
const PERMS_PATH = "/modules/permission/permissions";

async function requirePermissionSettingsAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPermissionModuleFlags(Number(session.user.id));
  if (!canManagePermissionSettings(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบขออนุญาตไปราชการ");
  }

  return session.user;
}

async function requirePermissionApproveAccess() {
  const ctx = await requirePermissionScope();
  if (!canApprovePermission(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์อนุมัติคำขอไปราชการ");
  }
  return ctx;
}

async function deactivateOtherPermissionYears(exceptId?: number) {
  const rows = await db.select({ id: permissionYears.id }).from(permissionYears);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(permissionYears)
      .set({ yearActive: false })
      .where(eq(permissionYears.id, row.id));
  }
}

export async function createPermissionRequest(formData: FormData) {
  const { user, scope } = await requirePermissionWriteAccess();

  const parsed = permissionRequestCreateSchema.safeParse({
    subject: formData.get("subject"),
    place: formData.get("place"),
    travelStart: formData.get("travelStart"),
    travelFinish: formData.get("travelFinish"),
    vehicle: formData.get("vehicle"),
    document: formData.get("document"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const travelDays = computeTravelDays(data.travelStart, data.travelFinish);
  if (travelDays < 1) {
    return { ok: false as const, message: "ช่วงวันไปราชการไม่ถูกต้อง" };
  }

  let schoolId: number | null = null;
  if (scope.kind === "school") {
    schoolId = scope.schoolId;
  } else {
    schoolId = await getPersonSchoolId(user.personId);
  }

  const [inserted] = await db
    .insert(permissionRequests)
    .values({
      personId: user.personId,
      refId: generatePermissionRefId(),
      schoolId,
      subject: data.subject,
      place: data.place,
      travelStart: data.travelStart,
      travelFinish: data.travelFinish,
      vehicle: data.vehicle,
      document: data.document,
    })
    .returning({ id: permissionRequests.id });

  revalidatePath(REQUESTS_PATH);
  redirect(`${REQUESTS_PATH}/${inserted.id}`);
}

export async function approvePermissionRequest(id: number, formData: FormData) {
  const { user, scope } = await requirePermissionApproveAccess();

  const request = await getPermissionRequest(id);
  if (!request) return { ok: false as const, message: "ไม่พบคำขอ" };
  if (!canViewPermissionRequest(request, scope, user.personId)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เข้าถึงคำขอนี้" };
  }
  if (request.grantStatus !== null) {
    return { ok: false as const, message: "คำขอนี้พิจารณาแล้ว" };
  }

  const parsed = permissionApproveSchema.safeParse({
    grantStatus: formData.get("grantStatus"),
    grantComment: formData.get("grantComment"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(permissionRequests)
    .set({
      grantStatus: parsed.data.grantStatus,
      grantComment: parsed.data.grantComment,
      grantPersonId: user.personId,
      grantDate: new Date(),
    })
    .where(eq(permissionRequests.id, id));

  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${id}`);
  redirect(`${REQUESTS_PATH}/${id}`);
}

function parseYearForm(formData: FormData) {
  const parsed = permissionYearFormSchema.safeParse({
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

export async function createPermissionYear(formData: FormData) {
  await requirePermissionSettingsAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherPermissionYears();

  try {
    await db.insert(permissionYears).values({
      budgetYear: data.budgetYear,
      yearActive: data.yearActive,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function updatePermissionYear(id: number, formData: FormData) {
  await requirePermissionSettingsAccess();
  const existing = await getPermissionYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูลปีงบประมาณ" };

  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherPermissionYears(id);

  try {
    await db
      .update(permissionYears)
      .set({
        budgetYear: data.budgetYear,
        yearActive: data.yearActive,
      })
      .where(eq(permissionYears.id, id));
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจซ้ำกับรายการอื่น" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function togglePermissionYearActive(id: number) {
  await requirePermissionSettingsAccess();
  const existing = await getPermissionYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) await deactivateOtherPermissionYears(id);

  await db
    .update(permissionYears)
    .set({ yearActive: nextActive })
    .where(eq(permissionYears.id, id));

  revalidatePath(YEARS_PATH);
  return { ok: true };
}

export async function deletePermissionYear(id: number) {
  await requirePermissionSettingsAccess();
  await db.delete(permissionYears).where(eq(permissionYears.id, id));
  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = permissionModulePermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
    officerPersonId: formData.get("officerPersonId"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

function toPermissionValues(data: {
  p1: boolean;
  p2: boolean;
  officerPersonId: string | null;
}) {
  return {
    p1: data.p1 ? 1 : 0,
    p2: data.p2 ? 1 : 0,
    officerPersonId: data.officerPersonId,
  };
}

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return Boolean(user && user.organizationType === "district");
}

export async function createPermissionModulePermission(formData: FormData) {
  await requirePermissionSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getPermissionModulePermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(permissionPermissions).values({
    userId,
    ...toPermissionValues(flags),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updatePermissionModulePermission(
  id: number,
  formData: FormData,
) {
  await requirePermissionSettingsAccess();
  const row = await getPermissionModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getPermissionModulePermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(permissionPermissions)
    .set({
      userId,
      ...toPermissionValues(flags),
    })
    .where(eq(permissionPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deletePermissionModulePermission(id: number) {
  await requirePermissionSettingsAccess();
  await db.delete(permissionPermissions).where(eq(permissionPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
