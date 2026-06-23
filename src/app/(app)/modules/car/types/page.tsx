import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { CarDeleteButton } from "@/components/car/car-delete-button";
import { deleteCarType } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { listCarTypes } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CarTypesPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const rows = await listCarTypes();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">ประเภทยานพาหนะ</h2>
        <Link
          href="/modules/car/types/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มประเภท
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อประเภท</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีประเภท — กำหนดก่อนเพิ่มยานพาหนะ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.code}</td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 text-center">
                    <CarDeleteButton id={row.id} deleteAction={deleteCarType} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/car/types/${row.id}/edit`}
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
