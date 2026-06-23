import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { CarDeleteButton } from "@/components/car/car-delete-button";
import { deleteCarVehicle } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { listCarVehicles } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CarVehiclesPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const rows = await listCarVehicles();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">ยานพาหนะ</h2>
        <Link
          href="/modules/car/vehicles/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มยานพาหนะ
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">ทะเบียน</th>
              <th className="px-3 py-3 font-medium">สถานะ</th>
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
                  ยังไม่มียานพาหนะ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.carCode}</td>
                  <td className="px-3 py-2.5">{row.typeName ?? row.carTypeCode}</td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5">{row.carNumber}</td>
                  <td className="px-3 py-2.5">{row.statusLabel}</td>
                  <td className="px-3 py-2.5 text-center">
                    <CarDeleteButton id={row.id} deleteAction={deleteCarVehicle} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/car/vehicles/${row.id}/edit`}
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
