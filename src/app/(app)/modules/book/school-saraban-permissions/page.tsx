import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { SchoolSarabanDeleteButton } from "@/components/book/school-saraban-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import {
  listSchoolSarabanPermissions,
  listSchoolsForPicker,
} from "@/lib/book/permissions/queries";
import { cn } from "@/lib/utils";

import { resolveSchoolIdByCode } from "@/lib/book/scope";

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function SchoolSarabanPermissionsPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isDistrictAdmin = isBookModuleAdmin(session.user);
  const isSchoolAdmin =
    session.user.organizationType === "school" &&
    session.user.loginStatus >= 12 &&
    session.user.loginStatus <= 15;

  if (!isDistrictAdmin && !isSchoolAdmin) {
    redirect("/modules/book");
  }

  const { schoolId: schoolIdParam } = await searchParams;

  let filterSchoolId: number | undefined;

  if (isSchoolAdmin) {
    const userSchoolId = session.user.userSchoolCode
      ? await resolveSchoolIdByCode(session.user.userSchoolCode)
      : undefined;
    filterSchoolId = userSchoolId ?? undefined;
  } else if (schoolIdParam) {
    filterSchoolId = Number(schoolIdParam);
  }

  const [rows, schools] = await Promise.all([
    listSchoolSarabanPermissions(filterSchoolId),
    isDistrictAdmin ? listSchoolsForPicker() : Promise.resolve([]),
  ]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            กำหนดสารบรรณ สถานศึกษา
          </h2>
          <p className="text-sm text-muted-foreground">
            กำหนดผู้มีหน้าที่เป็นสารบรรณประจำสถานศึกษา (สิทธิ์ p3)
          </p>
        </div>
        <Link
          href="/modules/book/school-saraban-permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มสารบรรณ สถานศึกษา
        </Link>
      </div>

      {isDistrictAdmin ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border bg-card p-4 shadow-sm">
          <label htmlFor="school-filter" className="text-sm font-medium">
            กรองตามโรงเรียน:
          </label>
          <form method="get" className="flex items-center gap-2">
            <select
              id="school-filter"
              name="schoolId"
              defaultValue={schoolIdParam ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">ทั้งหมดทุกโรงเรียน</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.schoolCode})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex h-10 px-3",
              )}
            >
              ค้นหา
            </button>
          </form>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">โรงเรียน / สถานศึกษา</th>
              <th className="px-3 py-3 font-medium">ชื่อ-นามสกุล สารบรรณ</th>
              <th className="px-3 py-3 text-center font-medium">
                สิทธิ์สารบรรณ (p3)
              </th>
              <th className="px-3 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีผู้ได้รับสิทธิ์สารบรรณสถานศึกษา — กด &quot;เพิ่มสารบรรณ
                  สถานศึกษา&quot;
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">
                    {row.schoolName ?? "-"}
                    {row.schoolCode ? ` (${row.schoolCode})` : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    {formatPersonName({
                      prefix: row.prefix,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      fallback: row.displayName,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium text-green-600">
                    เปิดใช้งาน ({row.p3})
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <SchoolSarabanDeleteButton id={row.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
