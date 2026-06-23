import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { StudentDeleteButton } from "@/components/student-main/student-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { classLevelLabel } from "@/lib/student-main/constants";
import { buildStudentListUrl } from "@/lib/student-main/list-url";
import { canWriteStudent } from "@/lib/student-main/permissions";
import {
  PAGE_SIZE,
  countStudents,
  getActiveStudentEdYear,
  listSchoolsForStudentFilter,
  listStudentsPage,
  parseStudentListParams,
  resolveStudentListPage,
} from "@/lib/student-main/queries";
import { requireStudentScope } from "@/lib/student-main/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; edYear?: string; schoolCode?: string; classLevel?: string }>;
};

export default async function StudentMainStudentsPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireStudentScope();
  const params = await searchParams;
  const parsed = parseStudentListParams(params);
  const activeYear = await getActiveStudentEdYear();
  const edYear = parsed.edYear ?? activeYear?.edYear ?? null;

  const total = await countStudents(scope, parsed.q, edYear, parsed.schoolCode, parsed.classLevel);
  const page = await resolveStudentListPage(total, parsed.page);
  const [rows, schools] = await Promise.all([
    listStudentsPage({ scope, page, q: parsed.q, edYear, schoolCode: parsed.schoolCode, classLevel: parsed.classLevel }),
    scope.kind === "district" ? listSchoolsForStudentFilter() : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = canWriteStudent(user, perms);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">รายชื่อนักเรียน</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} คน
            {edYear ? ` · ปี ${edYear}` : activeYear ? "" : " · ยังไม่ได้กำหนดปีการศึกษา"}
          </p>
        </div>
        {canWrite ? (
          <Link href="/modules/student_main/students/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>เพิ่มนักเรียน</Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-3">
        <input name="q" defaultValue={parsed.q} placeholder="ค้นหาชื่อ/เลขประจำตัว" className="h-10 min-w-[12rem] flex-1 rounded-lg border px-3 text-sm" />
        <input name="edYear" type="number" defaultValue={edYear ?? ""} placeholder="ปี พ.ศ." className="h-10 w-28 rounded-lg border px-3 text-sm" />
        {scope.kind === "district" ? (
          <select name="schoolCode" defaultValue={parsed.schoolCode ?? ""} className="h-10 rounded-lg border px-3 text-sm">
            <option value="">ทุกโรงเรียน</option>
            {schools.map((s) => (<option key={s.schoolCode} value={s.schoolCode}>{s.name}</option>))}
          </select>
        ) : null}
        <select name="classLevel" defaultValue={parsed.classLevel ?? ""} className="h-10 rounded-lg border px-3 text-sm">
          <option value="">ทุกชั้น</option>
          {Array.from({ length: 15 }, (_, i) => i + 1).map((v) => (<option key={v} value={v}>{classLevelLabel(v)}</option>))}
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: "secondary" }), "min-h-10")}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">เลขนักเรียน</th>
              <th className="px-3 py-3 font-medium">ชื่อ-สกุล</th>
              <th className="px-3 py-3 font-medium">ชั้น</th>
              <th className="px-3 py-3 font-medium">โรงเรียน</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              {canWrite ? <th className="px-3 py-3 text-center font-medium">ลบ</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={canWrite ? 6 : 5} className="px-3 py-8 text-center text-muted-foreground">ไม่พบนักเรียน</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-mono text-xs">{row.studentId}</td>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5">{row.classLevelLabel} / {row.classroom}</td>
                  <td className="px-3 py-2.5">{row.schoolName}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/student_main/students/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข"><Pencil className="size-4" /></Link>
                  </td>
                  {canWrite ? <td className="px-3 py-2.5 text-center"><StudentDeleteButton id={row.id} /></td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} totalPages={totalPages} hrefForPage={(p) => buildStudentListUrl({ ...parsed, edYear, page: p })} />
    </section>
  );
}
