import { insertAndGetId } from "../db/helpers";
import "server-only";

import { stat } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailFiles } from "@/lib/db/schema";
import {
  MAIL_MAX_TOTAL_ATTACHMENT_BYTES,
  validateMailAttachmentFileType,
} from "@/lib/mail/attachment-constants";
import { formatFileSize } from "@/lib/format/file-size";
import {
  buildStoredMailFileName,
  isAllowedMailFileName,
  resolveMailFilePath,
  saveMailFileToStorage,
} from "@/lib/mail/files";

export function validateMailAttachmentFile(
  file: File,
): { ok: true } | { ok: false; message: string } {
  const typeError = validateMailAttachmentFileType(file);
  if (typeError) {
    return { ok: false, message: typeError };
  }

  if (!isAllowedMailFileName(file.name)) {
    return {
      ok: false,
      message: `ชนิดไฟล์ไม่รองรับ: ${file.name}`,
    };
  }

  return { ok: true };
}

export async function getMailAttachmentStoredBytes(refId: string) {
  const rows = await db
    .select({ fileName: mailFiles.fileName })
    .from(mailFiles)
    .where(eq(mailFiles.refId, refId));

  let total = 0;
  for (const row of rows) {
    try {
      const info = await stat(resolveMailFilePath(row.fileName));
      total += info.size;
    } catch {
      // ไฟล์หายจากดิสก์ — ข้าม
    }
  }
  return total;
}

export async function validateMailAttachmentTotalForRef(
  refId: string,
  additionalBytes: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const existing = await getMailAttachmentStoredBytes(refId);
  const nextTotal = existing + additionalBytes;

  if (nextTotal > MAIL_MAX_TOTAL_ATTACHMENT_BYTES) {
    return {
      ok: false,
      message: `ขนาดไฟล์แนบรวมเกิน ${formatFileSize(MAIL_MAX_TOTAL_ATTACHMENT_BYTES)} (ปัจจุบัน ${formatFileSize(existing)})`,
    };
  }

  return { ok: true };
}

export async function uploadMailAttachment(
  refId: string,
  file: File,
  fileDes: string | null,
) {
  const totalCheck = await validateMailAttachmentTotalForRef(refId, file.size);
  if (!totalCheck.ok) {
    throw new Error(totalCheck.message);
  }

  const storedName = buildStoredMailFileName(refId, file.name);
  await saveMailFileToStorage(storedName, file);

  const [res] = await db
    .insert(mailFiles)
    .values({
      refId,
      fileName: storedName,
      fileDes: fileDes ?? file.name,
    });

  return {
    id: res.insertId,
    fileName: storedName,
    fileDes: fileDes ?? file.name,
  };
}
