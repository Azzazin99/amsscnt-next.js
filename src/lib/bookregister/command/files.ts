import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getCommandStorageDir() {
  return path.join(getStorageRoot(), "bookregister", "command");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export const COMMAND_ALLOWED_EXTENSIONS = new Set([
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

export function isAllowedCommandFileName(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return COMMAND_ALLOWED_EXTENSIONS.has(ext);
}

/** ชื่อไฟล์บนดิสก์ตาม legacy: {refId}{ext} */
export function buildStoredCommandFileName(refId: string, originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  if (!COMMAND_ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }
  return `${refId}${ext}`;
}

export async function saveCommandFileToStorage(
  storedFileName: string,
  file: File,
) {
  const dir = getCommandStorageDir();
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);

  return { fullPath, size: buf.byteLength };
}

export async function deleteCommandFileFromStorage(storedFileName: string) {
  const dir = getCommandStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath);
}

export function resolveCommandFilePath(storedFileName: string) {
  const dir = getCommandStorageDir();
  return path.join(dir, safeBaseName(storedFileName));
}
