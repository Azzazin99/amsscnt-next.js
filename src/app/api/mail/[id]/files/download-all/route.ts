import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  buildMailAttachmentsZip,
  buildMailZipEntryName,
} from "@/lib/mail/build-attachments-zip";
import { buildMailContentDisposition } from "@/lib/mail/files";
import { requireMailFileAccess } from "@/lib/mail/file-access";
import { db } from "@/lib/db";
import { mailFiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const documentId = Number(idParam);
  if (!Number.isFinite(documentId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const required = await requireMailFileAccess(documentId);
  if (!required.ok) {
    return NextResponse.json(
      { message: required.message },
      { status: required.status },
    );
  }

  const rows = await db
    .select({
      fileName: mailFiles.fileName,
      fileDes: mailFiles.fileDes,
    })
    .from(mailFiles)
    .where(eq(mailFiles.refId, required.doc.refId))
    .orderBy(asc(mailFiles.id));

  if (rows.length === 0) {
    return NextResponse.json({ message: "ไม่มีไฟล์แนบ" }, { status: 404 });
  }

  try {
    const zipBuffer = await buildMailAttachmentsZip(
      rows.map((row, index) => ({
        storedName: row.fileName,
        entryName: buildMailZipEntryName(row.fileDes, row.fileName, index),
      })),
    );

    const zipName = `mail-${required.doc.refId}.zip`;
    const bytes = new Uint8Array(zipBuffer);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": buildMailContentDisposition(
          zipName,
          zipName,
          "attachment",
        ),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NO_FILES") {
      return NextResponse.json(
        { message: "ไม่พบไฟล์บนดิสก์" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "สร้างไฟล์ zip ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
