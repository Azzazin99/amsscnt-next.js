"use server";

import { insertAndGetId } from "../db/helpers";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { currentWorkflowStatus } from "@/lib/leave/constants";
import {
  canApproveLeaveStep,
  canManageLeaveSettings,
  getLeavePermissions,
} from "@/lib/leave/permissions";
import {
  canViewLeaveCancellation,
  canViewLeaveRequest,
  getLeaveCancellation,
  getLeaveCancellationBySourceRequestId,
  getLeavePermissionByUserId,
  getLeaveModulePermission,
  getLeavePersonSettings,
  getLeaveRequest,
  getLeaveYear,
  getActiveLeaveYear,
  getPersonSchoolId,
  getPersonSex,
  listLeaveRequestFiles,
  canMutateOwnLeaveRequest,
} from "@/lib/leave/queries";
import {
  leavePermissionFormSchema,
  leaveCancellationCreateSchema,
  leaveRequestCreateSchema,
  leaveStepApproveSchema,
  leaveYearFormSchema,
  leaveGrantPersonFormSchema,
  leaveCollectRowSchema,
  schoolGrantDeputyFormSchema,
} from "@/lib/leave/schemas";
import { requireLeaveScope, requireLeaveWriteAccess } from "@/lib/leave/scope";
import { saveLeaveFileToStorage, buildStoredLeaveFileName, deleteLeaveFileFromStorage } from "@/lib/leave/files";
import {
  buildLeaveStatisticsBase,
  buildLeaveStatisticsSnapshot,
  getLastApprovedLeaveSameType,
} from "@/lib/leave/form-context";
import { getQuotaSummary, syncQuotaBalance, validateQuotaForRequest } from "@/lib/leave/quota";
import { upsertLeavePersonSettings } from "@/lib/leave/grant-persons-queries";
import { upsertLeaveCollectRow } from "@/lib/leave/collection-queries";
import {
  assertDeputyDistrictUser,
  getSchoolGrantDeputy,
} from "@/lib/leave/school-grant-queries";
import { budgetYearFromIsoDate } from "@/lib/leave/regulation/fiscal-year";
import type { LeaveTypeId } from "@/lib/leave/regulation/types";
import { isLeaveTypeId } from "@/lib/leave/regulation/types";
import { validateLeaveAttachment } from "@/lib/leave/regulation/attachments";
import {
  computeLeaveTotal,
  validateLeaveCancellationInput,
  validateLeaveRequestInput,
} from "@/lib/leave/regulation/validation";
import { db } from "@/lib/db";
import {
  leaveCancellations,
  leavePermissions,
  leaveRequestFiles,
  leaveRequests,
  leaveYears,
  users,
} from "@/lib/db/schema";

const REQUESTS_PATH = "/modules/leave/requests";
const JOB_HANDOVER_PATH = "/modules/leave/job-handover";
const CANCELLATIONS_PATH = "/modules/leave/cancellations";
const YEARS_PATH = "/modules/leave/years";
const PERMS_PATH = "/modules/leave/permissions";
const GRANT_PERSONS_PATH = "/modules/leave/grant-persons";
const SCHOOL_GRANT_PATH = "/modules/leave/school-grant-persons";
const COLLECTION_PATH = "/modules/leave/collection";

async function requireLeaveSettingsAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getLeavePermissions(Number(session.user.id));
  if (!canManageLeaveSettings(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบลา");
  }

  return session.user;
}

async function requireLeaveApproveAccess() {
  const ctx = await requireLeaveScope();
  return ctx;
}

async function deactivateOtherLeaveYears(exceptId?: number) {
  const rows = await db.select({ id: leaveYears.id }).from(leaveYears);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(leaveYears)
      .set({ yearActive: false })
      .where(eq(leaveYears.id, row.id));
  }
}

