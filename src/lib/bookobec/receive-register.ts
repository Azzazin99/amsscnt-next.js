import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import type { ObecPendingItem } from "@/lib/bookobec/obec-client";
import { resolveObecSenderOffice } from "@/lib/bookobec/obec-offices";
import { db } from "@/lib/db";
import {
  bookDocuments,
  bookRecipients,
  registerReceives,
} from "@/lib/db/schema";
import { allocateNextRegisterNumber } from "@/lib/bookregister/receive/queries";
import {
  todayBangkokDateString,
} from "@/lib/bookregister/receive/ref-id";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";

const OBEC_BOOK_TYPE = 5;
const OBEC_BOOK_LINK = 5;
const OBEC_SEND_LEVEL = 2;

export type ReceiveRegisterResult = {
  ok: boolean;
  message: string;
  registered: number;
  failed: number;
  failedSubjects: string[];
};

async function refIdExists(refId: string): Promise<boolean> {
  const [bookRow] = await db
    .select({ id: bookDocuments.id })
    .from(bookDocuments)
    .where(eq(bookDocuments.refId, refId))
    .limit(1);
  if (bookRow) return true;

  const [regRow] = await db
    .select({ id: registerReceives.id })
    .from(registerReceives)
    .where(
      and(eq(registerReceives.refId, refId), isNull(registerReceives.deletedAt)),
    )
    .limit(1);

  return Boolean(regRow);
}

function normalizeSignDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return todayBangkokDateString();
}

export async function registerObecPendingItems(input: {
  items: ObecPendingItem[];
  selectedMsIds: string[];
  officerUserId: number;
  senderPersonId: string;
}): Promise<ReceiveRegisterResult> {
  const activeYear = await getActiveDistrictYear();
  if (!activeYear || activeYear.startReceiveNum <= 0) {
    return {
      ok: false,
      message: "ทะเบียนรับไม่เปิดใช้งาน — ตั้งค่าปีทะเบียนก่อน",
      registered: 0,
      failed: 0,
      failedSubjects: [],
    };
  }

  const district = await getDistrictSettingsRow();
  const bookTo =
    district?.officeName?.trim() || "สำนักงานเขตพื้นที่การศึกษา";
  const registerDate = todayBangkokDateString();
  const selected = new Set(input.selectedMsIds);
  const scope = { kind: "district" as const, schoolId: null };

  let registered = 0;
  let failed = 0;
  const failedSubjects: string[] = [];

  for (const item of input.items) {
    if (!selected.has(item.msId)) continue;

    if (await refIdExists(item.refId)) {
      failed += 1;
      failedSubjects.push(item.subject);
      continue;
    }

    const senderOffice = await resolveObecSenderOffice(item.office);
    const registerNumber = await allocateNextRegisterNumber(
      scope,
      activeYear.year,
    );
    const subjectWithDate = `${item.subject} (${item.sendDate})`;
    const signDate = normalizeSignDate(item.signdate);
    const now = new Date();
    let insertOk = 0;

    try {
      await db.transaction(async (tx) => {
        await tx.insert(registerReceives).values({
          schoolId: null,
          year: activeYear.year,
          registerNumber,
          bookNo: item.bookno,
          signdate: signDate,
          bookFrom: senderOffice.senderName,
          bookTo,
          subject: subjectWithDate,
          comment: null,
          registerDate,
          refId: item.refId,
          officerId: input.officerUserId,
          workgroupId: null,
          recordType: 1,
          bookLink: OBEC_BOOK_LINK,
          source: "external",
          urgencyLevel: Number(item.level) || 1,
          secretLevel: 0,
          secret: false,
        });

        await tx.insert(bookDocuments).values({
          refId: item.refId,
          bookType: OBEC_BOOK_TYPE,
          senderPersonId: input.senderPersonId,
          officeCode: senderOffice.officeCode,
          senderSchoolId: null,
          senderUserId: input.officerUserId,
          urgencyLevel: Number(item.level) || 1,
          secretLevel: 0,
          bookNo: item.bookno,
          signDate,
          subject: item.subject,
          detail: item.detail || null,
          sendDate: now,
          bookRegisLink: OBEC_BOOK_LINK,
        });

        await tx.insert(bookRecipients).values({
          refId: item.refId,
          sendLevel: OBEC_SEND_LEVEL,
          sendTo: "saraban",
          answered: true,
          answeredAt: now,
        });
      });
      insertOk = 3;
    } catch {
      insertOk = 0;
    }

    if (insertOk === 3) {
      registered += 1;
    } else {
      failed += 1;
      failedSubjects.push(item.subject);
    }
  }

  if (registered === 0 && failed > 0) {
    return {
      ok: false,
      message: `ไม่สามารถลงทะเบียนได้ ${failed} รายการ`,
      registered,
      failed,
      failedSubjects,
    };
  }

  if (failed > 0) {
    return {
      ok: true,
      message: `ลงทะเบียนสำเร็จ ${registered} รายการ — มีข้อผิดพลาด ${failed} รายการ`,
      registered,
      failed,
      failedSubjects,
    };
  }

  return {
    ok: true,
    message: `ลงทะเบียนสำเร็จ ${registered} รายการ`,
    registered,
    failed,
    failedSubjects,
  };
}
