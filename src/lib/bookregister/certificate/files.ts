import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getCertificateStorageDir() {
  return path.join(getStorageRoot(), "bookregister", "certificate");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  // ป้องกัน path traversal + จำกัดความยาว
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export const CERTIFICATE_ALLOWED_EXTENSIONS = new Set([
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
]);

export function isAllowedCertificateFileName(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return CERTIFICATE_ALLOWED_EXTENSIONS.has(ext);
}

/** ชื่อไฟล์บนดิสก์ตาม legacy-ish: {refId}{ext} */
export function buildStoredCertificateFileName(
  refId: string,
  originalName: string,
) {
  const ext = path.extname(originalName).toLowerCase();
  if (!CERTIFICATE_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }
  return `${refId}${ext}`;
}

export async function saveCertificateFileToStorage(
  storedFileName: string,
  file: File,
) {
  const dir = getCertificateStorageDir();
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);

  return { fullPath, size: buf.byteLength };
}

export async function deleteCertificateFileFromStorage(
  storedFileName: string,
) {
  const dir = getCertificateStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath);
}

export function resolveCertificateFilePath(storedFileName: string) {
  const dir = getCertificateStorageDir();
  return path.join(dir, safeBaseName(storedFileName));
}

