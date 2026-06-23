import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { canManageLeaveSettings } from "@/lib/leave/permissions";
import { listLeaveGrantPersonRows } from "@/lib/leave/grant-persons-queries";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LeaveGrantPersonsPage() {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const rows = await listLeaveGrantPersonRows();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        กำหนดผู้อนุมัติ (สพท.)
      </h2>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-3 py-3 font-medium">ผู้เห็นชอบ (ผอ.กลุ่ม)</th>
              <th className="px-3 py-3 font-medium">
                ผู้เห็นชอบ (รอง ผอ.สพท.)
              </th>
              <th className="px-3 py-3 font-medium">ผู้อนุมัติ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.personId}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.positionLabel}
                </td>
                <td className="px-3 py-2.5">
                  {row.commentPersonName ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  {row.commentPerson2Name ?? "—"}
                </td>
                <td className="px-3 py-2.5">{row.grantPersonName ?? "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/modules/leave/grant-persons/${row.personId}/edit`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                    aria-label={`แก้ไข ${row.displayName}`}
                  >
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
