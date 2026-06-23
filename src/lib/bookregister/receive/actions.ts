"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { registerReceives } from "@/lib/db/schema";
import {
  booleanFromSecretLevel,
  normalizeSecretLevel,
  normalizeUrgencyLevel,
} from "@/lib/bookregister/regulation-fields";
import {
  canDeleteRegisters,
  canModifyOwnReceiveRecord,
  isBookregisterModuleAdmin,
} from "@/lib/bookregister/permissions";
import { canWriteRegisters } from "@/lib/bookregister/scope";
import {
  allocateNextRegisterNumber,
  getDistrictReceive,
  getLastBookNoPrefixForSchool,
  getSchoolNameByCode,
} from "@/lib/bookregister/receive/queries";
import { BOOKREGISTER_REPORTS_CACHE_TAG } from "@/lib/bookregister/reports/cached-queries";
import {
  generateReceiveRefId,
  todayBangkokDateString,
} from "@/lib/bookregister/receive/ref-id";
import { receiveFormSchema, receiveSchoolFormSchema } from "@/lib/bookregister/receive/schemas";
import {
  requireBookregisterScope,
  requireBookregisterWriteScope,
  scopeReceiveSchoolCondition,
} from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";

const RECEIVE_PATH = "/modules/bookregister/receive";

async function requireActiveReceiveYear(scope: Awaited<
  ReturnType<typeof requireBookregisterScope>
>["scope"]) {
  const activeYear = await getActiveRegisterYear(scope);
  if (!activeYear || activeYear.startReceiveNum <= 0) {
    return { ok: false as const, message: "ทะเบียนรับไม่เปิดใช้งาน" };
  }
  return { ok: true as const, activeYear };
}

async function resolveBookFrom(
  scope: Awaited<ReturnType<typeof requireBookregisterScope>>["scope"],
  schoolCode: string | undefined,
  bookFrom: string | undefined,
) {
  if (scope.kind === "school") {
    return bookFrom?.trim() || null;
  }
  const code = schoolCode?.trim() ?? "";
  if (code && code !== "other") {
    return getSchoolNameByCode(code);
  }
  return bookFrom?.trim() || null;
}

