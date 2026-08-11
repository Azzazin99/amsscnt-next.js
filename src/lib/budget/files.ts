import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAllowedAttachmentFileName } from "@/lib/form/attachment-allowed-types";

const DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), "storage");

function getStorageRoot() {
  return process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : DEFAULT_STORAGE_PATH;
}

/** storage/budget/receive/ */
export function getBudgetReceiveStorageDir() {
  return path.join(getStorageRoot(), "budget", "receive");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

/** legacy: budgetrec{budgetYear}_{id}.{ext} */
export function buildBudgetReceiveStoredFileName(
  budgetYear: number,
  id: number,
  originalName: string,
) {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  return `budgetrec${budgetYear}_${id}${ext}`;
}

export async function saveBudgetReceiveFile(storedFileName: string, file: File) {
  const dir = getBudgetReceiveStorageDir();
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);
  return { fullPath, size: buf.byteLength };
}

export async function deleteBudgetReceiveFile(storedFileName: string) {
  if (!storedFileName) return;
  const dir = getBudgetReceiveStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath).catch(() => undefined);
}

export function resolveBudgetReceiveFilePath(storedFileName: string) {
  return path.join(getBudgetReceiveStorageDir(), safeBaseName(storedFileName));
}

export function isAllowedBudgetReceiveFileName(fileName: string): boolean {
  return isAllowedAttachmentFileName(fileName);
}
