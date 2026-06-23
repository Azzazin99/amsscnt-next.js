import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { RegisterReportKind } from "@/lib/bookregister/reports/columns";
import {
  canViewSecretDocuments,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { getCachedReportRows } from "@/lib/bookregister/reports/cached-queries";
import {
  registerReportFilename,
  renderRegisterReportHtml,
} from "@/lib/bookregister/reports/render-html";
import { getDistrictOfficeName } from "@/lib/bookregister/send/queries";
import { resolveBookregisterScope } from "@/lib/bookregister/scope";
import { listRegisterYears } from "@/lib/bookregister/years/queries";

export const runtime = "nodejs";

const VALID_KINDS = new Set<RegisterReportKind>([
  "receive",
  "send",
  "command",
]);

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
  if (!scope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { kind: kindRaw } = await ctx.params;
  if (!VALID_KINDS.has(kindRaw as RegisterReportKind)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const kind = kindRaw as RegisterReportKind;

  if (kind === "command" && scope.kind === "school") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const [officeName, rows] = await Promise.all([
    scope.kind === "school"
      ? Promise.resolve(scope.schoolName)
      : getDistrictOfficeName(),
    getCachedReportRows(kind, scope, year, visibility.canViewSecret),
  ]);

  const html = renderRegisterReportHtml({
    kind,
    year,
    officeName:
      officeName ||
      (scope.kind === "school"
        ? scope.schoolName
        : "สำนักงานเขตพื้นที่การศึกษา"),
    rows,
    forExcel: true,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${registerReportFilename(kind, year)}"`,
    },
  });
}