function parseReceiveForm(
  formData: FormData,
  scope: Awaited<ReturnType<typeof requireBookregisterScope>>["scope"],
) {
  if (scope.kind === "school") {
    const parsed = receiveSchoolFormSchema.safeParse({
      bookFrom: formData.get("bookFrom"),
      bookNo: formData.get("bookNo"),
      signdate: formData.get("signdate"),
      bookTo: formData.get("bookTo"),
      subject: formData.get("subject"),
      operation: formData.get("operation") || undefined,
      comment: formData.get("comment") || undefined,
      urgencyLevel: formData.get("urgencyLevel") ?? "1",
      secretLevel: formData.get("secretLevel") ?? "0",
      recordType: formData.get("recordType") ?? "1",
    });
    if (!parsed.success) {
      return {
        ok: false as const,
        message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
      };
    }
    return {
      ok: true as const,
      data: { ...parsed.data, schoolCode: undefined, workgroupId: undefined },
    };
  }

  const parsed = receiveFormSchema.safeParse({
    schoolCode: formData.get("schoolCode") || undefined,
    bookFrom: formData.get("bookFrom") || undefined,
    bookNo: formData.get("bookNo"),
    signdate: formData.get("signdate"),
    bookTo: formData.get("bookTo"),
    subject: formData.get("subject"),
    workgroupId: formData.get("workgroupId") || undefined,
    operation: formData.get("operation") || undefined,
    comment: formData.get("comment") || undefined,
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
    recordType: formData.get("recordType") ?? "1",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

function regulationFields(data: {
  urgencyLevel: number;
  secretLevel: number;
}) {
  const secretLevel = normalizeSecretLevel(data.secretLevel);
  return {
    urgencyLevel: normalizeUrgencyLevel(data.urgencyLevel),
    secretLevel,
    secret: booleanFromSecretLevel(secretLevel),
  };
}

export async function createDistrictReceive(formData: FormData) {
  const { user, perms, scope } = await requireBookregisterWriteScope();
  const yearCheck = await requireActiveReceiveYear(scope);
  if (!yearCheck.ok) return { ok: false, message: yearCheck.message };

  const parsed = parseReceiveForm(formData, scope);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const bookFrom = await resolveBookFrom(
    scope,
    parsed.data.schoolCode,
    parsed.data.bookFrom,
  );
  if (!bookFrom) {
    return { ok: false, message: "กรุณาระบุหน่วยงานที่ส่ง" };
  }

  const { activeYear } = yearCheck;
  const registerNumber = await allocateNextRegisterNumber(
    scope,
    activeYear.year,
  );
  const refId = generateReceiveRefId();
  const registerDate = todayBangkokDateString();
  const reg = regulationFields(parsed.data);

  let insertedId: number;
  try {
    const [inserted] = await db
      .insert(registerReceives)
      .values({
        schoolId: scope.kind === "school" ? scope.schoolId : null,
        year: activeYear.year,
        registerNumber,
        bookNo: parsed.data.bookNo.trim(),
        signdate: parsed.data.signdate,
        bookFrom,
        bookTo: parsed.data.bookTo.trim(),
        subject: parsed.data.subject.trim(),
        operation: parsed.data.operation?.trim() || null,
        comment: parsed.data.comment?.trim() || "เอกสารกระดาษ",
        registerDate,
        refId,
        officerId: Number(user.id),
        workgroupId:
          scope.kind === "school" ? null : parsed.data.workgroupId ?? null,
        recordType: parsed.data.recordType,
        bookLink: 0,
        source: "external",
        ...reg,
      })
      .returning({ id: registerReceives.id });

    if (!inserted) {
      return { ok: false, message: "ไม่สามารถบันทึกได้ — กรุณาลองใหม่" };
    }
    insertedId = inserted.id;
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — กรุณาลองใหม่" };
  }

  revalidatePath(RECEIVE_PATH);
  revalidatePath(`${RECEIVE_PATH}/${insertedId}/edit`);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const, id: insertedId };
}

export async function fetchReceiveBookNoPrefix(schoolCode: string) {
  const { scope } = await requireBookregisterScope();
  if (scope.kind === "school") {
    return { ok: true as const, prefix: "" };
  }
  const code = schoolCode.trim();
  if (!code || code === "other") {
    return { ok: true as const, prefix: "" };
  }
  const name = await getSchoolNameByCode(code);
  if (!name) {
    return { ok: false as const, message: "ไม่พบโรงเรียน" };
  }
  const prefix = await getLastBookNoPrefixForSchool(name);
  return { ok: true as const, prefix };
}

export async function updateDistrictReceive(id: number, formData: FormData) {
  const { user, perms, scope } = await requireBookregisterWriteScope();
  const existing = await getDistrictReceive(id, scope);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canModifyOwnReceiveRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false,
      message: "ไม่มีสิทธิ์แก้ไขรายการนี้ (หมดเวลาแก้ไขหรือไม่ใช่ผู้บันทึก)",
    };
  }

  const parsed = parseReceiveForm(formData, scope);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const bookFrom = await resolveBookFrom(
    scope,
    parsed.data.schoolCode,
    parsed.data.bookFrom,
  );
  if (!bookFrom) {
    return { ok: false, message: "กรุณาระบุหน่วยงานที่ส่ง" };
  }

  const reg = regulationFields(parsed.data);
  const fromBookModule = existing.bookLink > 0;

  try {
    await db
      .update(registerReceives)
      .set({
        bookNo: parsed.data.bookNo.trim(),
        signdate: parsed.data.signdate,
        bookFrom,
        bookTo: parsed.data.bookTo.trim(),
        subject: parsed.data.subject.trim(),
        operation: parsed.data.operation?.trim() || null,
        comment: parsed.data.comment?.trim() || null,
        workgroupId:
          scope.kind === "school" ? null : parsed.data.workgroupId ?? null,
        ...reg,
        ...(fromBookModule ? {} : { recordType: parsed.data.recordType }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(registerReceives.id, id),
          scopeReceiveSchoolCondition(scope),
          isNull(registerReceives.deletedAt),
        ),
      );
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(RECEIVE_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}

export async function deleteDistrictReceive(id: number) {
  const { user, perms, scope } = await requireBookregisterScope();
  if (!canDeleteRegisters(user, perms, scope)) {
    throw new Error("ไม่มีสิทธิ์ลบทะเบียนรับ");
  }

  const existing = await getDistrictReceive(id, scope);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canModifyOwnReceiveRecord(
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

  await db
    .update(registerReceives)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(registerReceives.id, id),
        scopeReceiveSchoolCondition(scope),
        isNull(registerReceives.deletedAt),
      ),
    );

  revalidatePath(RECEIVE_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}

export async function getReceiveFormContext() {
  const { user, perms, scope } = await requireBookregisterScope();
  return {
    canWrite: canWriteRegisters(user, perms, scope),
    isModuleAdmin: isBookregisterModuleAdmin(user),
    userId: Number(user.id),
    scope,
  };
}
