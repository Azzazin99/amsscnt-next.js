import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { YearActiveToggle } from "@/components/bookregister/year-active-toggle";
import { YearDeleteButton } from "@/components/bookregister/year-delete-button";
import { buttonVariants } from "@/components/ui/button";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { listDistrictYears } from "@/lib/bookregister/years/queries";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function DistrictYearsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const years = await listDistrictYears();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กำหนดปีปฏิทิน</h2>
        <Link
          href="/modules/bookregister/years/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มปีปฏิทิน
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ปีปฏิทิน</th>
              <th className="px-3 py-3 font-medium text-center">
                ปีทะเบียนปัจจุบัน
              </th>
              <th className="px-3 py-3 font-medium text-center">รับ</th>
              <th className="px-3 py-3 font-medium text-center">ส่ง</th>
              <th className="px-3 py-3 font-medium text-center">คำสั่ง</th>
              <th className="px-3 py-3 font-medium text-center">เกียรติบัตร</th>
              <th className="px-3 py-3 font-medium text-center">ลบ</th>
              <th className="px-3 py-3 font-medium text-center">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีปีทะเบียน — กด &quot;เพิ่มปีปฏิทิน&quot;
                </td>
              </tr>
            ) : (
              years.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.year}</td>
                  <td className="px-3 py-2.5 text-center">
                    <YearActiveToggle id={row.id} active={row.yearActive} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.startReceiveNum}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.startSendNum}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.startCommandNum}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.startCertificateNum}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <YearDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/bookregister/years/${row.id}/edit`}
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

      <p className="mt-4 text-sm text-muted-foreground">
        กรณีต้องการปิดการใช้งานทะเบียนใด ให้กำหนดค่าเริ่มต้นทะเบียนนั้นเป็นศูนย์ (0)
      </p>
    </>
  );
}
