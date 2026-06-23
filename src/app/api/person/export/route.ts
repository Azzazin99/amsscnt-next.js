import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  personCsvFilename,
  renderPersonCsv,
} from "@/lib/person/export/render-csv";
import { canViewPersonList, getPersonPermissions } from "@/lib/person/permissions";
import {
  listPeopleForExport,
  parsePersonListParams,
} from "@/lib/person/queries";
import { resolvePersonScope } from "@/lib/person/scope";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perms = await getPersonPermissions(Number(session.user.id));
  const scope = await resolvePersonScope(session.user, perms);
  if (!scope || !canViewPersonList(session.user, perms)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = parsePersonListParams({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    org: url.searchParams.get("org") ?? undefined,
    schoolId: url.searchParams.get("schoolId") ?? undefined,
    workgroupId: url.searchParams.get("workgroupId") ?? undefined,
  });

  const rows = await listPeopleForExport({
    scope,
    q: parsed.q,
    status: parsed.status,
    org: parsed.org,
    schoolId: parsed.schoolId,
    workgroupId: parsed.workgroupId,
  });

  const csv = renderPersonCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${personCsvFilename()}"`,
    },
  });
}
