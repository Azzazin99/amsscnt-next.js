import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  buildMailContentDisposition,
  guessMailFileMime,
  resolveMailFilePath,
} from "@/lib/mail/files";
import { requireMailFileAccess } from "@/lib/mail/file-access";
import { db } from "@/lib/db";
import { mailFiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam, fileId: fileIdParam } = await ctx.params;
  const documentId = Number(idParam);
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(documentId) || !Number.isFinite(fileId)) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  const required = await requireMailFileAccess(documentId);
  if (!required.ok) {
    return NextResponse.json(
      { message: required.message },
      { status: required.status },
    );
  }

  const [fileRow] = await db
    .select({
      id: mailFiles.id,
      fileName: mailFiles.fileName,
      fileDes: mailFiles.fileDes,
    })
    .from(mailFiles)
    .where(
      and(
        eq(mailFiles.id, fileId),
        eq(mailFiles.refId, required.doc.refId),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const safeName = path.basename(fileRow.fileName);
  const fullPath = resolveMailFilePath(safeName);

  let buf: Buffer;
  try {
    buf = await readFile(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const displayName = (fileRow.fileDes || safeName).replace(/[\r\n"]/g, "");
  const mime = guessMailFileMime(safeName);
  const inline = mime === "application/pdf" || mime.startsWith("image/");
  const bytes = new Uint8Array(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": buildMailContentDisposition(
        displayName,
        safeName,
        inline ? "inline" : "attachment",
      ),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
