import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

export function getCabinetStorageDir() {
  return path.join(getStorageRoot(), "cabinet");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

export function buildStoredCabinetFileName(
  personId: string,
  originalName: string,
) {
  const ext = path.extname(originalName).toLowerCase();
  return `${personId}${Date.now()}${ext}`;
}

export async function saveCabinetFileToStorage(
  storedFileName: string,
  file: File,
) {
  const dir = getCabinetStorageDir();
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);

  return { fullPath, size: buf.byteLength };
}

export async function deleteCabinetFileFromStorage(storedFileName: string) {
  const dir = getCabinetStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath);
}

export function resolveCabinetFilePath(storedFileName: string) {
  const dir = getCabinetStorageDir();
  return path.join(dir, safeBaseName(storedFileName));
}

export const CABINET_ALLOWED_EXTENSIONS = new Set([
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

export function isAllowedCabinetFileName(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return CABINET_ALLOWED_EXTENSIONS.has(ext);
}

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
};

export function guessCabinetFileMime(storedFileName: string) {
  const ext = path.extname(storedFileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function buildCabinetContentDisposition(
  displayName: string,
  storedFileName: string,
  mode: "inline" | "attachment" = "inline",
) {
  const asciiFallback =
    path.basename(storedFileName).replace(/[^\x20-\x7E]/g, "_") || "download";
  const encoded = encodeURIComponent(displayName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${mode}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
