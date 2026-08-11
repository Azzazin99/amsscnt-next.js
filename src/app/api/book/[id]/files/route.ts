import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessBookSecretLevel,
  canWriteBook,
  getBookPermissions,
} from "@/lib/book/permissions";
import {
  buildStoredBookFileName,
  isAllowedBookFileName,
  saveBookFileToStorage,
} from "@/lib/book/files";
import {
  canViewBookDocument,
  getBookDocument,
} from "@/lib/book/queries";
import { resolveBookScope } from "@/lib/book/scope";
import { db } from "@/lib/db";
import { bookFiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

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

  const isSender =
    scope.kind === "district"
      ? doc.senderSchoolId == null
      : doc.senderSchoolId === scope.schoolId;

  return {
    ok: true as const,
    user: session.user,
    perms,
    scope,
    doc,
    isSender,
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json([], { status: 200 });

  const required = await requireBookFileContext(id);
  if (!required.ok) {
    return NextResponse.json(
      { message: required.message },
      { status: required.status },
    );
  }

  const files = await db
    .select({
      id: bookFiles.id,
      fileName: bookFiles.fileName,
      fileDes: bookFiles.fileDes,
    })
    .from(bookFiles)
    .where(eq(bookFiles.refId, required.doc.refId))
    .orderBy(asc(bookFiles.id));

  return NextResponse.json(
    files.map((f) => ({
      ...f,
      downloadUrl: `/api/book/${id}/files/${f.id}`,
    })),
  );
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, message: "Invalid id" }, { status: 400 });
  }

  const required = await requireBookFileContext(id);
  if (!required.ok) {
    return NextResponse.json(
      { ok: false, message: required.message },
      { status: required.status },
    );
  }

  if (!canWriteBook(required.user, required.perms) || !required.isSender) {
    return NextResponse.json(
      { ok: false, message: "ไม่มีสิทธิ์แนบไฟล์" },
      { status: 403 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const fileDes = (form.get("fileDes")?.toString() ?? "").trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "กรุณาเลือกไฟล์" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ ok: false, message: "ไฟล์ไม่ถูกต้อง" }, { status: 400 });
  }

  if (!isAllowedBookFileName(file.name)) {
    return NextResponse.json(
      { ok: false, message: "ชนิดไฟล์ไม่รองรับ" },
      { status: 400 },
    );
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" },
      { status: 400 },
    );
  }

  const storedName = buildStoredBookFileName(required.doc.refId, file.name);
  await saveBookFileToStorage(storedName, file);

  const [res] = await db
    .insert(bookFiles)
    .values({
      refId: required.doc.refId,
      fileName: storedName,
      fileDes: fileDes ?? file.name,
    });
  const inserted = {
    id: res.insertId,
    fileName: storedName,
    fileDes: fileDes ?? file.name,
  };

  return NextResponse.json({
    ok: true,
    file: {
      ...inserted,
      downloadUrl: `/api/book/${id}/files/${inserted.id}`,
    },
  });
}
