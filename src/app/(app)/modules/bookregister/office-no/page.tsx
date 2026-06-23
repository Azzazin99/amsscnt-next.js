import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OfficeNoForm } from "@/components/bookregister/office-no/office-no-form";
import { formatThaiDate } from "@/lib/format/thai-date";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { upsertDistrictOfficeNo } from "@/lib/bookregister/office-no/actions";
import {
  getDistrictOfficeNumberRow,
  listDistrictOfficeNumbers,
} from "@/lib/bookregister/office-no/queries";

export default async function DistrictOfficeNoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const [districtRow, allRows] = await Promise.all([
    getDistrictOfficeNumberRow(),
    listDistrictOfficeNumbers(),
  ]);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <OfficeNoForm
          title="กำหนดเลขที่หนังสือ — สำนักงานเขต"
          cancelHref="/modules/bookregister"
          defaultOfficeNo={districtRow?.officeNo ?? ""}
          action={upsertDistrictOfficeNo}
        />
      </div>

      {allRows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">เลขที่ (prefix)</th>
                <th className="px-4 py-3 font-medium">วันที่บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">
                    {row.officeNo}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatThaiDate(row.recDate) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          ยังไม่มีข้อมูล — บันทึก prefix ด้านบนก่อน{" "}
          <Link
            href="/modules/bookregister/send/new"
            className="font-medium text-primary underline"
          >
            ลงทะเบียนส่ง
          </Link>
        </p>
      )}
    </section>
  );
}
