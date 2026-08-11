import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { SchoolsListFilters } from "@/components/core/schools-list-filters";
import { buttonVariants } from "@/components/ui/button";
import {
  SCHOOLS_PAGE_SIZE,
  countSchools,
  listSchoolsPage,
  parseSchoolListParams,
  resolveSchoolListPage,
} from "@/lib/core/schools/queries";
import { buildSchoolsListUrl } from "@/lib/core/schools/list-url";
import { schoolTypeLabel } from "@/lib/core/schools/school-type-labels";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function AdminSchoolsPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseSchoolListParams(params);
  const page = await resolveSchoolListPage(parsed);

  const [rows, total] = await Promise.all([
    listSchoolsPage({ ...parsed, page }),
    countSchools(parsed.q, parsed.status),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / SCHOOLS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">สถานศึกษา</h2>
          <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            (ดูได้อย่างเดียวเพื่อประกอบการทำงานระบบบุคลากร การเพิ่ม ลบ แก้ไข สถานศึกษา เป็นหน้าที่ของผู้ดูแลระบบ AMSS++)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            รายการสถานศึกษาในเขตพื้นที่การศึกษา ({total.toLocaleString("th-TH")} รายการ)
          </p>
        </div>
        <Link
          href="/admin/schools/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มสถานศึกษา
        </Link>
      </div>

      <SchoolsListFilters q={parsed.q} status={parsed.status} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อสถานศึกษา</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">กลุ่ม</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {parsed.q.length > 0 && parsed.q.length < 2
                    ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา"
                    : "ไม่พบสถานศึกษา — ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่"}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">
                    {(page - 1) * SCHOOLS_PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                    {row.schoolCode}
                  </td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {schoolTypeLabel(row.schoolType)}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.schoolGroupName ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        row.active
                          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.active ? "ใช้งาน" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/admin/schools/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                      title="แก้ไข"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildSchoolsListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
