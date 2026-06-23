import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireMailFileAccess } from "@/lib/mail/file-access";
import {
  uploadMailAttachment,
  validateMailAttachmentFile,
  validateMailAttachmentTotalForRef,
} from "@/lib/mail/upload-attachment";
import { canWriteMail } from "@/lib/mail/permissions";
import { db } from "@/lib/db";
import { mailFiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json([], { status: 200 });

  const required = await requireMailFileAccess(id);
  if (!required.ok) {
    return NextResponse.json(
      { message: required.message },
      { status: required.status },
    );
  }

  const files = await db
    .select({
      id: mailFiles.id,
      fileName: mailFiles.fileName,
      fileDes: mailFiles.fileDes,
    })
    .from(mailFiles)
    .where(eq(mailFiles.refId, required.doc.refId))
    .orderBy(asc(mailFiles.id));

  return NextResponse.json(
    files.map((f) => ({
      ...f,
      downloadUrl: `/api/mail/${id}/files/${f.id}`,
    })),
  );
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, message: "Invalid id" }, { status: 400 });
  }

  const required = await requireMailFileAccess(id);
  if (!required.ok) {
    return NextResponse.json(
      { ok: false, message: required.message },
      { status: required.status },
    );
  }

  if (!canWriteMail(required.user, required.perms) || !required.isSender) {
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

  const validated = validateMailAttachmentFile(file);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, message: validated.message },
      { status: 400 },
    );
  }

  const totalCheck = await validateMailAttachmentTotalForRef(
    required.doc.refId,
    file.size,
  );
  if (!totalCheck.ok) {
    return NextResponse.json(
      { ok: false, message: totalCheck.message },
      { status: 400 },
    );
  }

  let inserted;
  try {
    inserted = await uploadMailAttachment(
      required.doc.refId,
      file,
      fileDes,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "บันทึกไฟล์ไม่สำเร็จ";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  if (!inserted) {
    return NextResponse.json(
      { ok: false, message: "บันทึกไฟล์ไม่สำเร็จ" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    file: {
      ...inserted,
      downloadUrl: `/api/mail/${id}/files/${inserted.id}`,
    },
  });
}
