import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertPgDumpAvailable,
  isLegacyDumpExportEnabled,
  isLegacyDumpExportRunning,
  legacyDumpFilename,
  streamLegacyDumpExport,
} from "@/lib/dev/legacy-dump-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(req: Request) {
  if (!isLegacyDumpExportEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isLegacyDumpExportRunning()) {
    return NextResponse.json(
      { error: "Export already in progress" },
      { status: 429 },
    );
  }

  try {
    await assertPgDumpAvailable();
  } catch (err) {
    const message = err instanceof Error ? err.message : "pg_dump unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const ip = clientIp(req);
  const personId = session.user.personId ?? session.user.id;

  try {
    const body = streamLegacyDumpExport({
      onAudit: (msg) => {
        console.info(`${msg} person_id=${personId} ip=${ip}`);
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${legacyDumpFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    const status = message.includes("already in progress") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
