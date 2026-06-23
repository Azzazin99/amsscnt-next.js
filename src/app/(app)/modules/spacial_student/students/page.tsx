import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { SpacialStudentDeleteButton } from "@/components/spacial-student/spacial-student-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { SPACIAL_DISABLE_TYPES } from "@/lib/spacial-student/constants";
import { buildSpacialStudentListUrl } from "@/lib/spacial-student/list-url";
import { canWriteSpacialStudent } from "@/lib/spacial-student/permissions";
import {
  PAGE_SIZE,
  countSpacialStudents,
  listSchoolsForSpacialFilter,
  listSpacialStudentsPage,
  parseSpacialStudentListParams,
  resolveSpacialStudentListPage,
} from "@/lib/spacial-student/queries";
import { requireSpacialStudentScope } from "@/lib/spacial-student/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; schoolCode?: string; disableType?: string }>;
};

export default async function SpacialStudentStudentsPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireSpacialStudentScope();
  const params = await searchParams;
  const parsed = parseSpacialStudentListParams(params);
  const total = await countSpacialStudents(scope, parsed.q, parsed.schoolCode, parsed.disableType);
  const page = await resolveSpacialStudentListPage(total, parsed.page);
  const [rows, schools] = await Promise.all([
    listSpacialStudentsPage({ scope, ...parsed, page }),
    scope.kind === "district" ? listSchoolsForSpacialFilter() : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = canWriteSpacialStudent(user, perms);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">นักเรียนที่มีความต้องการพิเศษ</h2>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("th-TH")} รายการ</p>
        </div>
        {canWrite ? (
          <Link href="/modules/spacial_student/students/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>เพิ่มรายการ</Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-3">
        <input name="q" defaultValue={parsed.q} placeholder="ค้นหาชื่อ/เลขบัตร" className="h-10 min-w-[12rem] flex-1 rounded-lg border px-3 text-sm" />
        {scope.kind === "district" ? (
          <select name="schoolCode" defaultValue={parsed.schoolCode ?? ""} className="h-10 rounded-lg border px-3 text-sm">
            <option value="">ทุกโรงเรียน</option>
            {schools.map((s) => (<option key={s.schoolCode} value={s.schoolCode}>{s.name}</option>))}
          </select>
        ) : null}
        <select name="disableType" defaultValue={parsed.disableType ?? ""} className="h-10 rounded-lg border px-3 text-sm">
          <option value="">ทุกประเภท</option>
          {SPACIAL_DISABLE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: "secondary" }), "min-h-10")}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ชื่อ-สกุล</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">ชั้น</th>
              <th className="px-3 py-3 font-medium">โรงเรียน</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              {canWrite ? <th className="px-3 py-3 text-center font-medium">ลบ</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={canWrite ? 6 : 5} className="px-3 py-8 text-center text-muted-foreground">ไม่พบรายการ</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5">{row.disableTypeLabel}</td>
                  <td className="px-3 py-2.5">{row.classLevelLabel ?? "—"}</td>
                  <td className="px-3 py-2.5">{row.schoolName ?? row.schoolCode}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/spacial_student/students/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข"><Pencil className="size-4" /></Link>
                  </td>
                  {canWrite ? <td className="px-3 py-2.5 text-center"><SpacialStudentDeleteButton id={row.id} /></td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} totalPages={totalPages} hrefForPage={(p) => buildSpacialStudentListUrl({ ...parsed, page: p })} />
    </section>
  );
}
