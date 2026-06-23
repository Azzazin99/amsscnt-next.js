import { formatFileSize } from "@/lib/format/file-size";

/** ขนาดรวมสูงสุดของไฟล์แนบต่อจดหมาย 1 ฉบับ */
export const MAIL_MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** @deprecated ใช้ MAIL_MAX_TOTAL_ATTACHMENT_BYTES — คง alias เพื่อ import เดิม */
export const MAIL_MAX_FILE_BYTES = MAIL_MAX_TOTAL_ATTACHMENT_BYTES;

export const MAIL_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".zip",
  ".rar",
] as const;

export const MAIL_COMPOSE_FILE_ACCEPT = MAIL_ALLOWED_EXTENSIONS.join(",");

export function getMailAttachmentFileExtension(fileName: string) {
  return fileName.includes(".")
    ? `.${fileName.split(".").pop()!.toLowerCase()}`
    : "";
}

export function validateMailAttachmentFileType(file: File): string | null {
  if (file.size <= 0) return "ไฟล์ไม่ถูกต้อง";

  const ext = getMailAttachmentFileExtension(file.name);

  if (
    !MAIL_ALLOWED_EXTENSIONS.includes(
      ext as (typeof MAIL_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return `ชนิดไฟล์ไม่รองรับ: ${file.name}`;
  }

  return null;
}

export function sumAttachmentBytes(files: Pick<File, "size">[]) {
  return files.reduce((total, file) => total + file.size, 0);
}

export function validateMailAttachmentsTotalBytes(
  files: Pick<File, "size">[],
  maxTotalBytes: number = MAIL_MAX_TOTAL_ATTACHMENT_BYTES,
): string | null {
  const total = sumAttachmentBytes(files);
  if (total > maxTotalBytes) {
    return `ขนาดไฟล์แนบรวมเกิน ${formatFileSize(maxTotalBytes)} (ปัจจุบัน ${formatFileSize(total)})`;
  }
  return null;
}

/** ตรวจชนิดไฟล์เท่านั้น — ขนาดรวมตรวจแยก */
export function validateMailAttachmentFileClient(file: File): string | null {
  return validateMailAttachmentFileType(file);
}
