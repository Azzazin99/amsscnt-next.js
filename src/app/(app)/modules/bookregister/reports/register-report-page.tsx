import { notFound, redirect } from "next/navigation";
import { RegisterReportTable } from "@/components/bookregister/reports/register-report-table";
import { RegisterReportToolbar } from "@/components/bookregister/reports/register-report-toolbar";
import type { RegisterReportKind } from "@/lib/bookregister/reports/columns";
import { canViewSecretDocuments } from "@/lib/bookregister/permissions";
import { getCachedReportRows } from "@/lib/bookregister/reports/cached-queries";
import { getDistrictOfficeName } from "@/lib/bookregister/send/queries";
import { requireBookregisterScope } from "@/lib/bookregister/scope";
import { listRegisterYears } from "@/lib/bookregister/years/queries";

type SearchParams = Promise<{ year?: string }>;

function parseYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isFinite(year) || year < 2500 || year > 2700) return null;
  return Math.floor(year);
}

async function loadReportRows(
  kind: RegisterReportKind,
  scope: Awaited<ReturnType<typeof requireBookregisterScope>>["scope"],
  year: number,
  visibility: { canViewSecret: boolean },
) {
  return getCachedReportRows(kind, scope, year, visibility.canViewSecret);
}

export async function RegisterReportPage({
  kind,
  searchParams,
}: {
  kind: RegisterReportKind;
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const year = parseYear(params.year);
  if (!year) notFound();

  const { user, perms, scope } = await requireBookregisterScope();

  if (kind === "command" && scope.kind === "school") {
    redirect("/modules/bookregister/reports");
  }

  const visibility = {
    canViewSecret: canViewSecretDocuments(user, perms),
  };

  const [rows, officeName, years] = await Promise.all([
    loadReportRows(kind, scope, year, visibility),
    scope.kind === "school"
      ? Promise.resolve(scope.schoolName)
      : getDistrictOfficeName(),
    listRegisterYears(scope),
  ]);

  const validYears = new Set(years.map((y) => y.year));
  if (!validYears.has(year)) notFound();

  return (
    <div className="space-y-4">
      <RegisterReportToolbar kind={kind} year={year} rowCount={rows.length} />
      <RegisterReportTable
        kind={kind}
        year={year}
        officeName={
          officeName ||
          (scope.kind === "school"
            ? scope.schoolName
            : "สำนักงานเขตพื้นที่การศึกษา")
        }
        rows={rows}
      />
    </div>
  );
}
