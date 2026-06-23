import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessSecretLevel,
  canModifyOwnReceiveRecord,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { db } from "@/lib/db";
import { registerReceiveFiles, registerReceives } from "@/lib/db/schema";
import {
  buildContentDisposition,
  deleteReceiveFileFromStorage,
  guessReceiveFileMime,
  resolveReceiveFilePath,
} from "@/lib/bookregister/receive/files";
import {
  canWriteRegisters,
  resolveBookregisterScope,
  scopeReceiveSchoolCondition,
} from "@/lib/bookregister/scope";
import path from "node:path";
import { readFile } from "node:fs/promises";

export const runtime = "nodejs";

type Ctx = RouteContext<"/api/bookregister/receive/[id]/files/[fileId]">;

async function requireContext(receiveId: number) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const perms = await getBookregisterPermissions(Number(session.user.id));
  const scope = await resolveBookregisterScope(session.user, perms);
  if (!scope) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  const [row] = await db
    .select({
      id: registerReceives.id,
      refId: registerReceives.refId,
      officerId: registerReceives.officerId,
      registerDate: registerReceives.registerDate,
      secretLevel: registerReceives.secretLevel,
    })
    .from(registerReceives)
    .where(
      and(
        eq(registerReceives.id, receiveId),
        scopeReceiveSchoolCondition(scope),
        isNull(registerReceives.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return { ok: false as const, status: 404, message: "Not found" };

  if (!canAccessSecretLevel(session.user, perms, row.secretLevel)) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  return { ok: true as const, user: session.user, perms, scope, row };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam, fileId: fileIdParam } = await ctx.params;
  const receiveId = Number(idParam);
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(receiveId) || !Number.isFinite(fileId)) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  const required = await requireContext(receiveId);
  if (!required.ok) {
    return NextResponse.json({ message: required.message }, { status: required.status });
  }

  const [fileRow] = await db
    .select({
      id: registerReceiveFiles.id,
      fileName: registerReceiveFiles.fileName,
      fileDes: registerReceiveFiles.fileDes,
    })
    .from(registerReceiveFiles)
    .where(
      and(
        eq(registerReceiveFiles.id, fileId),
        eq(registerReceiveFiles.refId, required.row.refId),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const safeName = path.basename(fileRow.fileName);
  const fullPath = resolveReceiveFilePath(safeName);

  let buf: Buffer;
  try {
    buf = await readFile(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const displayName = (fileRow.fileDes || safeName).replace(/[\r\n"]/g, "");
  const mime = guessReceiveFileMime(safeName);
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

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: idParam, fileId: fileIdParam } = await ctx.params;
  const receiveId = Number(idParam);
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(receiveId) || !Number.isFinite(fileId)) {
    return NextResponse.json({ ok: false, message: "Invalid" }, { status: 400 });
  }

  const required = await requireContext(receiveId);
  if (!required.ok) {
    return NextResponse.json({ ok: false, message: required.message }, { status: required.status });
  }

  if (!canWriteRegisters(required.user, required.perms, required.scope)) {
    return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์บันทึก" }, { status: 403 });
  }

  if (
    !canModifyOwnReceiveRecord(
      required.user,
      required.perms,
      required.row.officerId,
      required.row.registerDate,
    )
  ) {
    return NextResponse.json(
      { ok: false, message: "ไม่มีสิทธิ์ลบไฟล์แนบ (หมดเวลาแก้ไขหรือไม่ใช่ผู้บันทึก)" },
      { status: 403 },
    );
  }

  const [fileRow] = await db
    .select({
      id: registerReceiveFiles.id,
      fileName: registerReceiveFiles.fileName,
    })
    .from(registerReceiveFiles)
    .where(
      and(
        eq(registerReceiveFiles.id, fileId),
        eq(registerReceiveFiles.refId, required.row.refId),
      ),
    )
    .limit(1);

  if (!fileRow) return NextResponse.json({ ok: false, message: "ไม่พบไฟล์" }, { status: 404 });

  await db
    .delete(registerReceiveFiles)
    .where(eq(registerReceiveFiles.id, fileRow.id));

  try {
    await deleteReceiveFileFromStorage(fileRow.fileName);
  } catch {
    // ignore missing file on disk
  }

  return NextResponse.json({ ok: true });
}
