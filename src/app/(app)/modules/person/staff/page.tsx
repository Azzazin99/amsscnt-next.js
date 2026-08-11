import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { PersonCsvExportLink } from "@/components/person/person-csv-export-link";
import { PersonDeactivateButton } from "@/components/person/person-deactivate-button";
import { PersonDistrictStaffTable } from "@/components/person/person-district-staff-table";
import { PersonSchoolStaffTable } from "@/components/person/person-school-staff-table";
import { PersonPendingApprovalTable } from "@/components/person/person-pending-approval-table";
import { PersonMultiSchoolStaffTable } from "@/components/person/person-multi-school-staff-table";
import { PersonListFilters } from "@/components/person/person-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildPersonListUrl } from "@/lib/person/list-url";
import {
  canDeletePerson,
  canWritePerson,
} from "@/lib/person/permissions";
import {
  PERSON_PAGE_SIZE,
  countPeople,
  listPeoplePage,
  listSchoolsForPersonFilter,
  listWorkgroupsForPersonFilter,
  parsePersonListParams,
  resolvePersonListPage,
} from "@/lib/person/queries";
import { requirePersonScope } from "@/lib/person/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    org?: string;
    schoolId?: string;
    workgroupId?: string;
  }>;
};

export default async function PersonStaffPage({ searchParams }: Props) {
  const { user, perms, scope } = await requirePersonScope();
  const params = await searchParams;
  const parsed = parsePersonListParams(params);
  const page = await resolvePersonListPage(scope, parsed);

  const [rows, total, schools, workgroups] = await Promise.all([
    listPeoplePage({ ...parsed, page, scope }),
    countPeople(
      scope,
      parsed.q,
      parsed.status,
      parsed.org,
      parsed.schoolId,
      parsed.workgroupId,
      parsed.filter,
    ),
    scope.kind === "district" ? listSchoolsForPersonFilter() : Promise.resolve([]),
    scope.kind === "district" ? listWorkgroupsForPersonFilter() : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PERSON_PAGE_SIZE));
  const canWrite = canWritePerson(user, perms);
  const canDelete = canDeletePerson(user, perms);
  const isSchoolView = parsed.org === "school" || scope.kind === "school";
  const isDistrictView = !isSchoolView && (parsed.org === "district" || scope.kind === "district");
  const pageOffset = (page - 1) * PERSON_PAGE_SIZE;

  return (
    <section className="space-y-4">
      {parsed.filter === "multi-school" || parsed.status === "pending" ? null : isDistrictView ? (
        <div className="space-y-2 text-center">
          <h2 className="text-base font-bold text-teal-800 dark:text-teal-300 md:text-lg">
            ข้อมูลครูและบุคลากรในสำนักงานเขตพื้นที่การศึกษา (ปัจจุบัน)
          </h2>
          <div className="flex items-center justify-between gap-3 pt-1">
            {canWrite ? (
              <Link
                href="/modules/person/staff/new"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-slate-300 bg-slate-100 text-xs text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                )}
              >
                เพิ่มข้อมูล
              </Link>
            ) : <div />}
            <p className="text-xs text-muted-foreground">
              ทั้งหมด {total.toLocaleString("th-TH")} คน
            </p>
          </div>
        </div>
      ) : isSchoolView ? (
        <div className="space-y-2 text-center">
          <h2 className="text-base font-bold text-teal-800 dark:text-teal-300 md:text-lg">
            ข้อมูลครูและบุคลากรในสถานศึกษา (ปัจจุบัน)
          </h2>
          <div className="flex items-center justify-between gap-3 pt-1">
            {canWrite ? (
              <Link
                href="/modules/person/staff/new"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-slate-300 bg-slate-100 text-xs text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                )}
              >
                เพิ่มข้อมูล
              </Link>
            ) : <div />}
            <p className="text-xs text-muted-foreground">
              ทั้งหมด {total.toLocaleString("th-TH")} คน
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">รายชื่อบุคลากร</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {total.toLocaleString("th-TH")} คน
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PersonCsvExportLink
              q={parsed.q}
              status={parsed.status}
              org={parsed.org}
              schoolId={parsed.schoolId}
              workgroupId={parsed.workgroupId}
            />
            {canWrite ? (
              <Link
                href="/modules/person/staff/new"
                className={cn(buttonVariants(), "inline-flex min-h-11")}
              >
                เพิ่มบุคลากร
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <PersonListFilters
        q={parsed.q}
        status={parsed.status}
        org={parsed.org}
        schoolId={parsed.schoolId}
        workgroupId={parsed.workgroupId}
        showDistrictFilters={scope.kind === "district"}
        schools={schools}
        workgroups={workgroups}
      />

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildPersonListUrl({ ...parsed, page: p })}
      />

      {parsed.filter === "multi-school" ? (
        <PersonMultiSchoolStaffTable
          rows={rows}
          canWrite={canWrite}
          canDelete={canDelete}
          pageOffset={pageOffset}
        />
      ) : parsed.status === "pending" ? (
        <PersonPendingApprovalTable
          rows={rows}
          canWrite={canWrite}
          pageOffset={pageOffset}
        />
      ) : isDistrictView ? (
        <PersonDistrictStaffTable
          rows={rows}
          canWrite={canWrite}
          canDelete={canDelete}
          pageOffset={pageOffset}
        />
      ) : isSchoolView ? (
        <PersonSchoolStaffTable
          rows={rows}
          canWrite={canWrite}
          canDelete={canDelete}
          pageOffset={pageOffset}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">เลขบัตร</th>
                <th className="px-3 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-3 py-3 font-medium">ระดับ</th>
                <th className="px-3 py-3 font-medium">หน่วยงาน</th>
                <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-3 py-3 text-center font-medium">สถานะ</th>
                <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
                {canDelete ? (
                  <th className="px-3 py-3 text-center font-medium">ลบ</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={canDelete ? 8 : 7}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs">{row.personId}</td>
                    <td className="px-3 py-2.5">{row.displayName}</td>
                    <td className="px-3 py-2.5">
                      {row.organizationType === "school" ? "โรงเรียน" : "เขต"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {row.schoolName ?? row.workgroupName ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">{row.positionLabel}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.status === 0
                            ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {row.status === 0 ? "ใช้งาน" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {canWrite ? (
                        <Link
                          href={`/modules/person/staff/${row.id}/edit`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                          aria-label="แก้ไข"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    {canDelete ? (
                      <td className="px-3 py-2.5 text-center">
                        {row.status === 0 ? (
                          <PersonDeactivateButton id={row.id} />
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildPersonListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
