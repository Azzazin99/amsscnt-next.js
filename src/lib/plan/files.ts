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

export function getPlanDetailStorageDir() {
  return path.join(getStorageRoot(), "plan", "detail");
}

function safeBaseName(input: string) {
  const base = path.basename(input);
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || "file";
}

/** legacy: planaoc{budgetYear}_{codeProj}.{ext} */
export function buildPlanProjectStoredFileName(
  budgetYear: number,
  codeProj: string,
  originalName: string,
) {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  return `planaoc${budgetYear}_${codeProj}${ext}`;
}

export async function savePlanProjectFile(
  storedFileName: string,
  file: File,
) {
  const dir = getPlanDetailStorageDir();
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await writeFile(fullPath, buf);
  return { fullPath, size: buf.byteLength };
}

export async function deletePlanProjectFile(storedFileName: string) {
  if (!storedFileName) return;
  const dir = getPlanDetailStorageDir();
  const fullPath = path.join(dir, safeBaseName(storedFileName));
  await unlink(fullPath);
}

export function resolvePlanProjectFilePath(storedFileName: string) {
  return path.join(getPlanDetailStorageDir(), safeBaseName(storedFileName));
}

export function isAllowedPlanProjectFileName(fileName: string): boolean {
  return isAllowedAttachmentFileName(fileName);
}
