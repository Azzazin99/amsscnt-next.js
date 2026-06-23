"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import { canManageMailSettings } from "@/lib/mail/permissions";
import { parseMailRecipientCategory } from "@/lib/mail/recipient-options";
import {
  generateMailRefId,
  getMailModulePermission,
  getMailPermissionByUserId,
  listAllActivePersonIds,
  resolveDistrictClerkPersonIds,
  resolveSchoolDirectorPersonIds,
  resolveSchoolStaffPersonIds,
  resolveWorkgroupMemberPersonIds,
} from "@/lib/mail/queries";
import { mailCreateSchema, mailPermissionFormSchema } from "@/lib/mail/schemas";
import { acknowledgeMailRecipient } from "@/lib/mail/acknowledge";
import { requireMailScope, requireMailWriteAccess } from "@/lib/mail/scope";
import { db } from "@/lib/db";
import {
  mailDocuments,
  mailPermissions,
  mailRecipients,
} from "@/lib/db/schema";

const INBOX_PATH = "/modules/mail/inbox";
const SENT_PATH = "/modules/mail/sent";
const PERMS_PATH = "/modules/mail/permissions";

function parseFormStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((v) => v.toString().trim())
    .filter((v) => v.length > 0);
}

function parseCreateForm(formData: FormData) {
  return mailCreateSchema.safeParse({
    subject: formData.get("subject"),
    detail: formData.get("detail") || undefined,
    recipientCategory: formData.get("recipientCategory"),
    personIds: parseFormStringArray(formData, "personIds"),
    workgroupIds: parseFormStringArray(formData, "workgroupIds"),
  });
}

async function resolveRecipientPersonIds(
  data: {
    recipientCategory: string;
    personIds?: string[];
    workgroupIds?: string[];
  },
  senderPersonId: string,
): Promise<{ ok: true; ids: string[] } | { ok: false; message: string }> {
  const category = parseMailRecipientCategory(data.recipientCategory);
  if (!category) {
    return { ok: false, message: "รูปแบบผู้รับไม่ถูกต้อง" };
  }

  let ids: string[] = [];

  switch (category) {
    case "all":
      ids = await listAllActivePersonIds();
      break;
    case "selected":
      ids = data.personIds ?? [];
      if (ids.length === 0) {
        return { ok: false, message: "กรุณาเลือกผู้รับ" };
      }
      break;
    case "workgroups": {
      const workgroupIds = (data.workgroupIds ?? [])
        .map((value) => Number(value))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (workgroupIds.length === 0) {
        return { ok: false, message: "กรุณาเลือกกลุ่ม/หน่วยอย่างน้อย 1 กลุ่ม" };
      }

      for (const workgroupId of workgroupIds) {
        const allMembers = await resolveWorkgroupMemberPersonIds(workgroupId);
        const memberSet = new Set(allMembers);
        const picked = (data.personIds ?? []).filter((id) => memberSet.has(id));
        ids.push(...(picked.length > 0 ? picked : allMembers));
      }
      if (ids.length === 0) {
        return { ok: false, message: "กลุ่มที่เลือกไม่มีบุคลากร" };
      }
      break;
    }
    case "district_clerks": {
      const selectedIds = data.personIds ?? [];
      if (selectedIds.length === 0) {
        return { ok: false, message: "กรุณาเลือกธุรการกลุ่ม/หน่วย" };
      }
      const allowed = new Set(await resolveDistrictClerkPersonIds());
      ids = selectedIds.filter((id) => allowed.has(id));
      if (ids.length === 0) {
        return { ok: false, message: "รายชื่อที่เลือกไม่ถูกต้อง" };
      }
      break;
    }
    case "school_directors": {
      const selectedIds = data.personIds ?? [];
      if (selectedIds.length === 0) {
        return { ok: false, message: "กรุณาเลือกผู้อำนวยการสถานศึกษา" };
      }
      const allowed = new Set(await resolveSchoolDirectorPersonIds());
      ids = selectedIds.filter((id) => allowed.has(id));
      if (ids.length === 0) {
        return { ok: false, message: "รายชื่อที่เลือกไม่ถูกต้อง" };
      }
      break;
    }
    case "school_staff": {
      const selectedIds = data.personIds ?? [];
      if (selectedIds.length === 0) {
        return { ok: false, message: "กรุณาเลือกครูและบุคลากรในสถานศึกษา" };
      }
      const allowed = new Set(await resolveSchoolStaffPersonIds());
      ids = selectedIds.filter((id) => allowed.has(id));
      if (ids.length === 0) {
        return { ok: false, message: "รายชื่อที่เลือกไม่ถูกต้อง" };
      }
      break;
    }
  }

  const unique = [...new Set(ids.filter((id) => id !== senderPersonId))];
  if (unique.length === 0) {
    return { ok: false, message: "ไม่มีผู้รับที่ถูกต้อง" };
  }

  return { ok: true, ids: unique };
}

