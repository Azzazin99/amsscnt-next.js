import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { NewsMainitemDeleteButton } from "@/components/news/news-mainitem-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { listNewsMainitems } from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";
import { cn } from "@/lib/utils";

export default async function NewsMainitemsPage() {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const rows = await listNewsMainitems();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กำหนดชื่อเรื่อง</h2>
        <Link
          href="/modules/news/mainitems/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มชื่อเรื่อง
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อเรื่อง</th>
              <th className="px-3 py-3 text-center font-medium">ใช้งานปัจจุบัน</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีชื่อเรื่อง
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.code}</td>
                  <td className="px-3 py-2.5">{row.mainitem}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.itemActive ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/news/mainitems/${row.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      แก้ไข
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <NewsMainitemDeleteButton id={row.id} />
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
