import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { permissionRequestFiles, permissionRequests } from "@/lib/db/schema";
import {
  buildContentDisposition,
  guessPermissionFileMime,
  resolvePermissionFilePath,
} from "@/lib/permission/files";
import { getPermissionModuleFlags } from "@/lib/permission/permissions";
import {
  canViewPermissionRequest,
  getPermissionRequest,
} from "@/lib/permission/queries";
import { resolvePermissionScope } from "@/lib/permission/scope";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam, fileId: fileIdParam } = await ctx.params;
  const requestId = Number(idParam);
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(requestId) || !Number.isFinite(fileId)) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const perms = await getPermissionModuleFlags(Number(session.user.id));
  const scope = await resolvePermissionScope(session.user, perms);
  if (!scope) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const request = await getPermissionRequest(requestId);
  if (
    !request ||
    !canViewPermissionRequest(request, scope, session.user.personId)
  ) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [fileRow] = await db
    .select({
      id: permissionRequestFiles.id,
      fileName: permissionRequestFiles.fileName,
      fileDes: permissionRequestFiles.fileDes,
      requestId: permissionRequestFiles.requestId,
    })
    .from(permissionRequestFiles)
    .innerJoin(
      permissionRequests,
      eq(permissionRequests.id, permissionRequestFiles.requestId),
    )
    .where(
      and(
        eq(permissionRequestFiles.id, fileId),
        eq(permissionRequestFiles.requestId, requestId),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(resolvePermissionFilePath(fileRow.fileName));
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const displayName = (fileRow.fileDes || fileRow.fileName).replace(
    /[\r\n"]/g,
    "",
  );
  const mime = guessPermissionFileMime(fileRow.fileName);
  const inline = mime === "application/pdf" || mime.startsWith("image/");

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": buildContentDisposition(
        displayName,
        fileRow.fileName,
        inline ? "inline" : "attachment",
      ),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