export async function createMailDocument(formData: FormData) {
  const { user } = await requireMailWriteAccess();

  const parsed = parseCreateForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const recipients = await resolveRecipientPersonIds(
    {
      recipientCategory: parsed.data.recipientCategory,
      personIds: parsed.data.personIds,
      workgroupIds: parsed.data.workgroupIds,
    },
    user.personId,
  );
  if (!recipients.ok) return recipients;

  const refId = generateMailRefId(user.personId);

  const [inserted] = await db
    .insert(mailDocuments)
    .values({
      refId,
      senderPersonId: user.personId,
      senderUserId: Number(user.id),
      subject: parsed.data.subject,
      detail: parsed.data.detail ?? null,
    })
    .returning({ id: mailDocuments.id });

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  await db.insert(mailRecipients).values(
    recipients.ids.map((personId) => ({
      refId,
      sendTo: personId,
      answered: false,
    })),
  );

  revalidatePath(INBOX_PATH);
  revalidatePath(SENT_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function acknowledgeMailDocument(documentId: number) {
  const { user } = await requireMailScope();

  const [doc] = await db
    .select({ refId: mailDocuments.refId })
    .from(mailDocuments)
    .where(eq(mailDocuments.id, documentId))
    .limit(1);

  if (!doc) {
    return { ok: false as const, message: "ไม่พบหนังสือเวียน" };
  }

  const updated = await acknowledgeMailRecipient(
    doc.refId,
    user.personId,
    documentId,
  );

  if (!updated) {
    return { ok: false as const, message: "ตอบรับแล้วหรือไม่มีสิทธิ์" };
  }

  return { ok: true as const };
}

function parsePermissionForm(formData: FormData) {
  const parsed = mailPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
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

async function requireMailSettingsAccessFromSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canManageMailSettings(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าหนังสือเวียน");
  }
  return session.user;
}

export async function createMailPermission(formData: FormData) {
  const officer = await requireMailSettingsAccessFromSession();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;

  const existing = await getMailPermissionByUserId(userId);
  if (existing) {
    return { ok: false as const, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(mailPermissions).values({
    userId,
    p1: p1 ? 1 : 0,
    officerPersonId: officerPersonId ?? officer.personId,
    recDate: todayBangkokDateString(),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateMailPermission(id: number, formData: FormData) {
  await requireMailSettingsAccessFromSession();
  const row = await getMailModulePermission(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;

  const other = await getMailPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  const session = await auth();
  await db
    .update(mailPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      officerPersonId: officerPersonId ?? session?.user?.personId ?? null,
      recDate: todayBangkokDateString(),
    })
    .where(eq(mailPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteMailPermission(id: number) {
  await requireMailSettingsAccessFromSession();
  await db.delete(mailPermissions).where(eq(mailPermissions.id, id));
  revalidatePath(PERMS_PATH);
  return { ok: true as const };
}
