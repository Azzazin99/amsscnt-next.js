import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildNewsContentDisposition,
  guessNewsFileMime,
  resolveNewsFilePath,
} from "@/lib/news/files";
import {
  canViewNewsList,
  getNewsPermissions,
} from "@/lib/news/permissions";
import { getNewsArticle } from "@/lib/news/queries";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const perms = await getNewsPermissions(Number(session.user.id));
  if (!canViewNewsList(session.user, perms)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const article = await getNewsArticle(id);
  if (!article?.file) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const filePath = resolveNewsFilePath(article.file);
  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    return NextResponse.json({ message: "File missing" }, { status: 404 });
  }

  const mime = guessNewsFileMime(article.file);
  const disposition = buildNewsContentDisposition(
    article.file,
    article.file,
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
