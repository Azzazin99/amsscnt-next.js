import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getSendStorageDir() {
  return path.join(getStorageRoot(), "bookregister", "send");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export function buildStoredSendFileName(refId: string, originalName: string) {
  const safe = safeBaseName(originalName);
  return `${refId}-${Date.now()}-${safe}`;
}

export async function saveSendFileToStorage(storedFileName: string, file: File) {
  const dir = getSendStorageDir();
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);

  return { fullPath, size: buf.byteLength };
}

export async function deleteSendFileFromStorage(storedFileName: string) {
  const dir = getSendStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath);
}

export function resolveSendFilePath(storedFileName: string) {
  const dir = getSendStorageDir();
  return path.join(dir, safeBaseName(storedFileName));
}

export const SEND_ALLOWED_EXTENSIONS = new Set([
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

export function isAllowedSendFileName(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return SEND_ALLOWED_EXTENSIONS.has(ext);
}
