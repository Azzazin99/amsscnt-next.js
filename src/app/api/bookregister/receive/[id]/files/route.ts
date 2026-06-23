import { and, asc, eq, isNull } from "drizzle-orm";
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
  buildStoredReceiveFileName,
  isAllowedReceiveFileName,
  saveReceiveFileToStorage,
} from "@/lib/bookregister/receive/files";
import {
  canWriteRegisters,
  resolveBookregisterScope,
  scopeReceiveSchoolCondition,
} from "@/lib/bookregister/scope";

export const runtime = "nodejs";

type Ctx = RouteContext<"/api/bookregister/receive/[id]/files">;

async function requireReceiveRow(id: number) {
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
        eq(registerReceives.id, id),
        scopeReceiveSchoolCondition(scope),
        isNull(registerReceives.deletedAt),
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

  const required = await requireReceiveRow(id);
  if (!required.ok) {
    return NextResponse.json({ message: required.message }, { status: required.status });
  }

  const files = await db
    .select({
      id: registerReceiveFiles.id,
      fileName: registerReceiveFiles.fileName,
      fileDes: registerReceiveFiles.fileDes,
    })
    .from(registerReceiveFiles)
    .where(eq(registerReceiveFiles.refId, required.row.refId))
    .orderBy(asc(registerReceiveFiles.id));

  return NextResponse.json(
    files.map((f) => ({
      ...f,
      downloadUrl: `/api/bookregister/receive/${id}/files/${f.id}`,
    })),
  );
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, message: "Invalid id" }, { status: 400 });
  }

  const required = await requireReceiveRow(id);
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

  if (!isAllowedReceiveFileName(file.name)) {
    return NextResponse.json(
      { ok: false, message: "ชนิดไฟล์ไม่รองรับ (pdf, doc, xls, ppt, รูปภาพ, zip)" },
      { status: 400 },
    );
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" }, { status: 400 });
  }

  const storedName = buildStoredReceiveFileName(required.row.refId, file.name);
  await saveReceiveFileToStorage(storedName, file);

  const [inserted] = await db
    .insert(registerReceiveFiles)
    .values({
      refId: required.row.refId,
      fileName: storedName,
      fileDes: fileDes ?? file.name,
    })
    .returning({
      id: registerReceiveFiles.id,
      fileName: registerReceiveFiles.fileName,
      fileDes: registerReceiveFiles.fileDes,
    });

  return NextResponse.json({
    ok: true,
    file: {
      ...inserted,
      downloadUrl: `/api/bookregister/receive/${id}/files/${inserted.id}`,
    },
  });
}
