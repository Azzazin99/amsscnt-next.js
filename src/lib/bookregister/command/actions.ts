"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerCommands } from "@/lib/db/schema";
import {
  buildStoredCommandFileName,
  deleteCommandFileFromStorage,
  isAllowedCommandFileName,
  saveCommandFileToStorage,
} from "@/lib/bookregister/command/files";
import {
  allocateNextCommandNumber,
  getDistrictCommand,
} from "@/lib/bookregister/command/queries";
import {
  commandCreateSchema,
  commandUpdateSchema,
} from "@/lib/bookregister/command/schemas";
import {
  canDeleteCommandRecord,
  canDeleteDistrictRegisters,
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import {
  generateReceiveRefId,
  todayBangkokDateString,
} from "@/lib/bookregister/receive/ref-id";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";
import { BOOKREGISTER_REPORTS_CACHE_TAG } from "@/lib/bookregister/reports/cached-queries";

const COMMAND_PATH = "/modules/bookregister/command";

async function requireCommandAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  return { user: session.user, perms };
}

async function requireWriteAccess() {
  const ctx = await requireCommandAccess();
  if (!canWriteDistrictRegisters(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกทะเบียนคำสั่ง");
  }
  return ctx;
}

async function requireDeleteAccess() {
  const ctx = await requireCommandAccess();
  if (!canDeleteDistrictRegisters(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ลบทะเบียนคำสั่ง");
  }
  return ctx;
}

async function requireActiveCommandYear() {
  const activeYear = await getActiveDistrictYear();
  if (!activeYear || activeYear.startCommandNum <= 0) {
    return { ok: false as const, message: "ทะเบียนคำสั่งไม่เปิดใช้งาน" };
  }
  return { ok: true as const, activeYear };
}

function readBool(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "1" || value === "on" || value === "true";
}

async function handleCommandFileUpload(
  refId: string,
  formData: FormData,
  existingFileName: string | null,
) {
  const file = formData.get("attachment");
  const removeFile = readBool(formData, "removeAttachment");

  if (removeFile && existingFileName) {
    try {
      await deleteCommandFileFromStorage(existingFileName);
    } catch {
      // ignore missing file on disk
    }
    return { fileName: null as string | null };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { fileName: existingFileName };
  }

  if (!isAllowedCommandFileName(file.name)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }

  const storedName = buildStoredCommandFileName(refId, file.name);

  if (existingFileName && existingFileName !== storedName) {
    try {
      await deleteCommandFileFromStorage(existingFileName);
    } catch {
      // ignore
    }
  }

  await saveCommandFileToStorage(storedName, file);
  return { fileName: storedName };
}

export async function createDistrictCommand(formData: FormData) {
  const { user } = await requireWriteAccess();
  const yearCheck = await requireActiveCommandYear();
  if (!yearCheck.ok) return yearCheck;

  const parsed = commandCreateSchema.safeParse({
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { activeYear } = yearCheck;
  const registerNumber = await allocateNextCommandNumber(activeYear.year);
  const refId = generateReceiveRefId();
  const bookNo = `${registerNumber}/${activeYear.year}`;
  const registerDate = todayBangkokDateString();

  let fileName: string | null = null;
  try {
    const fileResult = await handleCommandFileUpload(refId, formData, null);
    fileName = fileResult.fileName;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ",
    };
  }

  const [inserted] = await db
    .insert(registerCommands)
    .values({
      schoolId: null,
      year: activeYear.year,
      registerNumber,
      bookNo,
      signdate: parsed.data.signdate,
      subject: parsed.data.subject.trim(),
      comment: parsed.data.comment?.trim() || null,
      registerDate,
      refId,
      officerId: Number(user.id),
      fileName,
    })
    .returning({ id: registerCommands.id });

  revalidatePath(COMMAND_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const, id: inserted?.id };
}

export async function updateDistrictCommand(id: number, formData: FormData) {
  const { user, perms } = await requireWriteAccess();
  const existing = await getDistrictCommand(id);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canEditCommandRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false,
      message: "ไม่มีสิทธิ์แก้ไขรายการนี้ (หมดเวลาแก้ไขหรือไม่มีสิทธิ์)",
    };
  }

  const parsed = commandUpdateSchema.safeParse({
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  let fileName = existing.fileName;
  try {
    const fileResult = await handleCommandFileUpload(
      existing.refId,
      formData,
      existing.fileName,
    );
    fileName = fileResult.fileName;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ",
    };
  }

  try {
    await db
      .update(registerCommands)
      .set({
        signdate: parsed.data.signdate,
        subject: parsed.data.subject.trim(),
        comment: parsed.data.comment?.trim() || null,
        fileName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(registerCommands.id, id),
          isNull(registerCommands.schoolId),
          isNull(registerCommands.deletedAt),
        ),
      );
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(COMMAND_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  revalidatePath(`${COMMAND_PATH}/${id}`);
  revalidatePath(`${COMMAND_PATH}/${id}/edit`);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}

export async function deleteDistrictCommand(id: number) {
  const { user, perms } = await requireDeleteAccess();
  const existing = await getDistrictCommand(id);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canDeleteCommandRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false,
      message: "ไม่มีสิทธิ์ลบรายการนี้ (หมดเวลาลบหรือไม่ใช่ผู้บันทึก)",
    };
  }

  if (existing.fileName) {
    try {
      await deleteCommandFileFromStorage(existing.fileName);
    } catch {
      // ignore
    }
  }

  await db
    .update(registerCommands)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(registerCommands.id, id),
        isNull(registerCommands.schoolId),
        isNull(registerCommands.deletedAt),
      ),
    );

  revalidatePath(COMMAND_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}
