import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessBookSecretLevel,
  getBookPermissions,
} from "@/lib/book/permissions";
import {
  buildContentDisposition,
  guessBookFileMime,
  resolveBookFilePath,
} from "@/lib/book/files";
import {
  canViewBookDocument,
  getBookDocument,
} from "@/lib/book/queries";
import { resolveBookScope } from "@/lib/book/scope";
import { db } from "@/lib/db";
import { bookFiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

async function requireBookFileContext(documentId: number) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const perms = await getBookPermissions(Number(session.user.id));
  const scope = await resolveBookScope(session.user, perms);
  if (!scope) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  const doc = await getBookDocument(documentId);
  if (!doc) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  if (!canAccessBookSecretLevel(session.user, perms, doc.secretLevel)) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  const canView = await canViewBookDocument(doc, scope);
  if (!canView) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  return { ok: true as const, doc };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam, fileId: fileIdParam } = await ctx.params;
  const documentId = Number(idParam);
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(documentId) || !Number.isFinite(fileId)) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  const required = await requireBookFileContext(documentId);
  if (!required.ok) {
    return NextResponse.json(
      { message: required.message },
      { status: required.status },
    );
  }

  const [fileRow] = await db
    .select({
      id: bookFiles.id,
      fileName: bookFiles.fileName,
      fileDes: bookFiles.fileDes,
    })
    .from(bookFiles)
    .where(
      and(
        eq(bookFiles.id, fileId),
        eq(bookFiles.refId, required.doc.refId),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const safeName = path.basename(fileRow.fileName);
  const fullPath = resolveBookFilePath(safeName);

  let buf: Buffer;
  try {
    buf = await readFile(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const displayName = (fileRow.fileDes || safeName).replace(/[\r\n"]/g, "");
  const mime = guessBookFileMime(safeName);
  const inline = mime === "application/pdf" || mime.startsWith("image/");
  const bytes = new Uint8Array(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": buildContentDisposition(
        displayName,
        safeName,
        inline ? "inline" : "attachment",
      ),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
