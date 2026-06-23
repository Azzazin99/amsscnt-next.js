import "server-only";

import archiver from "archiver";
import { access } from "node:fs/promises";
import path from "node:path";
import { PassThrough } from "node:stream";
import { resolveMailFilePath } from "@/lib/mail/files";

export type MailZipEntry = {
  storedName: string;
  entryName: string;
};

function sanitizeZipEntryName(input: string) {
  return input.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim() || "file";
}

export function buildMailZipEntryName(
  fileDes: string | null,
  storedName: string,
  index: number,
) {
  const ext = path.extname(storedName);
  const label = sanitizeZipEntryName(fileDes || path.basename(storedName));
  const withExt = path.extname(label) ? label : `${label}${ext}`;
  return `${String(index + 1).padStart(2, "0")}-${withExt}`;
}

async function fileExists(fullPath: string) {
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function buildMailAttachmentsZip(
  entries: MailZipEntry[],
): Promise<Buffer> {
  const present: { entryName: string; fullPath: string }[] = [];

  for (const entry of entries) {
    const safeName = path.basename(entry.storedName);
    const fullPath = resolveMailFilePath(safeName);
    if (await fileExists(fullPath)) {
      present.push({ entryName: entry.entryName, fullPath });
    }
  }

  if (present.length === 0) {
    throw new Error("NO_FILES");
  }

  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const passthrough = new PassThrough();
    const chunks: Buffer[] = [];

    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);
    archive.on("error", reject);

    archive.pipe(passthrough);

    for (const file of present) {
      archive.file(file.fullPath, { name: file.entryName });
    }

    void archive.finalize();
  });
}
