import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getLeaveStorageDir() {
  return path.join(getStorageRoot(), "leave", "requests");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export const LEAVE_ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
]);

export function isAllowedLeaveFileName(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return LEAVE_ALLOWED_EXTENSIONS.has(ext);
}

export function buildStoredLeaveFileName(requestId: number, originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  if (!LEAVE_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }
  return `${requestId}_${Date.now()}${ext}`;
}

export async function saveLeaveFileToStorage(storedFileName: string, file: File) {
  const dir = getLeaveStorageDir();
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);
  return { fullPath, size: buf.byteLength };
}

export function resolveLeaveFilePath(storedFileName: string) {
  return path.join(getLeaveStorageDir(), safeBaseName(storedFileName));
}

export async function deleteLeaveFileFromStorage(storedFileName: string) {
  await unlink(resolveLeaveFilePath(storedFileName));
}

export function guessLeaveFileMime(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export function buildContentDisposition(
  displayName: string,
  fallback: string,
  disposition: "inline" | "attachment",
) {
  const name = displayName || fallback;
  return `${disposition}; filename="${name.replace(/[\r\n"]/g, "")}"`;
}
