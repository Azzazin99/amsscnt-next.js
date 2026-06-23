import { and, asc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessSecretLevel,
  canModifyOwnSendRecord,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { db } from "@/lib/db";
import { registerSendFiles, registerSends } from "@/lib/db/schema";
import {
  buildStoredSendFileName,
  isAllowedSendFileName,
  saveSendFileToStorage,
} from "@/lib/bookregister/send/files";
import {
  canWriteRegisters,
  resolveBookregisterScope,
  scopeSendSchoolCondition,
} from "@/lib/bookregister/scope";

export const runtime = "nodejs";

type Ctx = RouteContext<"/api/bookregister/send/[id]/files">;

async function requireSendRow(id: number) {
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
      id: registerSends.id,
      refId: registerSends.refId,
      officerId: registerSends.officerId,
      registerDate: registerSends.registerDate,
      secretLevel: registerSends.secretLevel,
    })
    .from(registerSends)
    .where(
      and(
        eq(registerSends.id, id),
        scopeSendSchoolCondition(scope),
        isNull(registerSends.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  if (!canAccessSecretLevel(session.user, perms, row.secretLevel)) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  return { ok: true as const, user: session.user, perms, scope, row };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json([], { status: 200 });

  const required = await requireSendRow(id);
  if (!required.ok) {
    return NextResponse.json({ message: required.message }, { status: required.status });
  }

  const files = await db
    .select({
      id: registerSendFiles.id,
      fileName: registerSendFiles.fileName,
      fileDes: registerSendFiles.fileDes,
    })
    .from(registerSendFiles)
    .where(eq(registerSendFiles.refId, required.row.refId))
    .orderBy(asc(registerSendFiles.id));

  return NextResponse.json(
    files.map((f) => ({
      ...f,
      downloadUrl: `/api/bookregister/send/${id}/files/${f.id}`,
    })),
  );
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, message: "Invalid id" }, { status: 400 });
  }

  const required = await requireSendRow(id);
  if (!required.ok) {
    return NextResponse.json({ ok: false, message: required.message }, { status: required.status });
  }

  if (!canWriteRegisters(required.user, required.perms, required.scope)) {
    return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์บันทึก" }, { status: 403 });
  }

  if (
    !canModifyOwnSendRecord(
      required.user,
      required.perms,
      required.row.officerId,
      required.row.registerDate,
    )
  ) {
    return NextResponse.json(
      { ok: false, message: "ไม่มีสิทธิ์แนบไฟล์ (หมดเวลาแก้ไขหรือไม่ใช่ผู้บันทึก)" },
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

  if (!isAllowedSendFileName(file.name)) {
    return NextResponse.json(
      { ok: false, message: "ชนิดไฟล์ไม่รองรับ (pdf, doc, xls, ppt, รูปภาพ, zip)" },
      { status: 400 },
    );
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" }, { status: 400 });
  }

  const storedName = buildStoredSendFileName(required.row.refId, file.name);
  await saveSendFileToStorage(storedName, file);

  const [inserted] = await db
    .insert(registerSendFiles)
    .values({
      refId: required.row.refId,
      fileName: storedName,
      fileDes: fileDes ?? file.name,
    })
    .returning({
      id: registerSendFiles.id,
      fileName: registerSendFiles.fileName,
      fileDes: registerSendFiles.fileDes,
    });

  return NextResponse.json({
    ok: true,
    file: {
      ...inserted,
      downloadUrl: `/api/bookregister/send/${id}/files/${inserted.id}`,
    },
  });
}