export async function createLeaveRequest(formData: FormData) {
  const { user, scope } = await requireLeaveWriteAccess();

  const parsed = leaveRequestCreateSchema.safeParse({
    leaveType: formData.get("leaveType"),
    writeAt: formData.get("writeAt"),
    because: formData.get("because"),
    leaveStart: formData.get("leaveStart"),
    leaveFinish: formData.get("leaveFinish"),
    halfDayPeriod: formData.get("halfDayPeriod"),
    contact: formData.get("contact"),
    contactTel: formData.get("contactTel"),
    noComment: formData.get("noComment"),
    grantPersonSelected: formData.get("grantPersonSelected"),
    jobPersonId: formData.get("jobPersonId"),
    documentName: formData.get("documentName"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const personSex = await getPersonSex(user.personId);

  const leaveTotal = computeLeaveTotal(
    data.leaveStart,
    data.leaveFinish,
    data.halfDayPeriod,
  );

  const quotaSummary = await getQuotaSummary(
    user.personId,
    data.leaveType,
    data.leaveStart,
  );

  const validationErr = validateLeaveRequestInput({
    leaveType: data.leaveType,
    leaveStart: data.leaveStart,
    leaveFinish: data.leaveFinish,
    halfDayPeriod: data.halfDayPeriod,
    remainingQuota: quotaSummary?.unlimited
      ? null
      : (quotaSummary?.remaining ?? null),
    personSex,
  });
  if (validationErr) {
    return { ok: false as const, message: validationErr };
  }

  const quotaErr = await validateQuotaForRequest(
    user.personId,
    data.leaveType,
    data.leaveStart,
    leaveTotal,
  );
  if (quotaErr) {
    return { ok: false as const, message: quotaErr };
  }

  const attachment = formData.get("attachment");
  const hasFile = attachment instanceof File && attachment.size > 0;
  const attachmentErr = validateLeaveAttachment({
    leaveType: data.leaveType,
    leaveTotal,
    hasFile,
  });
  if (attachmentErr) {
    return { ok: false as const, message: attachmentErr };
  }

  let schoolId: number | null = null;
  if (scope.kind === "school") {
    schoolId = scope.schoolId;
  } else {
    schoolId = await getPersonSchoolId(user.personId);
  }

  const lastLeave = await getLastApprovedLeaveSameType(
    user.personId,
    data.leaveType,
  );
  const statsBase = await buildLeaveStatisticsBase(user.personId, data.leaveStart);
  const statsSnapshot = buildLeaveStatisticsSnapshot(
    statsBase.agoByType,
    data.leaveType,
    leaveTotal,
    statsBase.relaxCollect,
    statsBase.relaxThisYear,
  );
  const sickRow = statsSnapshot.rows.find((r) => r.leaveType === 1)!;
  const privacyRow = statsSnapshot.rows.find((r) => r.leaveType === 2)!;
  const birthRow = statsSnapshot.rows.find((r) => r.leaveType === 3)!;
  const relaxRow = statsSnapshot.rows.find((r) => r.leaveType === 4)!;

  const insertedId = await insertAndGetId(leaveRequests, {
      personId: user.personId,
      schoolId,
      leaveType: data.leaveType,
      writeAt: data.writeAt,
      because: data.because,
      leaveStart: data.leaveStart,
      leaveFinish: data.leaveFinish,
      halfDayPeriod: data.halfDayPeriod,
      leaveTotal: leaveTotal,
      lastLeaveStart: lastLeave?.leaveStart ?? null,
      lastLeaveFinish: lastLeave?.leaveFinish ?? null,
      lastLeaveTotal: lastLeave?.leaveTotal ?? null,
      sickAgo: sickRow.ago,
      sickThis: sickRow.thisTime,
      sickTotal: sickRow.total,
      privacyAgo: privacyRow.ago,
      privacyThis: privacyRow.thisTime,
      privacyTotal: privacyRow.total,
      birthAgo: birthRow.ago,
      birthThis: birthRow.thisTime,
      birthTotal: birthRow.total,
      relaxAgo: relaxRow.ago,
      relaxThis: relaxRow.thisTime,
      relaxTotal: relaxRow.total,
      relaxCollect: statsSnapshot.relaxCollect,
      relaxThisYear: statsSnapshot.relaxThisYear,
      contact: data.contact,
      contactTel: data.contactTel,
      documentName: data.documentName,
      noComment: data.noComment,
      grantPersonSelected: data.grantPersonSelected,
      jobPersonId: data.jobPersonId,
    });
  const inserted = { id: insertedId };

  if (hasFile && attachment instanceof File) {
    try {
      const storedName = buildStoredLeaveFileName(inserted.id, attachment.name);
      const saved = await saveLeaveFileToStorage(storedName, attachment);
      await db.insert(leaveRequestFiles).values({
        requestId: inserted.id,
        fileName: storedName,
        fileDes: attachment.name,
        fileSize: saved.size,
      });
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "อัปโหลดไฟล์ไม่สำเร็จ",
      };
    }
  }

  revalidatePath(REQUESTS_PATH);
  redirect(`${REQUESTS_PATH}/${inserted.id}`);
}

export async function updateLeaveRequest(id: number, formData: FormData) {
  const { user } = await requireLeaveWriteAccess();

  const existing = await getLeaveRequest(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบคำขอลา" };
  }
  if (!canMutateOwnLeaveRequest(existing, user.personId)) {
    return { ok: false as const, message: "ไม่สามารถแก้ไขคำขอนี้ได้" };
  }

  const parsed = leaveRequestCreateSchema.safeParse({
    leaveType: formData.get("leaveType"),
    writeAt: formData.get("writeAt"),
    because: formData.get("because"),
    leaveStart: formData.get("leaveStart"),
    leaveFinish: formData.get("leaveFinish"),
    halfDayPeriod: formData.get("halfDayPeriod"),
    contact: formData.get("contact"),
    contactTel: formData.get("contactTel"),
    noComment: formData.get("noComment"),
    grantPersonSelected: formData.get("grantPersonSelected"),
    jobPersonId: formData.get("jobPersonId"),
    documentName: formData.get("documentName"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const personSex = await getPersonSex(user.personId);

  const leaveTotal = computeLeaveTotal(
    data.leaveStart,
    data.leaveFinish,
    data.halfDayPeriod,
  );

  const quotaSummary = await getQuotaSummary(
    user.personId,
    data.leaveType,
    data.leaveStart,
  );

  const validationErr = validateLeaveRequestInput({
    leaveType: data.leaveType,
    leaveStart: data.leaveStart,
    leaveFinish: data.leaveFinish,
    halfDayPeriod: data.halfDayPeriod,
    remainingQuota: quotaSummary?.unlimited
      ? null
      : (quotaSummary?.remaining ?? null),
    personSex,
  });
  if (validationErr) {
    return { ok: false as const, message: validationErr };
  }

  const quotaErr = await validateQuotaForRequest(
    user.personId,
    data.leaveType,
    data.leaveStart,
    leaveTotal,
  );
  if (quotaErr) {
    return { ok: false as const, message: quotaErr };
  }

  const attachment = formData.get("attachment");
  const hasFile = attachment instanceof File && attachment.size > 0;
  const existingFiles = await listLeaveRequestFiles(id);
  const attachmentErr = validateLeaveAttachment({
    leaveType: data.leaveType,
    leaveTotal,
    hasFile: hasFile || existingFiles.length > 0,
  });
  if (attachmentErr) {
    return { ok: false as const, message: attachmentErr };
  }

  const lastLeave = await getLastApprovedLeaveSameType(
    user.personId,
    data.leaveType,
  );
  const statsBase = await buildLeaveStatisticsBase(user.personId, data.leaveStart);
  const statsSnapshot = buildLeaveStatisticsSnapshot(
    statsBase.agoByType,
    data.leaveType,
    leaveTotal,
    statsBase.relaxCollect,
    statsBase.relaxThisYear,
  );
  const sickRow = statsSnapshot.rows.find((r) => r.leaveType === 1)!;
  const privacyRow = statsSnapshot.rows.find((r) => r.leaveType === 2)!;
  const birthRow = statsSnapshot.rows.find((r) => r.leaveType === 3)!;
  const relaxRow = statsSnapshot.rows.find((r) => r.leaveType === 4)!;

  await db
    .update(leaveRequests)
    .set({
      leaveType: data.leaveType,
      writeAt: data.writeAt,
      because: data.because,
      leaveStart: data.leaveStart,
      leaveFinish: data.leaveFinish,
      halfDayPeriod: data.halfDayPeriod,
      leaveTotal,
      lastLeaveStart: lastLeave?.leaveStart ?? null,
      lastLeaveFinish: lastLeave?.leaveFinish ?? null,
      lastLeaveTotal: lastLeave?.leaveTotal ?? null,
      sickAgo: sickRow.ago,
      sickThis: sickRow.thisTime,
      sickTotal: sickRow.total,
      privacyAgo: privacyRow.ago,
      privacyThis: privacyRow.thisTime,
      privacyTotal: privacyRow.total,
      birthAgo: birthRow.ago,
      birthThis: birthRow.thisTime,
      birthTotal: birthRow.total,
      relaxAgo: relaxRow.ago,
      relaxThis: relaxRow.thisTime,
      relaxTotal: relaxRow.total,
      relaxCollect: statsSnapshot.relaxCollect,
      relaxThisYear: statsSnapshot.relaxThisYear,
      contact: data.contact,
      contactTel: data.contactTel,
      documentName: data.documentName,
      noComment: data.noComment,
      grantPersonSelected: data.grantPersonSelected,
      jobPersonId: data.jobPersonId,
    })
    .where(eq(leaveRequests.id, id));

  if (hasFile && attachment instanceof File) {
    for (const file of existingFiles) {
      try {
        await deleteLeaveFileFromStorage(file.fileName);
      } catch {
        // ignore missing file on disk
      }
    }
    await db
      .delete(leaveRequestFiles)
      .where(eq(leaveRequestFiles.requestId, id));

    try {
      const storedName = buildStoredLeaveFileName(id, attachment.name);
      const saved = await saveLeaveFileToStorage(storedName, attachment);
      await db.insert(leaveRequestFiles).values({
        requestId: id,
        fileName: storedName,
        fileDes: attachment.name,
        fileSize: saved.size,
      });
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "อัปโหลดไฟล์ไม่สำเร็จ",
      };
    }
  }

  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${id}`);
  redirect(`${REQUESTS_PATH}/${id}`);
}

export async function deleteLeaveRequest(id: number) {
  const { user } = await requireLeaveWriteAccess();

  const existing = await getLeaveRequest(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบคำขอลา" };
  }
  if (!canMutateOwnLeaveRequest(existing, user.personId)) {
    return { ok: false as const, message: "ไม่สามารถลบคำขอนี้ได้" };
  }

  const files = await listLeaveRequestFiles(id);
  for (const file of files) {
    try {
      await deleteLeaveFileFromStorage(file.fileName);
    } catch {
      // ignore missing file on disk
    }
  }
  await db.delete(leaveRequestFiles).where(eq(leaveRequestFiles.requestId, id));
  await db.delete(leaveRequests).where(eq(leaveRequests.id, id));

  revalidatePath(REQUESTS_PATH);
  redirect(REQUESTS_PATH);
}

export async function acceptJobHandover(
  requestId: number,
): Promise<{ ok: boolean; message?: string }> {
  const { user } = await requireLeaveScope();

  const [row] = await db
    .select({
      jobPersonId: leaveRequests.jobPersonId,
      jobPersonSigned: leaveRequests.jobPersonSigned,
      commanderGrant: leaveRequests.commanderGrant,
    })
    .from(leaveRequests)
    .where(eq(leaveRequests.id, requestId))
    .limit(1);

  if (!row) {
    return { ok: false, message: "ไม่พบคำขอลา" };
  }
  if (!row.jobPersonId || row.jobPersonId !== user.personId) {
    return { ok: false, message: "ไม่มีสิทธิ์รับมอบงานคำขอนี้" };
  }
  if (row.jobPersonSigned) {
    return { ok: false, message: "รับมอบงานแล้ว" };
  }
  if (row.commanderGrant !== null) {
    return { ok: false, message: "คำขอนี้พิจารณาเสร็จแล้ว" };
  }

  await db
    .update(leaveRequests)
    .set({ jobPersonSigned: true })
    .where(eq(leaveRequests.id, requestId));

  revalidatePath(JOB_HANDOVER_PATH);
  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${requestId}`);

  return { ok: true };
}

export async function approveLeaveRequest(id: number, formData: FormData) {
  return approveLeaveStep(id, formData);
}

export async function approveLeaveStep(id: number, formData: FormData) {
  const { user, scope } = await requireLeaveApproveAccess();

  const request = await getLeaveRequest(id);
  if (!request) return { ok: false as const, message: "ไม่พบคำขอลา" };
  if (!canViewLeaveRequest(request, scope, user.personId)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เข้าถึงคำขอนี้" };
  }

  const perms = await getLeavePermissions(Number(user.id));
  const signers = await getLeavePersonSettings(request.personId);
  const approveOptions = {
    isSchoolPersonnelRequest: request.schoolId != null,
  };

  const workflowState = {
    schoolId: request.schoolId,
    groupDate: request.groupDate,
    groupDate2: request.groupDate2,
    commanderGrant: request.commanderGrant,
  };
  const status = currentWorkflowStatus(workflowState);

  const parsed = leaveStepApproveSchema.safeParse({
    step: formData.get("step") ?? status,
    grant: formData.get("grant") ?? formData.get("commanderGrant"),
    comment: formData.get("comment") ?? formData.get("commanderComment"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { step, grant, comment } = parsed.data;

  if (status === "approved" || status === "rejected") {
    return { ok: false as const, message: "คำขอนี้พิจารณาแล้ว" };
  }

  if (step !== status) {
    return { ok: false as const, message: "ขั้นตอนการพิจารณาไม่ตรงกับสถานะปัจจุบัน" };
  }

  if (!canApproveLeaveStep(user, perms, step, signers, approveOptions)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์พิจารณาขั้นตอนนี้" };
  }

  const now = new Date();

  if (grant === 0) {
    await db
      .update(leaveRequests)
      .set({
        commanderGrant: 0,
        commanderComment: comment,
        commanderSignPersonId: user.personId,
        grantDate: now,
      })
      .where(eq(leaveRequests.id, id));
  } else if (step === "group") {
    await db
      .update(leaveRequests)
      .set({
        groupComment: comment,
        groupSignPersonId: user.personId,
        groupDate: now,
      })
      .where(eq(leaveRequests.id, id));
  } else if (step === "group2") {
    await db
      .update(leaveRequests)
      .set({
        groupComment2: comment,
        groupSign2PersonId: user.personId,
        groupDate2: now,
        commanderGrant: 1,
        commanderComment: comment,
        commanderSignPersonId: user.personId,
        grantDate: now,
      })
      .where(eq(leaveRequests.id, id));

    if (isLeaveTypeId(request.leaveType)) {
      const budgetYear = budgetYearFromIsoDate(request.leaveStart);
      await syncQuotaBalance(
        request.personId,
        budgetYear,
        request.leaveType as LeaveTypeId,
      );
    }
  } else {
    await db
      .update(leaveRequests)
      .set({
        commanderGrant: 1,
        commanderComment: comment,
        commanderSignPersonId: user.personId,
        grantDate: now,
      })
      .where(eq(leaveRequests.id, id));

    if (isLeaveTypeId(request.leaveType)) {
      const budgetYear = budgetYearFromIsoDate(request.leaveStart);
      await syncQuotaBalance(
        request.personId,
        budgetYear,
        request.leaveType as LeaveTypeId,
      );
    }
  }

  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${id}`);
  redirect(`${REQUESTS_PATH}/${id}`);
}

export async function createLeaveCancellation(formData: FormData) {
  const { user } = await requireLeaveWriteAccess();

  const parsed = leaveCancellationCreateSchema.safeParse({
    sourceRequestId: formData.get("sourceRequestId"),
    writeAt: formData.get("writeAt"),
    because: formData.get("because"),
    cancelStart: formData.get("cancelStart"),
    cancelFinish: formData.get("cancelFinish"),
    noComment: formData.get("noComment"),
    grantPersonSelected: formData.get("grantPersonSelected"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const source = await getLeaveRequest(data.sourceRequestId);
  if (!source) {
    return { ok: false as const, message: "ไม่พบคำขอลาที่อ้างอิง" };
  }
  if (source.personId !== user.personId) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ยกเลิกคำขอลานี้" };
  }
  if (source.commanderGrant !== 1) {
    return { ok: false as const, message: "ยกเลิกได้เฉพาะคำขอลาที่อนุมัติแล้ว" };
  }

  const existing = await getLeaveCancellationBySourceRequestId(source.id);
  if (existing) {
    return {
      ok: false as const,
      message: "คำขอลานี้มีคำขอยกเลิกแล้ว",
    };
  }

  const cancelTotal = computeLeaveTotal(
    data.cancelStart,
    data.cancelFinish,
    null,
  );

  const validationErr = validateLeaveCancellationInput({
    permissionStart: source.leaveStart,
    permissionFinish: source.leaveFinish,
    permissionTotal: source.leaveTotal,
    cancelStart: data.cancelStart,
    cancelFinish: data.cancelFinish,
    cancelTotal,
  });
  if (validationErr) {
    return { ok: false as const, message: validationErr };
  }

  const insertedId = await insertAndGetId(leaveCancellations, {
      personId: user.personId,
      sourceRequestId: source.id,
      leaveType: source.leaveType,
      writeAt: data.writeAt,
      permissionStart: source.leaveStart,
      permissionFinish: source.leaveFinish,
      permissionTotal: source.leaveTotal,
      because: data.because,
      cancelStart: data.cancelStart,
      cancelFinish: data.cancelFinish,
      cancelTotal,
      noComment: data.noComment,
      grantPersonSelected: data.grantPersonSelected,
    });
  const inserted = { id: insertedId };

  revalidatePath(CANCELLATIONS_PATH);
  revalidatePath(REQUESTS_PATH);
  redirect(`${CANCELLATIONS_PATH}/${inserted.id}`);
}

export async function approveLeaveCancellationStep(
  id: number,
  formData: FormData,
) {
  const { user, scope } = await requireLeaveApproveAccess();

  const cancellation = await getLeaveCancellation(id);
  if (!cancellation) {
    return { ok: false as const, message: "ไม่พบคำขอยกเลิกวันลา" };
  }
  if (!canViewLeaveCancellation(cancellation, scope, user.personId)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เข้าถึงคำขอนี้" };
  }

  const status = currentWorkflowStatus({
    schoolId: cancellation.schoolId,
    groupDate: cancellation.groupDate,
    commanderGrant: cancellation.commanderGrant,
  });
  if (status === "approved" || status === "rejected") {
    return { ok: false as const, message: "คำขอนี้พิจารณาแล้ว" };
  }

  const parsed = leaveStepApproveSchema.safeParse({
    step: formData.get("step") ?? status,
    grant: formData.get("grant") ?? formData.get("commanderGrant"),
    comment: formData.get("comment") ?? formData.get("commanderComment"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { step, grant, comment } = parsed.data;
  if (step !== status) {
    return { ok: false as const, message: "ขั้นตอนการพิจารณาไม่ตรงกับสถานะปัจจุบัน" };
  }

  const perms = await getLeavePermissions(Number(user.id));
  const signers = await getLeavePersonSettings(cancellation.personId);

  if (
    !canApproveLeaveStep(user, perms, step, signers, {
      isSchoolPersonnelRequest: cancellation.schoolId != null,
    })
  ) {
    return { ok: false as const, message: "ไม่มีสิทธิ์พิจารณาขั้นตอนนี้" };
  }

  const now = new Date();

  if (grant === 0) {
    await db
      .update(leaveCancellations)
      .set({
        commanderGrant: 0,
        commanderComment: comment,
        commanderSignPersonId: user.personId,
        grantDate: now,
      })
      .where(eq(leaveCancellations.id, id));
  } else if (step === "group") {
    await db
      .update(leaveCancellations)
      .set({
        groupComment: comment,
        groupSignPersonId: user.personId,
        groupDate: now,
      })
      .where(eq(leaveCancellations.id, id));
  } else {
    await db
      .update(leaveCancellations)
      .set({
        commanderGrant: 1,
        commanderComment: comment,
        commanderSignPersonId: user.personId,
        grantDate: now,
      })
      .where(eq(leaveCancellations.id, id));

    if (isLeaveTypeId(cancellation.leaveType)) {
      const budgetYear = budgetYearFromIsoDate(cancellation.cancelStart);
      await syncQuotaBalance(
        cancellation.personId,
        budgetYear,
        cancellation.leaveType as LeaveTypeId,
      );
    }
  }

  revalidatePath(CANCELLATIONS_PATH);
  revalidatePath(`${CANCELLATIONS_PATH}/${id}`);
  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${cancellation.sourceRequestId}`);
  redirect(`${CANCELLATIONS_PATH}/${id}`);
}

function parseYearForm(formData: FormData) {
  const parsed = leaveYearFormSchema.safeParse({
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

export async function createLeaveYear(formData: FormData) {
  await requireLeaveSettingsAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherLeaveYears();

  try {
    await db.insert(leaveYears).values({
      budgetYear: data.budgetYear,
      yearActive: data.yearActive,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function updateLeaveYear(id: number, formData: FormData) {
  await requireLeaveSettingsAccess();
  const existing = await getLeaveYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูลปีงบประมาณ" };

  const parsed = parseYearForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherLeaveYears(id);

  try {
    await db
      .update(leaveYears)
      .set({
        budgetYear: data.budgetYear,
        yearActive: data.yearActive,
      })
      .where(eq(leaveYears.id, id));
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจซ้ำกับรายการอื่น" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function toggleLeaveYearActive(id: number) {
  await requireLeaveSettingsAccess();
  const existing = await getLeaveYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) await deactivateOtherLeaveYears(id);

  await db
    .update(leaveYears)
    .set({ yearActive: nextActive })
    .where(eq(leaveYears.id, id));

  revalidatePath(YEARS_PATH);
  return { ok: true };
}

export async function deleteLeaveYear(id: number) {
  await requireLeaveSettingsAccess();
  await db.delete(leaveYears).where(eq(leaveYears.id, id));
  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = leavePermissionFormSchema.safeParse({
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

export async function createLeavePermission(formData: FormData) {
  await requireLeaveSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getLeavePermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(leavePermissions).values({
    userId,
    ...toPermissionValues(flags),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateLeavePermission(id: number, formData: FormData) {
  await requireLeaveSettingsAccess();
  const row = await getLeaveModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getLeavePermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(leavePermissions)
    .set({
      userId,
      ...toPermissionValues(flags),
    })
    .where(eq(leavePermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteLeavePermission(id: number) {
  await requireLeaveSettingsAccess();
  await db.delete(leavePermissions).where(eq(leavePermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateLeaveGrantPerson(
  personId: string,
  formData: FormData,
) {
  await requireLeaveSettingsAccess();

  const parsed = leaveGrantPersonFormSchema.safeParse({
    commentPersonId: formData.get("commentPersonId"),
    commentPerson2Id: formData.get("commentPerson2Id"),
    grantPersonId: formData.get("grantPersonId"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await upsertLeavePersonSettings({
    personId,
    ...parsed.data,
  });

  revalidatePath(GRANT_PERSONS_PATH);
  redirect(GRANT_PERSONS_PATH);
}

export async function createSchoolGrantDeputy(formData: FormData) {
  await requireLeaveSettingsAccess();

  const parsed = schoolGrantDeputyFormSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { userId } = parsed.data;
  if (!(await assertDeputyDistrictUser(userId))) {
    return {
      ok: false as const,
      message: "บุคลากรที่เลือกต้องเป็นรองผู้อำนวยการเขต",
    };
  }

  const existing = await getLeavePermissionByUserId(userId);
  if (existing) {
    return { ok: false as const, message: "บุคลากรนี้มีในระบบแล้ว" };
  }

  const [user] = await db
    .select({ personId: users.personId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.insert(leavePermissions).values({
    userId,
    p1: 0,
    p2: 1,
    officerPersonId: user?.personId ?? null,
  });

  revalidatePath(SCHOOL_GRANT_PATH);
  redirect(SCHOOL_GRANT_PATH);
}

export async function updateSchoolGrantDeputy(id: number, formData: FormData) {
  await requireLeaveSettingsAccess();
  const row = await getSchoolGrantDeputy(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = schoolGrantDeputyFormSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { userId } = parsed.data;
  if (!(await assertDeputyDistrictUser(userId))) {
    return {
      ok: false as const,
      message: "บุคลากรที่เลือกต้องเป็นรองผู้อำนวยการเขต",
    };
  }

  const other = await getLeavePermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "บุคลากรนี้มีในระบบแล้ว" };
  }

  const [user] = await db
    .select({ personId: users.personId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db
    .update(leavePermissions)
    .set({
      userId,
      p1: 0,
      p2: 1,
      officerPersonId: user?.personId ?? null,
    })
    .where(eq(leavePermissions.id, id));

  revalidatePath(SCHOOL_GRANT_PATH);
  redirect(SCHOOL_GRANT_PATH);
}

export async function deleteSchoolGrantDeputy(id: number) {
  await requireLeaveSettingsAccess();
  await db.delete(leavePermissions).where(eq(leavePermissions.id, id));
  revalidatePath(SCHOOL_GRANT_PATH);
  redirect(SCHOOL_GRANT_PATH);
}

export async function saveLeaveCollectRow(formData: FormData) {
  const user = await requireLeaveSettingsAccess();

  const activeYear = await getActiveLeaveYear();
  if (!activeYear) {
    return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณปัจจุบัน" };
  }

  const parsed = leaveCollectRowSchema.safeParse({
    personId: formData.get("personId"),
    collectDay: formData.get("collectDay"),
    thisYearDay: formData.get("thisYearDay"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await upsertLeaveCollectRow({
    budgetYear: activeYear.budgetYear,
    personId: parsed.data.personId,
    collectDay: parsed.data.collectDay,
    thisYearDay: parsed.data.thisYearDay,
    officerPersonId: user.personId,
  });

  revalidatePath(COLLECTION_PATH);
  return { ok: true as const };
}
