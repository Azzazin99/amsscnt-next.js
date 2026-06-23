import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  registerCsvFilename,
  renderRegisterCsv,
} from "@/lib/bookregister/export/render-csv";
import {
  canViewDistrictRegisters,
  canViewSecretDocuments,
  canViewSchoolRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import {
  listReceiveReportRows,
  listSendReportRows,
} from "@/lib/bookregister/reports/queries";
import { resolveBookregisterScope } from "@/lib/bookregister/scope";
import { listRegisterYears } from "@/lib/bookregister/years/queries";

export const runtime = "nodejs";

const VALID_KINDS = new Set(["receive", "send"]);

type Ctx = { params: Promise<{ kind: string }> };

function parseYear(raw: string | null): number | null {
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isFinite(year) || year < 2500 || year > 2700) return null;
  return Math.floor(year);
}

export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perms = await getBookregisterPermissions(Number(session.user.id));
  const scope = await resolveBookregisterScope(session.user, perms);
  if (
    !scope ||
    (!canViewDistrictRegisters(session.user, perms) &&
      !canViewSchoolRegisters(session.user))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { kind: kindRaw } = await ctx.params;
  if (!VALID_KINDS.has(kindRaw)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const kind = kindRaw as "receive" | "send";

  const url = new URL(req.url);
  const year = parseYear(url.searchParams.get("year"));
  if (!year) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const years = await listRegisterYears(scope);
  if (!years.some((y) => y.year === year)) {
    return NextResponse.json({ error: "Year not found" }, { status: 404 });
  }

  const visibility = {
    canViewSecret: canViewSecretDocuments(session.user, perms),
  };

  const rows =
    kind === "receive"
      ? await listReceiveReportRows(scope, year, visibility)
      : await listSendReportRows(scope, year, visibility);

  const csv = renderRegisterCsv(kind, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${registerCsvFilename(kind, year)}"`,
    },
  });
}
