import Link from "next/link";
import { redirect } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { NewsSectionDeleteButton } from "@/components/news/news-section-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { buildNewsSectionsUrl } from "@/lib/news/list-url";
import { canManageNewsSettings } from "@/lib/news/permissions";
import {
  NEWS_PAGE_SIZE,
  countNewsSections,
  getActiveNewsMainitem,
  listNewsSectionsPage,
} from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function NewsSectionsPage({ searchParams }: Props) {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const active = await getActiveNewsMainitem();
  if (!active) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        กำหนดชื่อเรื่องปัจจุบันก่อนที่เมนู &quot;ชื่อเรื่อง&quot;
      </section>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const total = await countNewsSections(active.code);
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = await listNewsSectionsPage({
    mainitemCode: active.code,
    page: safePage,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ประเภทข่าว — {active.mainitem}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        <Link
          href="/modules/news/sections/new"
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
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีประเภทข่าว
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
                    <Link
                      href={`/modules/news/sections/${row.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      แก้ไข
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <NewsSectionDeleteButton id={row.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={safePage}
        totalPages={totalPages}
        hrefForPage={(p) => buildNewsSectionsUrl({ page: p })}
      />
    </section>
  );
}
