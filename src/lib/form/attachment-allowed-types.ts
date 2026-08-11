export const STANDARD_ATTACHMENT_EXTENSIONS = [
  ".docx",
  ".xlsx",
  ".pptx",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export type StandardAttachmentExtension =
  (typeof STANDARD_ATTACHMENT_EXTENSIONS)[number];

export const STANDARD_ATTACHMENT_EXTENSION_SET = new Set<string>(
  STANDARD_ATTACHMENT_EXTENSIONS,
);

export const STANDARD_ATTACHMENT_ACCEPT =
  STANDARD_ATTACHMENT_EXTENSIONS.join(",");

export const STANDARD_ATTACHMENT_TYPES_LABEL =
  "docx, xlsx, pptx, pdf, jpg, jpeg, png";

export function getAttachmentFileExtension(fileName: string): string {
  return fileName.includes(".")
    ? `.${fileName.split(".").pop()!.toLowerCase()}`
    : "";
}

export function isAllowedAttachmentFileName(fileName: string): boolean {
  return STANDARD_ATTACHMENT_EXTENSION_SET.has(
    getAttachmentFileExtension(fileName),
  );
}

export function validateStandardAttachmentFile(file: File): string | null {
  if (file.size <= 0) return "ไฟล์ไม่ถูกต้อง";

  if (!isAllowedAttachmentFileName(file.name)) {
    return `ชนิดไฟล์ไม่รองรับ: ${file.name}`;
  }

  return null;
}

export function buildStandardAttachmentUploadHint(
  formattedMaxSize: string,
  perItemLabel = "ต่อจดหมาย",
): string {
  return `ไม่จำกัดจำนวนไฟล์ · ${STANDARD_ATTACHMENT_TYPES_LABEL} · ขนาดรวมสูงสุด ${formattedMaxSize} ${perItemLabel}`;
}

// ponytail: self-check — fails if allowlist logic drifts
if (process.env.NODE_ENV !== "production") {
  const allowed = [
    "report.docx",
    "sheet.xlsx",
    "slides.pptx",
    "scan.pdf",
    "photo.jpg",
    "photo.jpeg",
    "photo.png",
  ];
  const denied = ["legacy.doc", "archive.zip", "anim.gif", "old.xls", "old.ppt"];

  for (const name of allowed) {
    if (!isAllowedAttachmentFileName(name)) {
      throw new Error(`attachment allowlist regression: ${name}`);
    }
  }
  for (const name of denied) {
    if (isAllowedAttachmentFileName(name)) {
      throw new Error(`attachment denylist regression: ${name}`);
    }
  }
}
