import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leaveRequestFiles, leaveRequests } from "@/lib/db/schema";
import {
  buildContentDisposition,
  guessLeaveFileMime,
  resolveLeaveFilePath,
} from "@/lib/leave/files";
import { canViewLeaveRequest, getLeaveRequest } from "@/lib/leave/queries";
import { getLeavePermissions } from "@/lib/leave/permissions";
import { resolveLeaveScope } from "@/lib/leave/scope";

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

  const perms = await getLeavePermissions(Number(session.user.id));
  const scope = await resolveLeaveScope(session.user, perms);
  if (!scope) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const request = await getLeaveRequest(requestId);
  if (!request || !canViewLeaveRequest(request, scope, session.user.personId)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [fileRow] = await db
    .select({
      id: leaveRequestFiles.id,
      fileName: leaveRequestFiles.fileName,
      fileDes: leaveRequestFiles.fileDes,
      requestId: leaveRequestFiles.requestId,
    })
    .from(leaveRequestFiles)
    .innerJoin(leaveRequests, eq(leaveRequests.id, leaveRequestFiles.requestId))
    .where(
      and(
        eq(leaveRequestFiles.id, fileId),
        eq(leaveRequestFiles.requestId, requestId),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(resolveLeaveFilePath(fileRow.fileName));
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const displayName = (fileRow.fileDes || fileRow.fileName).replace(/[\r\n"]/g, "");
  const mime = guessLeaveFileMime(fileRow.fileName);
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
