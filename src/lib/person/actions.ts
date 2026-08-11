"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { people, personDelegate, personSchoolAssignments } from "@/lib/db/schema";
import {
  getPersonById,
  getPersonByPersonId,
} from "@/lib/person/queries";
import {
  parseExtraSchoolIds,
  personCreateSchema,
  personUpdateSchema,
} from "@/lib/person/schemas";
import { sexFromPrefix } from "@/lib/person/constants";
import { requirePersonWriteAccess } from "@/lib/person/scope";
import { canDeletePerson } from "@/lib/person/permissions";

const STAFF_PATH = "/modules/person/staff";

async function syncSchoolAssignments(
  personId: string,
  primarySchoolId: number | null,
  multiSchool: boolean,
  extraSchoolIds: number[],
) {
  await db
    .delete(personSchoolAssignments)
    .where(eq(personSchoolAssignments.personId, personId));

  if (!multiSchool) return;

  const schoolIds = new Set<number>();
  if (primarySchoolId) schoolIds.add(primarySchoolId);
  for (const id of extraSchoolIds) schoolIds.add(id);

  for (const schoolId of schoolIds) {
    await db
      .insert(personSchoolAssignments)
      .ignore()
      .values({ personId, schoolId });
  }
}

function assertScopeForOrg(
  scope: import("@/lib/person/scope").PersonScope,
  organizationType: "district" | "school",
  schoolId: number | null,
): string | null {
  if (scope.kind === "school") {
    if (organizationType !== "school" || schoolId !== scope.schoolId) {
      return "ไม่มีสิทธิ์จัดการบุคลากรนอกสถานศึกษาของคุณ";
    }
  }
  return null;
}

