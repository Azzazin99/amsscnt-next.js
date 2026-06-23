import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import {
  buildContentDisposition,
  guessReceiveFileMime,
} from "@/lib/bookregister/receive/files";
import { resolveCommandFilePath } from "@/lib/bookregister/command/files";
import {
  canViewDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { db } from "@/lib/db";
import { registerCommands } from "@/lib/db/schema";

export const runtime = "nodejs";

type Ctx = RouteContext<"/api/bookregister/command/[id]/file">;

export async function GET(_req: Request, ctx: Ctx) {
  const { id: idParam } = await ctx.params;
  const commandId = Number(idParam);
  if (!Number.isFinite(commandId)) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const [row] = await db
    .select({
      fileName: registerCommands.fileName,
    })
    .from(registerCommands)
    .where(
      and(
        eq(registerCommands.id, commandId),
        isNull(registerCommands.schoolId),
        isNull(registerCommands.deletedAt),
      ),
    )
    .limit(1);

  if (!row?.fileName) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const safeName = path.basename(row.fileName);
  const fullPath = resolveCommandFilePath(safeName);

  let buf: Buffer;
  try {
    buf = await readFile(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const mime = guessReceiveFileMime(safeName);
  const inline = mime === "application/pdf" || mime.startsWith("image/");
  const bytes = new Uint8Array(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": buildContentDisposition(
        safeName,
        safeName,
        inline ? "inline" : "attachment",
      ),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
