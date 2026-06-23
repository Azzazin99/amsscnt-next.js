import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { CarDeleteButton } from "@/components/car/car-delete-button";
import { deleteCarDriver } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { listCarDrivers } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CarDriversPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const rows = await listCarDrivers();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">พนักงานขับรถ</h2>
        <Link
          href="/modules/car/drivers/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มพนักงานขับรถ
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">เลขบัตร</th>
              <th className="px-3 py-3 text-center font-medium">ปฏิบัติหน้าที่</th>
              <th className="px-3 py-3 font-medium">วันที่บันทึก</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
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
                  ยังไม่มีพนักงานขับรถ
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{row.personId}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.status === 1 ? "ใช่" : "ไม่ใช่"}
                  </td>
                  <td className="px-3 py-2.5">{row.recDate ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <CarDeleteButton id={row.id} deleteAction={deleteCarDriver} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/car/drivers/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
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
    </section>
  );
}