export async function createPerson(formData: FormData) {
  const { scope } = await requirePersonWriteAccess();

  const parsed = personCreateSchema.safeParse({
    personId: formData.get("personId"),
    prefix: formData.get("prefix"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    organizationType: formData.get("organizationType"),
    schoolId: formData.get("schoolId") || null,
    workgroupId: formData.get("workgroupId") || null,
    positionCode: formData.get("positionCode"),
    status: formData.get("status") ?? 0,
    multiSchool: formData.get("multiSchool"),
    serviceStartDate: formData.get("serviceStartDate"),
    birthDate: formData.get("birthDate"),
    personOrder: formData.get("personOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const scopeErr = assertScopeForOrg(
    scope,
    parsed.data.organizationType,
    parsed.data.schoolId,
  );
  if (scopeErr) return { ok: false as const, message: scopeErr };

  if (await getPersonByPersonId(parsed.data.personId)) {
    return { ok: false as const, message: "เลขบัตรประชาชนนี้มีในระบบแล้ว" };
  }

  const extraSchoolIds = parseExtraSchoolIds(formData);
  const sex = sexFromPrefix(parsed.data.prefix);

  let insertedId: number;
  try {
    insertedId = await insertAndGetId(people, {
      personId: parsed.data.personId,
      prefix: parsed.data.prefix,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      organizationType: parsed.data.organizationType,
      schoolId:
        parsed.data.organizationType === "school" ? parsed.data.schoolId : null,
      workgroupId:
        parsed.data.organizationType === "district"
          ? parsed.data.workgroupId
          : null,
      positionCode: parsed.data.positionCode,
      status: parsed.data.status,
      multiSchool: parsed.data.multiSchool,
      serviceStartDate: parsed.data.serviceStartDate,
      sex,
      birthDate: parsed.data.birthDate,
      personOrder: parsed.data.personOrder,
    });

    await syncSchoolAssignments(
      parsed.data.personId,
      parsed.data.schoolId,
      parsed.data.multiSchool,
      extraSchoolIds,
    );
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(STAFF_PATH);
  return { ok: true as const, id: insertedId };
}

export async function updatePerson(id: number, formData: FormData) {
  const { scope } = await requirePersonWriteAccess();

  const existing = await getPersonById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบข้อมูลบุคลากร" };
  }

  if (
    scope.kind === "school" &&
    existing.schoolId !== scope.schoolId
  ) {
    return { ok: false as const, message: "ไม่มีสิทธิ์แก้ไขรายการนี้" };
  }

  const parsed = personUpdateSchema.safeParse({
    personId: formData.get("personId"),
    prefix: formData.get("prefix"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    organizationType: formData.get("organizationType"),
    schoolId: formData.get("schoolId") || null,
    workgroupId: formData.get("workgroupId") || null,
    positionCode: formData.get("positionCode"),
    status: formData.get("status"),
    multiSchool: formData.get("multiSchool"),
    serviceStartDate: formData.get("serviceStartDate"),
    birthDate: formData.get("birthDate"),
    personOrder: formData.get("personOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const scopeErr = assertScopeForOrg(
    scope,
    parsed.data.organizationType,
    parsed.data.schoolId,
  );
  if (scopeErr) return { ok: false as const, message: scopeErr };

  const dup = await getPersonByPersonId(parsed.data.personId, id);
  if (dup) {
    return { ok: false as const, message: "เลขบัตรประชาชนนี้มีในระบบแล้ว" };
  }

  const extraSchoolIds = parseExtraSchoolIds(formData);
  const sex = sexFromPrefix(parsed.data.prefix);

  try {
    await db
      .update(people)
      .set({
        personId: parsed.data.personId,
        prefix: parsed.data.prefix,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        organizationType: parsed.data.organizationType,
        schoolId:
          parsed.data.organizationType === "school" ? parsed.data.schoolId : null,
        workgroupId:
          parsed.data.organizationType === "district"
            ? parsed.data.workgroupId
            : null,
        positionCode: parsed.data.positionCode,
        status: parsed.data.status,
        multiSchool: parsed.data.multiSchool,
        serviceStartDate: parsed.data.serviceStartDate,
        sex,
        birthDate: parsed.data.birthDate,
        personOrder: parsed.data.personOrder,
      })
      .where(eq(people.id, id));

    await syncSchoolAssignments(
      parsed.data.personId,
      parsed.data.schoolId,
      parsed.data.multiSchool,
      extraSchoolIds,
    );
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(STAFF_PATH);
  revalidatePath(`${STAFF_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deactivatePerson(id: number) {
  const { user, perms, scope } = await requirePersonWriteAccess();
  if (!canDeletePerson(user, perms)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ปิดใช้งาน" };
  }

  const existing = await getPersonById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบข้อมูลบุคลากร" };
  }

  if (scope.kind === "school" && existing.schoolId !== scope.schoolId) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.update(people).set({ status: 1 }).where(eq(people.id, id));

  revalidatePath(STAFF_PATH);
  return { ok: true as const };
}

export async function approvePerson(id: number) {
  const { scope } = await requirePersonWriteAccess();
  const existing = await getPersonById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบข้อมูลบุคลากร" };
  }

  if (scope.kind === "school" && existing.schoolId !== scope.schoolId) {
    return { ok: false as const, message: "ไม่มีสิทธิ์จัดการรายการนี้" };
  }

  await db.update(people).set({ status: 0 }).where(eq(people.id, id));

  revalidatePath(STAFF_PATH);
  return { ok: true as const };
}

export async function deletePersonPermanent(id: number) {
  const { user, perms, scope } = await requirePersonWriteAccess();
  if (!canDeletePerson(user, perms)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  const existing = await getPersonById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบข้อมูลบุคลากร" };
  }

  if (scope.kind === "school" && existing.schoolId !== scope.schoolId) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.delete(people).where(eq(people.id, id));

  revalidatePath(STAFF_PATH);
  return { ok: true as const };
}

export async function deleteActingDirector(id: number) {
  const { user, perms } = await requirePersonWriteAccess();
  if (!canDeletePerson(user, perms)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.delete(personDelegate).where(eq(personDelegate.id, id));

  revalidatePath(STAFF_PATH);
  return { ok: true as const };
}


