import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  buildCabinetContentDisposition,
  guessCabinetFileMime,
  resolveCabinetFilePath,
} from "@/lib/cabinet/files";
import {
  canViewCabinetList,
  getCabinetPermissions,
} from "@/lib/cabinet/permissions";
import { getCabinetDocument } from "@/lib/cabinet/queries";
import { auth } from "@/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const perms = await getCabinetPermissions(Number(session.user.id));
  if (!canViewCabinetList(session.user, perms)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const doc = await getCabinetDocument(id);
  if (!doc) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const filePath = resolveCabinetFilePath(doc.docName);
  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    return NextResponse.json({ message: "File missing" }, { status: 404 });
  }

  const mime = guessCabinetFileMime(doc.docName);
  const disposition = buildCabinetContentDisposition(
    doc.docSubject,
    doc.docName,
    "inline",
  );

  const bytes = new Uint8Array(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": disposition,
      "Content-Length": String(buf.byteLength),
    },
  });
}
