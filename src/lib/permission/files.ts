import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  STANDARD_ATTACHMENT_EXTENSION_SET,
  isAllowedAttachmentFileName,
} from "@/lib/form/attachment-allowed-types";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getPermissionStorageDir() {
  return path.join(getStorageRoot(), "permission", "requests");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export const PERMISSION_ALLOWED_EXTENSIONS = STANDARD_ATTACHMENT_EXTENSION_SET;

export function isAllowedPermissionFileName(fileName: string): boolean {
  return isAllowedAttachmentFileName(fileName);
}

export function buildStoredPermissionFileName(
  requestId: number,
  originalName: string,
) {
  const ext = path.extname(originalName).toLowerCase();
  if (!PERMISSION_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }
  return `${requestId}_${Date.now()}${ext}`;
}

export async function savePermissionFileToStorage(
  storedFileName: string,
  file: File,
) {
  const dir = getPermissionStorageDir();
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);
  return { fullPath, size: buf.byteLength };
}

export function resolvePermissionFilePath(storedFileName: string) {
  return path.join(getPermissionStorageDir(), safeBaseName(storedFileName));
}

export async function deletePermissionFileFromStorage(storedFileName: string) {
  await unlink(resolvePermissionFilePath(storedFileName));
}

export function guessPermissionFileMime(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
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
